import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";

export async function addScore(roomCode, group, marks) {
  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);
  const roomData = roomSnap.data();

  await updateDoc(roomRef, {
    [`scores.${group}`]: roomData.scores[group] + marks
  });
}

export async function checkGameEnd(roomCode) {
  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);

  const roomData = roomSnap.data();
  return roomData.starterAnswered === true;
}
