import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, timestamp, int, json, char } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 15 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const investors = mysqlTable("investors", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 50 }).notNull(), // "builder", "innovator", "visionary"
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // "lump_sum", "12_months", "24_months"
  amount: int("amount").notNull(), // Amount in cents
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"), // "pending", "processing", "completed", "failed"
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  adumoPaymentId: varchar("adumo_payment_id", { length: 255 }),
  questProgress: json("quest_progress"),
  certificateGenerated: timestamp("certificate_generated"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  investorId: varchar("investor_id", { length: 36 }).notNull().references(() => investors.id),
  amount: int("amount").notNull(),
  method: varchar("method", { length: 50 }).notNull(), // "stripe", "adumo", "bank_transfer"
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  paymentData: json("payment_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Adumo Online Integration Tables
export const transactions = mysqlTable("transactions", {
  transactionId: varchar("transaction_id", { length: 36 }).primaryKey(),
  merchantReference: varchar("merchant_reference", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(), // AUTHORIZED, DECLINED, SETTLED
  amount: int("amount").notNull(), // Amount in cents
  currencyCode: char("currency_code", { length: 3 }).notNull().default("ZAR"),
  paymentMethod: varchar("payment_method", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  puid: varchar("puid", { length: 36 }), // Profile UID for tokenized cards
  token: text("token"), // JWT token containing transaction details
  errorCode: int("error_code"),
  errorMessage: varchar("error_message", { length: 255 }),
  errorDetail: text("error_detail"),
  paymentId: varchar("payment_id", { length: 36 }).references(() => payments.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const paymentMethods = mysqlTable("payment_methods", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  cardType: varchar("card_type", { length: 50 }),
  lastFourDigits: char("last_four_digits", { length: 4 }),
  expiryMonth: int("expiry_month"),
  expiryYear: int("expiry_year"),
  puid: varchar("puid", { length: 36 }), // Profile UID for tokenized cards
  isActive: int("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
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

// Additional schemas for Adumo integration
export const insertTransactionSchema = createInsertSchema(transactions).pick({
  transactionId: true,
  merchantReference: true,
  status: true,
  amount: true,
  currencyCode: true,
  paymentMethod: true,
  puid: true,
  token: true,
  errorCode: true,
  errorMessage: true,
  errorDetail: true,
  paymentId: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  userId: true,
  cardType: true,
  lastFourDigits: true,
  expiryMonth: true,
  expiryYear: true,
  puid: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investor = typeof investors.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
