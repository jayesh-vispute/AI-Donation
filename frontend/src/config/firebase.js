import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA5KPd-rMCDbIekgdrPUEAOYDzfM2Q2tZs",
  authDomain: "donation-management-syst-f574f.firebaseapp.com",
  projectId: "donation-management-syst-f574f",
  storageBucket: "donation-management-syst-f574f.firebasestorage.app",
  messagingSenderId: "672207370859",
  appId: "1:672207370859:web:703b1f27991f7c6dda0f2e",
  measurementId: "G-YWSM8H0VKV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics };
