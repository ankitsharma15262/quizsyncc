import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";

export function listenRoom(roomCode, callback) {
  const roomRef = doc(db, "rooms", roomCode);

  return onSnapshot(roomRef, (snapshot) => {
    callback(snapshot.data());
  });
}

export function listenUsers(roomCode, callback) {
  const usersRef = collection(db, "rooms", roomCode, "users");

  return onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(users);
  });
}
