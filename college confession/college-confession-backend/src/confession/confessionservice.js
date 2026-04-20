import {
  collection, addDoc, query, where, orderBy, limit,
  onSnapshot, doc, getDoc, increment, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { checkBadWords, increaseWarning, isUserBanned } from "../moderation/moderationservice.js";
import { generateAnonName } from "../utils/namegenerator.js";
import { rateLimit } from "../utils/ratelimiter.js";

const REPORT_HIDE_THRESHOLD = 5;

export async function createPost(userId, college, text) {
  if (!text?.trim()) throw new Error("Text required");
  if (await isUserBanned(userId)) throw new Error("You are banned.");
  rateLimit(`post_${userId}`, 60_000);

  if (checkBadWords(text)) {
    const r = await increaseWarning(userId);
    throw new Error(r.banned ? "Banned for 1 hour." : `Warning ${r.warnings}/3: Inappropriate language.`);
  }

  const ref = await addDoc(collection(db, "posts"), {
    text: text.trim(),
    userId,
    anonymousName: generateAnonName(userId),
    college,
    likes: 0,
    reportCount: 0,
    hidden: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function fetchPosts(college, callback, limitCount = 30) {
  return onSnapshot(
    query(collection(db, "posts"),
      where("college", "==", college),
      where("hidden", "==", false),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    ),
    (snap) => callback(snap.docs.map((d) => ({ postId: d.id, ...d.data() })))
  );
}

export function fetchTrendingPosts(college, callback, limitCount = 10) {
  return onSnapshot(
    query(collection(db, "posts"),
      where("college", "==", college),
      where("hidden", "==", false),
      orderBy("likes", "desc"),
      limit(limitCount)
    ),
    (snap) => callback(snap.docs.map((d) => ({ postId: d.id, ...d.data() })))
  );
}

export async function likePost(postId, userId) {
  const likeRef = doc(db, "posts", postId, "likes", userId);
  if ((await getDoc(likeRef)).exists()) throw new Error("Already liked");
  const batch = writeBatch(db);
  batch.set(likeRef, { likedAt: serverTimestamp() });
  batch.update(doc(db, "posts", postId), { likes: increment(1) });
  await batch.commit();
}

export async function reportPost(postId, userId) {
  const reportRef = doc(db, "posts", postId, "reports", userId);
  if ((await getDoc(reportRef)).exists()) throw new Error("Already reported");

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) throw new Error("Post not found");

  const batch = writeBatch(db);
  batch.set(reportRef, { reportedAt: serverTimestamp() });
  const newCount = (postSnap.data().reportCount || 0) + 1;
  batch.update(postRef, {
    reportCount: increment(1),
    ...(newCount >= REPORT_HIDE_THRESHOLD && { hidden: true }),
  });
  await batch.commit();
}

export const getShareableLink = (postId) =>
  `${typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}/post/${postId}`;
