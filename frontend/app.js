import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

let roomCode = "";
const userId = "user_" + Math.random().toString(36).slice(2);
let myGroup = "";
let isCreator = false;


async function createRoom() {
  try {
    roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await setDoc(doc(db, "rooms", roomCode), {
      createdBy: userId,
      createdAt: Date.now(),
      started: false,
      userCount: 0,
      starterUserId: null,
      starterAnswered: false,
      currentTurnIndex: 0,
      phase: "WAITING",             
      currentQuestion: "",
      currentAnswer: "",
      currentAskerId: "",
      currentResponderId: "",
      scores: { A: 0, B: 0 }
    });

    isCreator = true;
    
    document.getElementById("home").style.display = "none";
    document.getElementById("lobby").style.display = "block";
    document.getElementById("lobbyRoomCode").innerText = roomCode;
    document.getElementById("sharableCode").innerText = `Share this code with players: ${roomCode}`;

    listenUsers();
    listenRoom();
  } catch (err) {
    console.error(err);
    alert("Error creating room");
  }
}


async function joinRoom() {
  roomCode = document.getElementById("roomCode").value.trim().toUpperCase();
  const roll = document.getElementById("roll").value.trim();

  if (!roomCode || !roll) {
    alert("Enter room code and roll number");
    return;
  }

  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room not found");
    return;
  }

  const data = roomSnap.data();

  if (data.started) {
    alert("Game has already started! You cannot join now.");
    return;
  }

  const joinOrder = data.userCount;
  const group = joinOrder % 2 === 0 ? "A" : "B";
  myGroup = group;

  await setDoc(doc(collection(roomRef, "users"), userId), {
    roll,
    group,
    joinOrder
  });

  await updateDoc(roomRef, {
    userCount: joinOrder + 1,
    starterUserId: joinOrder === 0 ? userId : data.starterUserId
  });

  document.getElementById("home").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobbyRoomCode").innerText = roomCode;
  document.getElementById("sharableCode").innerText = `Waiting for host to start the game...`;

  listenRoom();
  listenUsers();
}


function listenRoom() {
  onSnapshot(doc(db, "rooms", roomCode), snap => {
    const r = snap.data();

    if (isCreator) {
      show("startGameBtn");
    } else {
      hide("startGameBtn");
    }

    if (r.started) {
      document.getElementById("lobby").style.display = "none";
      document.getElementById("room").style.display = "block";
      document.getElementById("roomTitle").innerText = `Room: ${roomCode} | You are in Group ${myGroup}`;
    }

    document.getElementById("scores").innerText =
      `Group A: ${r.scores.A} | Group B: ${r.scores.B}`;

    document.getElementById("turn").innerText =
      `Phase: ${r.phase}`;

    if (r.currentQuestion) {
      document.getElementById("currentQuestion").innerText = 
        `Current Question: ${r.currentQuestion}`;
    } else {
      document.getElementById("currentQuestion").innerText = "";
    }

    if (r.currentAnswer) {
      document.getElementById("currentAnswer").innerText = 
        `Current Answer: ${r.currentAnswer}`;
    } else {
      document.getElementById("currentAnswer").innerText = "";
    }

    hideAllActions();

    if (r.phase === "ASKING" && r.currentAskerId === userId) {
      show("askBox");
    }

    if (r.phase === "ANSWERING" && r.currentResponderId === userId) {
      show("answerBox");
    }

    if (r.phase === "SCORING" && r.currentAskerId === userId) {
      show("scoreBox");
    }

    if (r.starterAnswered) {
      document.getElementById("ended").innerText = 
        `🎉 GAME ENDED! Winner: Group ${r.scores.A > r.scores.B ? 'A' : r.scores.B > r.scores.A ? 'B' : 'TIE'} 🎉`;
      hideAllActions();
    } else {
      document.getElementById("ended").innerText = "";
    }
  });
}


function listenUsers() {
  onSnapshot(collection(db, "rooms", roomCode, "users"), snap => {
    const ul = document.getElementById("lobbyUsers");
    ul.innerHTML = "";

    const users = [];
    snap.forEach(d => {
      const u = d.data();
      users.push({ ...u, id: d.id });
    });

    users.sort((a, b) => a.joinOrder - b.joinOrder);

    users.forEach(u => {
      ul.innerHTML += `<li>${u.roll} - Group ${u.group}${u.id === userId ? ' (You)' : ''}</li>`;
    });

    document.getElementById("playerCount").innerText = `Players: ${users.length}`;

    const gameUl = document.getElementById("users");
    if (gameUl) {
      gameUl.innerHTML = "";
      users.forEach(u => {
        gameUl.innerHTML += `<li>${u.roll} - Group ${u.group}${u.id === userId ? ' (You)' : ''}</li>`;
      });
    }
  });
}


async function startGame() {
  const roomRef = doc(db, "rooms", roomCode);
  const roomSnap = await getDoc(roomRef);
  const roomData = roomSnap.data();

  if (roomData.createdBy !== userId) {
    alert("Only the room creator can start the game!");
    return;
  }

  const usersSnap = await getDocs(collection(roomRef, "users"));

  if (usersSnap.size < 2) {
    alert("Need at least 2 players to start!");
    return;
  }

  const users = [];
  usersSnap.forEach(d => {
    users.push({ id: d.id, ...d.data() });
  });

  users.sort((a, b) => a.joinOrder - b.joinOrder);

  await updateDoc(roomRef, {
    started: true,
    currentTurnIndex: 0,
    phase: "ASKING",
    currentAskerId: users[0].id,
    currentResponderId: users[1].id,
    currentQuestion: "",
    currentAnswer: "",
    starterAnswered: false
  });

  alert("Game started!");
}


async function submitQuestion() {
  const q = document.getElementById("questionInput").value.trim();

  if (!q) {
    alert("Please enter a question");
    return;
  }

  await updateDoc(doc(db, "rooms", roomCode), {
    currentQuestion: q,
    phase: "ANSWERING"
  });

  document.getElementById("questionInput").value = "";
}


async function submitAnswer() {
  const a = document.getElementById("answerInput").value.trim();

  if (!a) {
    alert("Please enter an answer");
    return;
  }

  await updateDoc(doc(db, "rooms", roomCode), {
    currentAnswer: a,
    phase: "SCORING"
  });

  document.getElementById("answerInput").value = "";
}


async function submitScore() {
  const marks = Number(document.getElementById("marks").value);
  const roomRef = doc(db, "rooms", roomCode);
  const snap = await getDoc(roomRef);
  const data = snap.data();

  const usersSnap = await getDocs(collection(roomRef, "users"));
  const users = [];
  usersSnap.forEach(d => {
    users.push({ id: d.id, ...d.data() });
  });
  users.sort((a, b) => a.joinOrder - b.joinOrder);

  const responder = users.find(u => u.id === data.currentResponderId);
  const responderGroup = responder ? responder.group : null;

  const nextIndex = (data.currentTurnIndex + 1) % users.length;
  
  const starterAnswered = (nextIndex === 0 && data.currentTurnIndex > 0);

  const nextAskerId = users[nextIndex].id;
  const nextResponderId = users[(nextIndex + 1) % users.length].id;

  const updates = {
    currentTurnIndex: nextIndex,
    phase: starterAnswered ? "WAITING" : "ASKING",
    currentQuestion: "",
    currentAnswer: "",
    currentAskerId: nextAskerId,
    currentResponderId: nextResponderId,
    starterAnswered
  };

  if (responderGroup) {
    updates[`scores.${responderGroup}`] = data.scores[responderGroup] + marks;
  }

  await updateDoc(roomRef, updates);
}


function hideAllActions() {
  hide("askBox");
  hide("answerBox");
  hide("scoreBox");
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("createRoomBtn").addEventListener("click", createRoom);
  document.getElementById("joinRoomBtn").addEventListener("click", joinRoom);
  document.getElementById("startGameBtn").addEventListener("click", startGame);

  document.getElementById("submitQuestionBtn")
    .addEventListener("click", submitQuestion);

  document.getElementById("submitAnswerBtn")
    .addEventListener("click", submitAnswer);

  document.getElementById("submitScoreBtn")
    .addEventListener("click", submitScore);
});