import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDVUEdWrfc4ZwFHrdRsFu72x9PadxzmJxU",
  authDomain: "quiz-app-8ab27.firebaseapp.com",
  projectId: "quiz-app-8ab27",
  storageBucket: "quiz-app-8ab27.firebasestorage.app",
  messagingSenderId: "1068905936838",
  appId: "1:1068905936838:web:7461e908897215572964c7",
  measurementId: "G-YQCKJWEWV2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
