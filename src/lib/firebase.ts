// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnGzgfBEOd0gqGx68dQZ6WgwCcxpvqPsY",
  authDomain: "kisan-saathi-ai.firebaseapp.com",
  projectId: "kisan-saathi-ai",
  storageBucket: "kisan-saathi-ai.appspot.com",
  messagingSenderId: "691962974417",
  appId: "1:691962974417:web:b4f404eef99ca8a45075f0"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;
