import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginWithGoogle,
  requestGoogleOtp,
  verifyGoogleOtp,
  verifyPhoneOtp,
  updateUserProfile,
} from '../services/api';
import {
  isFirebaseConfigured,
  signInWithRealGoogle,
  sendRealSMSOTP,
  verifyRealSMSOTP,
} from '../services/firebase';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { addToast } = useToast() || {};
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shopping_agent_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('shopping_agent_token') || null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [hasFirebaseKeys, setHasFirebaseKeys] = useState(isFirebaseConfigured());
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);

  useEffect(() => {
    setHasFirebaseKeys(isFirebaseConfigured());
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('shopping_agent_user', JSON.stringify(user));
    else localStorage.removeItem('shopping_agent_user');

    if (token) localStorage.setItem('shopping_agent_token', token);
    else localStorage.removeItem('shopping_agent_token');
  }, [user, token]);

  const notifyLoginSuccess = (userData) => {
    if (addToast) {
      addToast(`Welcome back, ${userData.name}!`, 'success');
    }
  };

  // Step 1: Google popup confirms identity, then email OTP is requested
  const loginGoogle = async (name = 'Demo User', email = 'demo@example.com') => {
    try {
      let payload;
      if (isFirebaseConfigured()) {
        const { user: realUser, idToken } = await signInWithRealGoogle();
        payload = {
          name: realUser.name,
          email: realUser.email,
          avatar_url: realUser.avatar_url,
          idToken,
        };
      } else {
        payload = { name, email };
      }

      const res = await requestGoogleOtp(payload);
      if (res.status === 'success') {
        setPendingGoogleAuth({ email: payload.email });
        if (addToast) addToast(res.message || 'Verification code sent!', 'info');
        return {
          success: true,
          requiresOtp: true,
          email: payload.email,
          message: res.message,
          demo_otp: res.demo_otp,
        };
      }
      return { success: false, error: res.error || 'Could not send verification code.' };
    } catch (e) {
      console.error('Google Auth Error:', e);
      return { success: false, error: e.response?.data?.error || e.message };
    }
  };

  // Step 2: User enters the email OTP
  const verifyGoogleEmailOtp = async (otp) => {
    try {
      if (!pendingGoogleAuth) {
        return { success: false, error: 'Please sign in with Google again.' };
      }

      // Pass payload object matching verifyGoogleOtp(userData) in api.js
      const res = await verifyGoogleOtp({ email: pendingGoogleAuth.email, otp });

      if (res.status === 'success') {
        setUser(res.user);
        setToken(res.token);
        setIsAuthModalOpen(false);
        setPendingGoogleAuth(null);
        notifyLoginSuccess(res.user);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (e) {
      console.error('Google OTP Verify Error:', e);
      return { success: false, error: e.response?.data?.error || e.message };
    }
  };

  // Phone: via Firebase's real SMS when configured, fallback to API/demo otherwise
  const requestPhoneSMS = async (phoneNumber) => {
    try {
      if (isFirebaseConfigured()) {
        await sendRealSMSOTP(phoneNumber);
        return { success: true, message: `Verification code sent to ${phoneNumber}!` };
      } else {
        return { success: true, message: `Demo OTP sent to ${phoneNumber}. Use 123456 to test.` };
      }
    } catch (e) {
      console.error('Send SMS Error:', e);
      return { success: false, error: e.message };
    }
  };

 const loginPhone = async (phone, otp) => {
  try {
    if (isFirebaseConfigured()) {
      // 1. Verify OTP directly through Firebase SDK
      const { user: firebaseUser, idToken } = await verifyRealSMSOTP(otp);

      // 2. Format user object from Firebase credentials
      const authenticatedUser = {
        id: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || phone,
        name: firebaseUser.displayName || `User (${(firebaseUser.phoneNumber || phone).slice(-4)})`,
      };

      // 3. Update application state & local storage
      setUser(authenticatedUser);
      setToken(idToken);
      setIsAuthModalOpen(false);
      notifyLoginSuccess(authenticatedUser);

      // 4. (Optional) If your backend needs to record this user in database, 
      // pass the idToken instead of the raw OTP code:
      /*
      try {
        await client.post('/auth/firebase-login', { idToken });
      } catch (err) {
        console.warn('Backend sync failed, continuing with client session:', err);
      }
      */

      return { success: true };
    } else {
      // Fallback: Custom API OTP logic when Firebase is disabled
      const res = await verifyPhoneOtp(phone, otp);
      if (res.status === 'success') {
        setUser(res.user);
        setToken(res.token);
        setIsAuthModalOpen(false);
        notifyLoginSuccess(res.user);
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  } catch (e) {
    console.error('Phone Auth Error:', e);
    return { success: false, error: e.response?.data?.error || e.message };
  }
};

  const updateDisplayName = async (newName) => {
    try {
      if (user) {
        const updated = { ...user, name: newName };
        setUser(updated);
        localStorage.setItem('shopping_agent_user', JSON.stringify(updated));
        await updateUserProfile(user.id, newName);
      }
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (addToast) {
      addToast('Signed out', 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isWatchlistOpen,
        setIsWatchlistOpen,
        pendingAction,
        setPendingAction,
        hasFirebaseKeys,
        loginGoogle,
        verifyGoogleEmailOtp,
        pendingGoogleAuth,
        requestPhoneSMS,
        loginPhone,
        updateDisplayName,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);