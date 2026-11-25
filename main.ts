// Describe Your Ex in One Word — make.fun bounty
// u-puan-describe-your-ex-in-one-word-9fc6ebe7
//
// The program writes exactly one word to /output/entry.txt: the verdict
// on an ex. The judge weighs, most important first:
//   1. really one word describing an ex (a verdict on a former partner)
//   2. comic punch — lands as a joke at a glance
//   3. surprise — not the obvious choice, startles while staying clear
//   4. craft — exactly one word, spelled correctly, no punctuation tricks
//   5. recognition — anyone who has had an ex feels the truth in it
//
// The field is saturated with subscription and product-recall words —
// Unsubscribed, Recalled, Expired, Uninstalled, Refund, Deprecated,
// Internship, Timeshare, Chargeback, Repossessed — so the pick must come
// from a fresh angle. Each candidate below carries a hand score (0-10
// per criterion, summed); selection is deterministic: highest score
// wins, ties go to the shorter word. The output is byte-identical on
// every run.

import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Scores = {
  verdict: number; // really one word describing an ex
  punch: number; // comic punch at a glance
  surprise: number; // not the obvious choice
  craft: number; // exactly one word, spelled right, no tricks
  recognition: number; // anyone with an ex nods
};

type Candidate = { word: string; scores: Scores; note: string };

const CANDIDATES: Candidate[] = [
  {
    word: "Evicted",
    scores: { verdict: 10, punch: 9, surprise: 9, craft: 10, recognition: 9 },
    note: "They got evicted from my life. The person is the subject — thrown out, locks changed, no coming back. Landlord energy, vivid and final, and no one in the field is leading with housing law.",
  },
  {
    word: "Cancelled",
    scores: { verdict: 9, punch: 9, surprise: 6, craft: 10, recognition: 10 },
    note: "Cancel-culture double meaning, universally recognised — but it reads a touch more as the relationship being cancelled than the person, and it is the obvious 2026 pick, so surprise is low.",
  },
  {
    word: "Obsolete",
    scores: { verdict: 9, punch: 8, surprise: 8, craft: 10, recognition: 9 },
    note: "Outdated technology, superseded by a newer model. Dry and precise, but a cooler laugh than the top pick — more smirk than punch.",
  },
  {
    word: "Benched",
    scores: { verdict: 9, punch: 9, surprise: 9, craft: 10, recognition: 7 },
    note: "Pulled from the starting lineup. Great image and high surprise, but benched players can come back in — the verdict is less final, and non-sports fans take half a second longer.",
  },
  {
    word: "Terminated",
    scores: { verdict: 10, punch: 8, surprise: 7, craft: 10, recognition: 8 },
    note: "Fired, contract ended. A clean, final verdict — but it leans formal and corporate, and the joke lands flatter than the top pick.",
  },
  {
    word: "Downgraded",
    scores: { verdict: 9, punch: 8, surprise: 7, craft: 10, recognition: 9 },
    note: "Demoted from premium to the free tier. Recognisable to everyone on a subscription — but it sits in the same subscription family the field already overuses.",
  },
  {
    word: "Unclaimed",
    scores: { verdict: 8, punch: 8, surprise: 9, craft: 10, recognition: 7 },
    note: "Left at baggage claim, nobody came back for them. A lovely image, but the verdict needs half a second to arrive, which costs it against instant words.",
  },
  {
    word: "Surplus",
    scores: { verdict: 8, punch: 8, surprise: 9, craft: 10, recognition: 7 },
    note: "Excess stock, no longer required. Dry understatement with real craft — but the sting is quiet, and the verdict is a beat slower than the top pick.",
  },
  {
    word: "Spoiled",
    scores: { verdict: 9, punch: 8, surprise: 7, craft: 10, recognition: 8 },
    note: "Gone bad, like milk past its date. Instantly clear and funny — but a common insult shape, so surprise is middling.",
  },
  {
    word: "Foreclosed",
    scores: { verdict: 9, punch: 8, surprise: 8, craft: 10, recognition: 6 },
    note: "The bank took the house. A strong, funny image — but the mortgage term is less universal outside the US, which costs recognition.",
  },
  {
    word: "Unfollowed",
    scores: { verdict: 9, punch: 7, surprise: 6, craft: 10, recognition: 9 },
    note: "Removed from the feed. True and relatable, but gentle — more shrug than joke, and the social-media angle is well trodden.",
  },
  {
    word: "Exiled",
    scores: { verdict: 9, punch: 7, surprise: 7, craft: 10, recognition: 7 },
    note: "Banished from the kingdom. Poetic and final — but it plays dramatic rather than funny, and drama loses to punch under this judge.",
  },
];

// Revision (second pass, head-to-head of the top three):
//   Evicted vs Cancelled — Cancelled loses on surprise: it is the
//   obvious 2026 pick and the field is already full of -ed verdicts
//   (Unsubscribed, Recalled, Expired), so it reads as one more of them.
//   Evicted vs Obsolete — Obsolete loses on punch: it is a smirk, not
//   a laugh, and its verdict is colder. Evicted wins on finality (no
//   coming back from an eviction, unlike Benched), on image (locks
//   changed, their stuff on the curb), and on absence from the field.
//   Direction is fixed: the ex is the tenant thrown out of my life,
//   not the other way round. Pick stands: Evicted, 47/50.
function total(s: Scores): number {
  return s.verdict + s.punch + s.surprise + s.craft + s.recognition;
}

/** Mirror the sealed gate exactly: UTF-8 text, 1-111 characters, not
 *  only white space, and exactly one word. */
function validateGate(word: string): string {
  if (typeof word !== "string") throw new Error("entry must be text");
  Buffer.from(word, "utf-8"); // must be encodable UTF-8
  if (word.length < 1 || word.length > 111) {
    throw new Error(`gate: length ${word.length} outside 1-111`);
  }
  if (!word.trim()) throw new Error("gate: entry is only white space");
  if (word !== word.trim()) {
    throw new Error("gate: entry has surrounding white space");
  }
  if (/[\s]/.test(word)) {
    throw new Error("gate: entry must be exactly one word");
  }
  if (!/^[A-Za-z]+$/.test(word)) {
    throw new Error("gate: entry must be a plain word");
  }
  return word;
}

function pick(candidates: Candidate[]): string {
  let best: { score: number; length: number; word: string } | null = null;
  for (const c of candidates) {
    validateGate(c.word);
    // Highest score wins; ties go to the shorter word.
    const score = total(c.scores);
    if (
      best === null ||
      score > best.score ||
      (score === best.score && c.word.length < best.length)
    ) {
      best = { score, length: c.word.length, word: c.word };
    }
  }
  if (best === null) throw new Error("no candidates");
  return best.word;
}

function writeEntry(word: string, attempts = 3): string {
  mkdirSync("/output", { recursive: true });
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      writeFileSync("/output/entry.txt", word, "utf-8");
      // The scorer collects outputs as another user, so the file must
      // be readable by everyone (mode 0644).
      chmodSync("/output/entry.txt", 0o644);
      const written = readFileSync("/output/entry.txt", "utf-8");
      validateGate(written);
      if (written !== word) {
        throw new Error("entry.txt differs from the chosen word");
      }
      return written;
    } catch (e) {
      lastError = e;
      if (attempt === attempts) throw e;
    }
  }
  throw lastError; // unreachable: the loop always returns or throws
}

function main(): void {
  const word = pick(CANDIDATES);
  const written = writeEntry(word);
  // Final read-back: the gate reads this file, not stdout.
  if (written !== word) throw new Error("read-back mismatch");
  console.log(word);
}

main();
