// src/frontend/services/openFdaService.js

/**
 * Maps raw OpenFDA JSON to our local Medicine format so components don't have to handle 
 * two entirely different data structures.
 */
function mapFdaToLocalFormat(fdaData) {
  const name = fdaData.openfda?.brand_name?.[0] || fdaData.openfda?.generic_name?.[0] || 'Unknown Medicine';
  
  // Extract key medical data from FDA response arrays
  const dosage = fdaData.dosage_and_administration?.[0] || fdaData.active_ingredient?.[0] || '';
  const usageInstructions = fdaData.purpose?.[0] || fdaData.indications_and_usage?.[0] || '';
  const precautions = fdaData.warnings?.[0] || fdaData.boxed_warning?.[0] || '';
  const sideEffects = fdaData.adverse_reactions?.[0] || fdaData.openfda?.substance_name?.[0] || '';
  const simpleExplanation = fdaData.description?.[0] || 'Data dynamically fetched from OpenFDA Database.';

  return {
    isLocal: false,
    // Provide a fallback barcode if none exists (just for UI keys)
    barcode: fdaData.openfda?.upc?.[0] || `fda-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    dosage: truncateText(dosage, 100),
    
    // Always map to the "_en" suffixed keys for our multilingual Voice Assistant to translate properly
    usageInstructions_en: cleanText(usageInstructions),
    precautions_en: cleanText(precautions),
    sideEffects_en: cleanText(sideEffects),
    simpleExplanation_en: cleanText(simpleExplanation),
    
    // Also include the base attributes
    usageInstructions: cleanText(usageInstructions),
    precautions: cleanText(precautions),
    sideEffects: cleanText(sideEffects),
    simpleExplanation: cleanText(simpleExplanation),
    
    manufacturer: fdaData.openfda?.manufacturer_name?.[0] || 'Unknown Manufacturer',
    rawFda: fdaData,
    openfda: fdaData.openfda
  };
}

function cleanText(text) {
  if (!text) return '';
  // FDA text often contains ALL CAPS with "PURPOSE:" prefixes. Let's clean it up slightly.
  let cleaned = text.replace(/^[A-Z\s]+:\s*/i, '');
  
  // Keep it short and simple: extract only the first sentence
  const sentenceMatch = cleaned.match(/.*?[.!?](?:\s|$)/);
  if (sentenceMatch && sentenceMatch[0]) {
    cleaned = sentenceMatch[0].trim();
  }
  
  return truncateText(cleaned, 150);
}

function truncateText(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '...';
}

async function translateText(text, targetLang) {
  if (!text) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    let translated = "";
    if (data && data[0]) {
      data[0].forEach(part => {
        if (part[0]) translated += part[0];
      });
    }
    return translated;
  } catch (err) {
    console.warn(`Translation failed for ${targetLang}`, err);
    return text; // fallback to original on failure
  }
}

async function translateMedicineFields(medicine, targetLang) {
  const [u, p, s, e] = await Promise.all([
    translateText(medicine.usageInstructions_en, targetLang),
    translateText(medicine.precautions_en, targetLang),
    translateText(medicine.sideEffects_en, targetLang),
    translateText(medicine.simpleExplanation_en, targetLang)
  ]);
  medicine[`usageInstructions_${targetLang}`] = u;
  medicine[`precautions_${targetLang}`] = p;
  medicine[`sideEffects_${targetLang}`] = s;
  medicine[`simpleExplanation_${targetLang}`] = e;
}

/**
 * Searches OpenFDA by brand name or generic name.
 * @param {string} query 
 * @returns {Array} Array of mapped medicine objects
 */
export async function searchOpenFdaByName(query) {
  try {
    const res = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(query)}"+openfda.generic_name:"${encodeURIComponent(query)}"&limit=10`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    
    const mapped = data.results.map(mapFdaToLocalFormat);
    
    // Translate the top 3 results to save on network requests and time
    // Most UI components only need the top 3 anyway
    const toTranslate = mapped.slice(0, 3);
    await Promise.all(toTranslate.map(async (med) => {
      await translateMedicineFields(med, 'hi');
      await translateMedicineFields(med, 'mr');
    }));

    return mapped;
  } catch (err) {
    console.warn("OpenFDA Search Failed", err);
    return [];
  }
}

/**
 * Searches OpenFDA using UPC barcode.
 * @param {string} upc 
 * @returns {Object|null} A mapped medicine object or null if not found
 */
export async function searchOpenFdaByBarcode(upc) {
  try {
    // Exact match for UPC
    const res = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.upc:"${encodeURIComponent(upc)}"&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    
    const med = mapFdaToLocalFormat(data.results[0]);
    await translateMedicineFields(med, 'hi');
    await translateMedicineFields(med, 'mr');
    return med;
  } catch (err) {
    console.warn("OpenFDA Barcode Search Failed", err);
    return null;
  }
}
