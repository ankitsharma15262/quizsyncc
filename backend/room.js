import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom(creatorId) {
  const roomCode = generateRoomCode();

  await setDoc(doc(db, "rooms", roomCode), {
    createdBy: creatorId,
    createdAt: Date.now(),
    started: false,
    userCount: 0,
    starterUserId: null,
    starterAnswered: false,
    currentTurnIndex: 0,
    scores: {
      A: 0,
      B: 0
    }
  });

  return roomCode;
}
