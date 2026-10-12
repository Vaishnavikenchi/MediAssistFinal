const { db } = require('../../firebase/firebase-admin');

exports.searchMedicine = async (req, res, next) => {
  try {
    const { query, barcode } = req.query;
    
    let medicines = [];
    let medicineQuery = db.collection('medicines');

    if (barcode) {
      // Search by barcode
      medicineQuery = medicineQuery.where('barcode', '==', barcode);
    } else if (query) {
      // Search by name (case-insensitive)
      medicineQuery = medicineQuery
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff');
    }

    const snapshot = await medicineQuery.limit(20).get();
    
    snapshot.forEach(doc => {
      medicines.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ medicines });
  } catch (error) {
    next(error);
  }
};

exports.getMedicineById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicineDoc = await db.collection('medicines').doc(id).get();
    
    if (!medicineDoc.exists) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({
      id: medicineDoc.id,
      ...medicineDoc.data()
    });
  } catch (error) {
    next(error);
  }
};

exports.addMedicine = async (req, res, next) => {
  try {
    const medicineData = req.body;
    
    // Check if medicine already exists by barcode
    if (medicineData.barcode) {
      const existing = await db.collection('medicines')
        .where('barcode', '==', medicineData.barcode)
        .get();
      
      if (!existing.empty) {
        return res.status(400).json({ message: 'Medicine with this barcode already exists' });
      }
    }

    const docRef = await db.collection('medicines').add({
      ...medicineData,
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid
    });

    res.status(201).json({
      message: 'Medicine added successfully',
      id: docRef.id
    });
  } catch (error) {
    next(error);
  }
};