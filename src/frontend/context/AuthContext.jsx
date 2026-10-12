import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../firebase/firebase-config';
import { createUserProfile, getUserProfile, logActivity, isAdmin } from '../../firebase/firestoreService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });

    // Create Firestore user document
    await createUserProfile(result.user.uid, {
      name: displayName,
      email,
    });

    // Log activity
    await logActivity(result.user.uid, email, 'registration', `User ${displayName} registered`);
    return result;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await logActivity(result.user.uid, email, 'login', `User logged in`);
    return result;
  }

  async function logout() {
    if (currentUser) {
      await logActivity(currentUser.uid, currentUser.email, 'logout', 'User logged out');
    }
    return signOut(auth);
  }

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
          if (user) {
            getUserProfile(user.uid).then(profile => {
              setUserProfile(profile);
              setLoading(false);
            }).catch(err => {
              console.error('Failed to get user profile', err);
              setLoading(false);
            });
          } else {
            setUserProfile(null);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Auth state error:', error);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Firebase auth setup failed:', error);
      setLoading(false);
    }
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isAdmin: currentUser ? isAdmin(currentUser.email, userProfile?.role) : false,
    signup,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
