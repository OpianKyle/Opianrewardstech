import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const investors = pgTable("investors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  tier: text("tier").notNull(), // "builder", "innovator", "visionary"
  paymentMethod: text("payment_method").notNull(), // "lump_sum", "12_months", "24_months"
  amount: integer("amount").notNull(), // Amount in cents
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "processing", "completed", "failed"
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  adumoPaymentId: text("adumo_payment_id"),
  questProgress: jsonb("quest_progress").default({}),
  certificateGenerated: timestamp("certificate_generated"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investorId: varchar("investor_id").notNull().references(() => investors.id),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // "stripe", "adumo", "bank_transfer"
  status: text("status").notNull().default("pending"),
  paymentData: jsonb("payment_data").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
});

export const insertInvestorSchema = createInsertSchema(investors).pick({
  email: true,
  firstName: true,
  lastName: true,
  tier: true,
  paymentMethod: true,
  amount: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  investorId: true,
  amount: true,
  method: true,
  paymentData: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investor = typeof investors.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
