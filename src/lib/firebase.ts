import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: 'AIzaSyBoIEDYdxyx-UlLPEc4H-ikos82mCvlj6U',
  authDomain: 'mouha-8576f.firebaseapp.com',
  projectId: 'mouha-8576f',
  storageBucket: 'mouha-8576f.firebasestorage.app',
  messagingSenderId: '124908818053',
  appId: '1:124908818053:web:1a00efecaa07234f9763ec'
}

export const ADMIN_UID = 'a2uvKrLDoNVPOafbOOM8BlErxek1'
export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
