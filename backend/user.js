import {
  doc,
  getDoc,
  updateDoc,
  collection,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase.js";

export async function joinRoom(roomCode, rollNumber, userId) {
  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const roomData = roomSnap.data();
  const joinOrder = roomData.userCount;
  const group = joinOrder % 2 === 0 ? "A" : "B";

  await setDoc(
    doc(collection(roomRef, "users"), userId),
    {
      roll: rollNumber,
      group,
      joinOrder,
      joinedAt: Date.now()
    }
  );

  await updateDoc(roomRef, {
    userCount: joinOrder + 1,
    starterUserId: joinOrder === 0 ? userId : roomData.starterUserId
  });

  return { group, joinOrder };
}
