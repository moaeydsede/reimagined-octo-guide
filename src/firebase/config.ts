import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// بيانات Firebase التي أرسلتها. مفاتيح Firebase Web Config ليست سرية،
// لكن لا تجعل قواعد Firestore مفتوحة. قواعد الحماية موجودة في firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBoIEDYdxyx-UlLPEc4H-ikos82mCvlj6U',
  authDomain: 'mouha-8576f.firebaseapp.com',
  projectId: 'mouha-8576f',
  storageBucket: 'mouha-8576f.firebasestorage.app',
  messagingSenderId: '124908818053',
  appId: '1:124908818053:web:1a00efecaa07234f9763ec'
};

export const ADMIN_UID = 'a2uvKrLDoNVPOafbOOM8BlErxek1';
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
