import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // We intentionally do NOT configure Storage to avoid requiring a billing-enabled plan.
  // All images are stored as data URLs in Firestore documents instead.
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

