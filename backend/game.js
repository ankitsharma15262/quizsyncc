import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "./firebase.js";


export async function startGame(roomCode) {
  const roomRef = doc(db, "rooms", roomCode);
  const usersSnap = await getDocs(collection(roomRef, "users"));

  if (usersSnap.size < 2) {
    throw new Error("Need at least 2 players to start the game");
  }

  const users = [];
  usersSnap.forEach(d => {
    users.push({ id: d.id, ...d.data() });
  });

  users.sort((a, b) => a.joinOrder - b.joinOrder);

  await updateDoc(roomRef, {
    started: true,
    currentTurnIndex: 0,
    starterAnswered: false,
    phase: "ASKING",
    currentQuestion: "",
    currentAnswer: "",
    currentAskerId: users[0].id,
    currentResponderId: users[1].id
  });

  console.log(`Game started in room ${roomCode}`);
}


export async function askQuestion(roomCode, questionText) {
  const roomRef = doc(db, "rooms", roomCode);

  await updateDoc(roomRef, {
    currentQuestion: questionText,
    phase: "ANSWERING"
  });

  console.log(`Question asked: ${questionText}`);
}


export async function submitAnswer(roomCode, answerText) {
  const roomRef = doc(db, "rooms", roomCode);

  await updateDoc(roomRef, {
    currentAnswer: answerText,
    phase: "SCORING"
  });

  console.log(`Answer submitted: ${answerText}`);
}


export async function giveScoreAndNextTurn(roomCode, marks) {
  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);
  const roomData = roomSnap.data();

  const usersSnap = await getDocs(collection(roomRef, "users"));
  const users = [];
  usersSnap.forEach(d => {
    users.push({ id: d.id, ...d.data() });
  });

  users.sort((a, b) => a.joinOrder - b.joinOrder);

  const totalUsers = users.length;
  const nextIndex = (roomData.currentTurnIndex + 1) % totalUsers;

  const responder = users.find(u => u.id === roomData.currentResponderId);
  const responderGroup = responder ? responder.group : null;

  
  const starterAnswered = (nextIndex === 0 && roomData.currentTurnIndex > 0);

  const updates = {
    currentTurnIndex: nextIndex,
    phase: starterAnswered ? "WAITING" : "ASKING",
    currentQuestion: "",
    currentAnswer: "",
    currentAskerId: users[nextIndex].id,
    currentResponderId: users[(nextIndex + 1) % totalUsers].id,
    starterAnswered
  };

  if (responderGroup) {
    updates[`scores.${responderGroup}`] = roomData.scores[responderGroup] + marks;
  }

  await updateDoc(roomRef, updates);

  console.log(`Score given: ${marks} to group ${responderGroup}. Next turn: ${nextIndex}`);
  
  if (starterAnswered) {
    console.log("Game ended!");
  }
}