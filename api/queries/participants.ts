import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { participants } from "@db/schema";

export async function createParticipant(data: {
  name: string;
  answers: Record<string, string>;
  totalScore: number;
  cabin: string;
}) {
  const db = getDb();
  const result = await db.insert(participants).values({
    name: data.name,
    answers: data.answers,
    totalScore: data.totalScore,
    cabin: data.cabin,
  });
  return result;
}

export async function getParticipantById(id: number) {
  const db = getDb();
  const result = await db.select().from(participants).where(eq(participants.id, id));
  return result[0] || null;
}

export async function getAllParticipants() {
  const db = getDb();
  return db.select().from(participants).orderBy(participants.createdAt);
}
