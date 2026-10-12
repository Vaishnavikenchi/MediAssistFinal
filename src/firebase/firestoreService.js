import {
  doc, setDoc, getDoc, updateDoc, collection,
  addDoc, getDocs, deleteDoc, query, where,
  orderBy, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase-config';

// ─── ADMIN ──────────────────────────────────────────────────────────────────
export const ADMIN_EMAIL = 'baradmanik@gmail.com'; // Master Admin fallback
export const isAdmin = (email, role) => email === ADMIN_EMAIL || role === 'admin';

// ─── ACTIVITY LOGGING ────────────────────────────────────────────────────────
export async function logActivity(userId, email, action, details = '') {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId,
      email,
      action,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Activity log failed:', err);
  }
}

// ─── USERS COLLECTION ────────────────────────────────────────────────────────
export async function createUserProfile(userId, data) {
  await setDoc(doc(db, 'users', userId), {
    name: data.name || '',
    email: data.email || '',
    age: data.age || null,
    role: data.role || 'user',
    preferredLanguage: data.preferredLanguage || 'en',
    fontSize: data.fontSize || 'medium',
    voiceAssistEnabled: data.voiceAssistEnabled || false,
    createdAt: serverTimestamp(),
  });
}

export async function promoteUserToAdmin(userId) {
  await updateDoc(doc(db, 'users', userId), { role: 'admin' });
}

export async function demoteAdminToUser(userId) {
  await updateDoc(doc(db, 'users', userId), { role: 'user' });
}

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(userId, data) {
  await updateDoc(doc(db, 'users', userId), { ...data });
}

// ─── MEDICINES COLLECTION (barcode = doc ID) ─────────────────────────────────

/**
 * Add or overwrite a medicine using barcode as the document ID.
 */
export async function addMedicineByBarcode(barcode, data) {
  const ref = doc(db, 'medicines', barcode);
  await setDoc(ref, {
    name: data.name || '',
    dosage: data.dosage || '',
    usageInstructions: data.usageInstructions_en || data.usageInstructions || '',
    precautions: data.precautions_en || data.precautions || '',
    sideEffects: data.sideEffects_en || data.sideEffects || '',
    usageInstructions_en: data.usageInstructions_en || '',
    usageInstructions_hi: data.usageInstructions_hi || '',
    usageInstructions_mr: data.usageInstructions_mr || '',
    precautions_en: data.precautions_en || '',
    precautions_hi: data.precautions_hi || '',
    precautions_mr: data.precautions_mr || '',
    sideEffects_en: data.sideEffects_en || '',
    sideEffects_hi: data.sideEffects_hi || '',
    sideEffects_mr: data.sideEffects_mr || '',
    simpleExplanation_en: data.simpleExplanation_en || '',
    simpleExplanation_hi: data.simpleExplanation_hi || '',
    simpleExplanation_mr: data.simpleExplanation_mr || '',
    barcode,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref;
}

/**
 * Update specific fields of a medicine by barcode.
 */
export async function updateMedicine(barcode, data) {
  const ref = doc(db, 'medicines', barcode);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

/**
 * Delete a medicine by barcode.
 */
export async function deleteMedicine(barcode) {
  await deleteDoc(doc(db, 'medicines', barcode));
}

/**
 * Get a medicine by barcode (direct docID lookup — fast).
 */
export async function getMedicineByBarcode(barcode) {
  const snap = await getDoc(doc(db, 'medicines', barcode));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  // Fallback: query by barcode field (for legacy Auto-ID docs)
  const q = query(collection(db, 'medicines'), where('barcode', '==', barcode));
  const qSnap = await getDocs(q);
  if (qSnap.empty) return null;
  const d = qSnap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getAllMedicines() {
  const snap = await getDocs(collection(db, 'medicines'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── MEDICINE NOTIFICATIONS ───────────────────────────────────────────────────
/**
 * Create a notification when admin adds a medicine.
 * All users will receive this via the notifications collection.
 */
export async function createMedicineNotification(barcode, medicineName) {
  await addDoc(collection(db, 'notifications'), {
    type: 'new_medicine',
    barcode,
    medicineName,
    message: `New medicine added: ${medicineName}. Scan barcode ${barcode} to view details.`,
    createdAt: serverTimestamp(),
    readBy: [], // array of userIds who have read this
  });
}

/**
 * Get all system notifications (for users).
 */
export async function getSystemNotifications() {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribe to system notifications in real-time.
 */
export function subscribeToNotifications(callback) {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Mark a notification as read by a user.
 */
export async function markNotificationRead(notifId, userId) {
  const ref = doc(db, 'notifications', notifId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const readBy = snap.data().readBy || [];
    if (!readBy.includes(userId)) {
      await updateDoc(ref, { readBy: [...readBy, userId] });
    }
  }
}

// ─── REMINDERS COLLECTION ────────────────────────────────────────────────────
export async function addReminder(userId, data) {
  return await addDoc(collection(db, 'reminders'), {
    userId,
    medicineName: data.medicineName || '',
    dosage: data.dosage || '',
    frequency: data.frequency || '',
    time: data.time || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserReminders(userId) {
  const q = query(
    collection(db, 'reminders'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return data.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function updateReminder(reminderId, data) {
  await updateDoc(doc(db, 'reminders', reminderId), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteReminder(reminderId) {
  await deleteDoc(doc(db, 'reminders', reminderId));
}

// ─── HISTORY COLLECTION ──────────────────────────────────────────────────────
export async function addHistory(userId, data) {
  return await addDoc(collection(db, 'history'), {
    userId,
    medicineName: data.medicineName || '',
    dosage: data.dosage || '',
    status: data.status || 'taken',   // 'taken' | 'missed'
    takenAt: serverTimestamp(),
  });
}

export async function updateHistory(historyId, data) {
  await updateDoc(doc(db, 'history', historyId), { ...data });
}

export async function getUserHistory(userId) {
  const q = query(
    collection(db, 'history'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return data.sort((a, b) => {
    const timeA = a.takenAt?.seconds || 0;
    const timeB = b.takenAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function deleteHistoryByMedicine(userId, medicineName) {
  const q = query(
    collection(db, 'history'),
    where('userId', '==', userId),
    where('medicineName', '==', medicineName)
  );
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}

// ─── SEARCH HISTORY ────────────────────────────────────────────────────────────
export async function addSearchHistory(userId, queryText, resultCount) {
  if (!userId) return;
  return await addDoc(collection(db, 'search_history'), {
    userId,
    query: queryText,
    resultCount,
    timestamp: serverTimestamp(),
  });
}

export async function getUserSearchHistory(userId) {
  const q = query(
    collection(db, 'search_history'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return data.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeB - timeA;
  });
}

// ─── SCAN HISTORY ──────────────────────────────────────────────────────────────
export async function addScanHistory(userId, barcode, medicineName, found) {
  if (!userId) return;
  return await addDoc(collection(db, 'scan_history'), {
    userId,
    barcode,
    medicineName,
    found,
    timestamp: serverTimestamp(),
  });
}

export async function getUserScanHistory(userId) {
  const q = query(
    collection(db, 'scan_history'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return data.sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeB - timeA;
  });
}

// ─── ADMIN: ALL ACTIVITY LOGS ─────────────────────────────────────────────────
export async function getAllActivityLogs() {
  const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── EMAIL NOTIFICATIONS (Trigger Email Extension) ────────────────────────────
export async function sendEmailNotification(email, reminder) {
  try {
    await addDoc(collection(db, 'mail'), {
      to: email,
      message: {
        subject: `Medication Reminder: ${reminder.medicineName}`,
        text: `Hello,\n\nIt's time to take your medicine: ${reminder.medicineName} ${reminder.dosage ? `(${reminder.dosage})` : ''}.\n\nPlease mark it as taken in the MediAssist app.`,
        html: `<h3>Medication Reminder</h3><p>Hello,</p><p>It's time to take your medicine: <strong>${reminder.medicineName}</strong> ${reminder.dosage ? `(${reminder.dosage})` : ''}.</p><p>Stay healthy!</p>`
      }
    });
  } catch (err) {
    console.warn('Failed to trigger email log:', err);
  }
}

// ─── ADMIN: ALL USERS ─────────────────────────────────────────────────────────
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
