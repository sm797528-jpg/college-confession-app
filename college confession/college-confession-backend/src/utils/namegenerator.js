const ADJECTIVES = ["Chaotic","Sleepy","Unhinged","Caffeinated","Mysterious","Frantic","Suspicious","Philosophical","Cursed","Feral"];
const NOUNS = ["Noodle","Gremlin","Raccoon","Pigeon","Goblin","Hamster","Specter","Toaster","Penguin","Cryptid"];

export function generateAnonName(seed = "") {
  const n = [...(seed + Date.now().toString())].reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${ADJECTIVES[n % ADJECTIVES.length]} ${NOUNS[(n * 7) % NOUNS.length]}`;
}
