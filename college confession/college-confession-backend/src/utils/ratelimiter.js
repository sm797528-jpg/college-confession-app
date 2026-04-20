const store = {}; // { key: lastTimestamp }

/**
 * @param {string} key      - unique key e.g. `post_${userId}`
 * @param {number} cooldown - ms between allowed actions
 * @throws if called too soon
 */
export function rateLimit(key, cooldown) {
  const now = Date.now();
  if (store[key] && now - store[key] < cooldown) {
    const wait = Math.ceil((cooldown - (now - store[key])) / 1000);
    throw new Error(`Too fast. Wait ${wait}s.`);
  }
  store[key] = now;
}
