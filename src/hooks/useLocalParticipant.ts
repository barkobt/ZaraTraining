import { SCORING_TABLE, calculateCabin } from "@contracts/constants";

const KEY_PREFIX = "zara:participant:";

export interface LocalParticipant {
  id: string;
  name: string;
  totalScore: number;
  cabin: string;
  cabinName: string;
  label: string;
  description: string;
  longText: string;
  answers: Record<string, string>;
  createdAt: number;
}

function computeScore(answers: Record<string, string>): number {
  let total = 0;
  for (let i = 0; i < SCORING_TABLE.length; i++) {
    const ans = answers[String(i + 1)];
    if (ans && SCORING_TABLE[i][ans] != null) {
      total += SCORING_TABLE[i][ans];
    }
  }
  return total;
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function saveLocal(name: string, answers: Record<string, string>): LocalParticipant {
  const totalScore = computeScore(answers);
  const cabinInfo = calculateCabin(totalScore);
  const uuid = genId();
  const id = `local-${uuid}`;

  const record: LocalParticipant = {
    id,
    name,
    totalScore,
    answers,
    createdAt: Date.now(),
    ...cabinInfo,
  };

  try {
    localStorage.setItem(KEY_PREFIX + uuid, JSON.stringify(record));
  } catch {
    // ignore storage errors — record still returned for navigation
  }
  return record;
}

export function getLocal(id: string): LocalParticipant | null {
  if (!id.startsWith("local-")) return null;
  const uuid = id.slice("local-".length);
  try {
    const raw = localStorage.getItem(KEY_PREFIX + uuid);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalParticipant;
    // Recompute via current scoring table in case constants changed
    if (parsed.answers) {
      const totalScore = computeScore(parsed.answers);
      const cabinInfo = calculateCabin(totalScore);
      return { ...parsed, totalScore, ...cabinInfo };
    }
    return parsed;
  } catch {
    return null;
  }
}
