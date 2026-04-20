import {
  collection, addDoc, query, where,
  orderBy, limit, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { checkBadWords, increaseWarning, isUserBanned } from "../moderation/moderationservice.js";
import { rateLimit } from "../utils/ratelimiter.js";

export async function sendMessage(userId, college, message) {
  if (!message?.trim()) throw new Error("Message empty");
  if (await isUserBanned(userId)) throw new Error("You are banned from chat.");
  rateLimit(`chat_${userId}`, 3_000);

  if (checkBadWords(message)) {
    const r = await increaseWarning(userId);
    throw new Error(r.banned ? "Banned for 1 hour." : `Warning ${r.warnings}/3: Inappropriate language.`);
  }

  await addDoc(collection(db, "chat"), {
    message: message.trim(),
    userId,
    college,
    timestamp: serverTimestamp(),
  });
}

export function fetchChat(college, callback, limitCount = 100) {
  return onSnapshot(
    query(collection(db, "chat"),
      where("college", "==", college),
      orderBy("timestamp", "asc"),
      limit(limitCount)
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
