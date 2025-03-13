// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB9wvcUTafIOGSeFLtiiY6_xp9Zm-hfkWw",
    authDomain: "chipstacker-d71bc.firebaseapp.com",
    databaseURL: "https://chipstacker-d71bc-default-rtdb.firebaseio.com",
    projectId: "chipstacker-d71bc",
    storageBucket: "chipstacker-d71bc.firebasestorage.app",
    messagingSenderId: "141635286501",
    appId: "1:141635286501:web:baf0267ff49cc2599bab0c",
    measurementId: "G-X3S5JEMT1Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
