import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";

/**
 * Placeholder — wire up Razorpay/Stripe webhook to call this.
 * @param {string} eventId
 * @param {"paid"|"failed"} paymentStatus
 * @param {"basic"|"premium"} planType
 */
export async function updatePaymentStatus(eventId, paymentStatus, planType) {
  await updateDoc(doc(db, "events", eventId), {
    paymentStatus,
    planType,
    promotionType: planType,
  });
}

/**
 * Initiate payment session — stub for Razorpay/Stripe.
 * Replace the body with your actual payment SDK call.
 */
export async function initiatePayment({ eventId, userId, planType, amount }) {
  // TODO: call Razorpay/Stripe API here
  console.log(`[Payment] Initiating ${planType} plan for event ${eventId} by ${userId} — ₹${amount}`);
  return { orderId: `mock_order_${Date.now()}`, amount, planType };
}
