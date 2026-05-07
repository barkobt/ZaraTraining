import { eq, asc } from "drizzle-orm";
import { getDb } from "./connection.js";
import { participants } from "../../../db/schema.js";

export async function createParticipant(data: {
  name: string;
  answers: Record<string, string>;
  totalScore: number;
  cabin: string;
}) {
  const db = getDb();
  const result = await db
    .insert(participants)
    .values({
      name: data.name,
      answers: data.answers,
      totalScore: data.totalScore,
      cabin: data.cabin,
    })
    .returning({ id: participants.id });
  return result[0] ?? null;
}

export async function getParticipantById(id: number) {
  const db = getDb();
  const result = await db.select().from(participants).where(eq(participants.id, id));
  return result[0] || null;
}

export async function getAllParticipants() {
  const db = getDb();
  return db.select().from(participants).orderBy(asc(participants.createdAt));
}
