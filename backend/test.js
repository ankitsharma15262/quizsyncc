import { db } from "./firebase.js";
import { collection, addDoc } from "firebase/firestore";

await addDoc(collection(db, "test"), {
  status: "ok",
  time: Date.now()
});

console.log("Firebase working");
