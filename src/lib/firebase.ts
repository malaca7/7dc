import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDEMaCgK71tCV8Q-JCov9qKVLisLIZYClg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "artemis-e4d33.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "artemis-e4d33",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "artemis-e4d33.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "96268694719",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:96268694719:web:a94b147607f8fa52d8020a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LFPPPKNNR3"
}

// Inicializar Firebase evitando múltiplas instâncias
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics só é inicializado no navegador se suportado
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app)
    }
  }).catch(() => {
    // Ignora se analytics não for suportado no ambiente local
  })
}

export const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.projectId === 'artemis-e4d33')
}
