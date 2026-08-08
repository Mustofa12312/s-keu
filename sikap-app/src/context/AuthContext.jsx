// ============================================================
// src/context/AuthContext.jsx
// ============================================================
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(false)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  async function fetchProfile(userId) {
    setProfileError(false)
    try {
      const docRef = doc(db, 'profiles', userId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.warn('Profile not found for user');
        setProfileError(true);
        return;
      }

      const data = { id: snapshot.id, ...snapshot.data() };

      if (data?.role === 'blocked') {
        await signOut(auth);
        setUser(null)
        setProfile(null)
        return
      }

      // Fetch instansi details if instansiId exists
      if (data.instansi_id) {
        const instansiSnap = await getDoc(doc(db, 'instansi', data.instansi_id));
        if (instansiSnap.exists()) {
          data.instansi = { id: instansiSnap.id, ...instansiSnap.data() };
        }
      }

      setProfile(data)
      setProfileError(false)
    } catch (err) {
      console.warn('Profile fetch error:', err.message)
      setProfileError(true)
    }
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        fetchProfile(firebaseUser.uid)
      } else {
        setUser(null)
        setProfile(null)
        setProfileError(false)
      }
      setLoading(false)
    });

    return () => unsubscribe()
  }, [])

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential
  }

  async function logout() {
    await signOut(auth)
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isViewer = profile?.role === 'viewer'
  const instansiId = profile?.instansi?.id || profile?.instansi_id

  return (
    <AuthContext.Provider value={{ user, profile, profileError, loading, login, logout, isSuperAdmin, isViewer, instansiId }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
