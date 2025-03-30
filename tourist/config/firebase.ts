import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGY5kBAQn97TfTiVDqPG8T8eA9V-1p9_c",
  authDomain: "safetour-ba40a.firebaseapp.com",
  projectId: "safetour-ba40a",
  storageBucket: "safetour-ba40a.firebasestorage.app",
  messagingSenderId: "285945642617",
  appId: "1:285945642617:web:2089fb025167ebbcf6dea8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 