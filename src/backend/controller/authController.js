const { auth, db } = require('../../firebase/firebase-admin');
const { validationResult } = require('express-validator');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, age, preferredLanguage } = req.body;

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      age: age || null,
      preferredLanguage: preferredLanguage || 'english',
      fontSize: 'medium',
      voiceAssistEnabled: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: email === 'baradmanik@gmail.com' ? 'admin' : 'user'
    });

    // Create activity log
    await db.collection('activity_logs').add({
      userId: userRecord.uid,
      action: 'registration',
      timestamp: new Date().toISOString(),
      details: `User ${name} registered`
    });

    res.status(201).json({
      message: 'User created successfully',
      uid: userRecord.uid
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    
    // Verify the ID token from client
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Update last login
    await db.collection('users').doc(uid).update({
      lastLogin: new Date().toISOString()
    });

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Create activity log
    await db.collection('activity_logs').add({
      userId: uid,
      action: 'login',
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Login successful',
      user: {
        uid,
        ...userData
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    res.json({
      valid: true,
      user: {
        uid: decodedToken.uid,
        ...userDoc.data()
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
};  