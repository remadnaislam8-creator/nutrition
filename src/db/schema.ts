import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  role: varchar("role", { length: 10 }).notNull(), // 'user' | 'bot'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
