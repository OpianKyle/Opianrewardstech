import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, timestamp, int, json, char, decimal, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(uuid())`),
  email: varchar("email", { length: 191 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 15 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const investors = mysqlTable("investors", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(uuid())`),
  email: varchar("email", { length: 191 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  tier: varchar("tier", { length: 50 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  amount: int("amount").notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"),
  adumoPaymentId: varchar("adumo_payment_id", { length: 255 }),
  adumoCustomerId: varchar("adumo_customer_id", { length: 255 }),
  subscriptionId: varchar("subscription_id", { length: 255 }),
  questProgress: json("quest_progress"),
  certificateGenerated: timestamp("certificate_generated"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(uuid())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(uuid())`),
  investorId: varchar("investor_id", { length: 36 }).notNull().references(() => investors.id),
  amount: int("amount").notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  paymentData: json("payment_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Adumo Online Integration Tables - Updated structure
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(uuid())`),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  merchantReference: varchar("merchant_reference", { length: 255 }).notNull().unique(),
  adumoTransactionId: varchar("adumo_transaction_id", { length: 255 }).unique(),
  adumoStatus: mysqlEnum("adumo_status", ["PENDING", "SUCCESS", "FAILED", "CANCELED", "REFUNDED"]).notNull().default("PENDING"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  gateway: mysqlEnum("gateway", ["ADUMO", "STRIPE", "OTHER"]).notNull().default("ADUMO"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("ZAR"),
  requestPayload: text("request_payload"),
  responsePayload: text("response_payload"),
  notifyUrlResponse: text("notify_url_response"),
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

// OTP table for email-based authentication
export const otps = mysqlTable("otps", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: int("used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestorSchema = createInsertSchema(investors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOtpSchema = createInsertSchema(otps).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investor = typeof investors.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Otp = typeof otps.$inferSelect;
