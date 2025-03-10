import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Firestore
import { getAnalytics } from "firebase/analytics"; // Analytics

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZNqctF-DSsdlfCvm4859HAknzLbxu7EQ",
  authDomain: "logistic-document.firebaseapp.com",
  projectId: "logistic-document",
  storageBucket: "logistic-document.firebasestorage.app",
  messagingSenderId: "340727459640",
  appId: "1:340727459640:web:4d6914b3951395502c9bcd",
  measurementId: "G-4FDM3JX3YD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics only on the client side
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { db, analytics };
