// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjqpju5BRscl581dJBrgbaSc8wSPPkpu8",
  authDomain: "restauranthub-52c3a.firebaseapp.com",
  projectId: "restauranthub-52c3a",
  storageBucket: "restauranthub-52c3a.firebasestorage.app",
  messagingSenderId: "658395508776",
  appId: "1:658395508776:web:b3d54dc6f486580e0c851d",
  measurementId: "G-675BXB1CG6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);