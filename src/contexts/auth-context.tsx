import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import type { AdminProfile } from '@/types/database'

interface AuthContextType {
  user: FirebaseUser | null
  adminProfile: AdminProfile | null
  loading: boolean
  configured: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInDemo: () => Promise<void>
  signOut: () => Promise<void>
}

const DEMO_USER_ID = 'demo-admin-7dc-artemis'

const DEMO_ADMIN_PROFILE: AdminProfile = {
  id: DEMO_USER_ID,
  display_name: 'Administrador 7dc',
  role: 'superadmin',
  created_at: new Date().toISOString(),
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('7dc_demo_mode') === 'true'
  })

  const configured = isFirebaseConfigured()

  // Buscar perfil admin no Firestore
  const fetchOrInitAdminProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const docRef = doc(db, 'admin_profiles', firebaseUser.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data() as AdminProfile
      } else {
        // Inicializa o perfil administrativo no Firestore para o primeiro admin logado
        const newProfile: AdminProfile = {
          id: firebaseUser.uid,
          display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrador 7dc',
          role: 'superadmin',
          created_at: new Date().toISOString(),
        }
        await setDoc(docRef, newProfile)
        return newProfile
      }
    } catch (err) {
      console.warn('[7dc] Erro ao carregar perfil no Firestore, usando dados locais de sessão:', err)
      return {
        id: firebaseUser.uid,
        display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrador 7dc',
        role: 'superadmin',
        created_at: new Date().toISOString(),
      } as AdminProfile
    }
  }, [])

  useEffect(() => {
    if (isDemoMode) {
      setAdminProfile(DEMO_ADMIN_PROFILE)
      setUser({
        uid: DEMO_USER_ID,
        email: 'admin@7dc.internal',
        displayName: 'Administrador 7dc',
      } as unknown as FirebaseUser)
      setLoading(false)
      return
    }

    if (!configured) {
      setLoading(false)
      return
    }

    // Escutar mudanças de autenticação do Firebase
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const profile = await fetchOrInitAdminProfile(currentUser)
        setAdminProfile(profile)
      } else {
        setUser(null)
        setAdminProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [configured, isDemoMode, fetchOrInitAdminProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const profile = await fetchOrInitAdminProfile(userCredential.user)
        setUser(userCredential.user)
        setAdminProfile(profile)
        setIsDemoMode(false)
        localStorage.removeItem('7dc_demo_mode')
        return { error: null }
      } catch (err: unknown) {
        let message = 'Falha na autenticação administrativa com Firebase.'
        if (err && typeof err === 'object' && 'code' in err) {
          const code = (err as { code: string }).code
          if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
            message = 'Credenciais incorretas ou usuário não cadastrado no Firebase Auth.'
          } else if (code === 'auth/too-many-requests') {
            message = 'Muitas tentativas sem sucesso. Tente novamente em instantes.'
          } else if (code === 'auth/invalid-email') {
            message = 'Formato de e-mail inválido.'
          } else {
            message = `Erro Firebase (${code})`
          }
        }
        return { error: message }
      }
    },
    [fetchOrInitAdminProfile]
  )

  const signInDemo = useCallback(async () => {
    localStorage.setItem('7dc_demo_mode', 'true')
    setIsDemoMode(true)
    setAdminProfile(DEMO_ADMIN_PROFILE)
    setUser({
      uid: DEMO_USER_ID,
      email: 'admin@7dc.internal',
      displayName: 'Administrador 7dc',
    } as unknown as FirebaseUser)
  }, [])

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem('7dc_demo_mode')
      setIsDemoMode(false)
    } else {
      try {
        await firebaseSignOut(auth)
      } catch (err) {
        console.warn('Erro ao sair do Firebase:', err)
      }
    }
    setUser(null)
    setAdminProfile(null)
  }, [isDemoMode])

  return (
    <AuthContext.Provider
      value={{
        user,
        adminProfile,
        loading,
        configured,
        isDemoMode,
        signIn,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
