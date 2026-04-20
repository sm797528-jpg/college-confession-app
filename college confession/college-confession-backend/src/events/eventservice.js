import {
  collection, addDoc, query, orderBy,
  onSnapshot, doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";

export async function createEvent(userId, college, { title, description, date }, promotionType = "basic") {
  if (!title?.trim() || !date) throw new Error("Title and date required");
  const ref = await addDoc(collection(db, "events"), {
    title: title.trim(),
    description: description?.trim() || "",
    college,
    date: new Date(date),
    createdBy: userId,
    promotionType,
    paymentStatus: "pending",
    planType: promotionType,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function fetchEvents(college, userCollegeMeta, callback) {
  return onSnapshot(
    query(collection(db, "events"), orderBy("date", "asc")),
    (snap) => {
      const all = snap.docs.map((d) => ({ eventId: d.id, ...d.data() }));
      callback(applyPromotionFilter(all, college, userCollegeMeta));
    }
  );
}

export function applyPromotionFilter(events, userCollege, meta = null) {
  return events.filter((e) => {
    if (e.college === userCollege) return true;
    if (e.promotionType === "premium" && meta) {
      return (
        e.city === meta.city ||
        e.region === meta.region ||
        (e.groups || []).some((g) => (meta.groups || []).includes(g))
      );
    }
    return false;
  });
}
