import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { inquiries, type Inquiry } from "@/lib/db/schema";

export async function listInquiries(limit = 100): Promise<Inquiry[]> {
  const db = await getDb();
  return db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(limit);
}
