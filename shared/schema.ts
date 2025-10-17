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
  company: varchar("company", { length: 255 }),
  // Address fields
  streetAddress: varchar("street_address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  // FICA documents
  ficaDocuments: json("fica_documents"),
  // Investment-related fields (previously in investors table)
  tier: varchar("tier", { length: 50 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  amount: int("amount"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
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
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
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
  tokenUid: varchar("token_uid", { length: 255 }), // Card token UID from Adumo tokenization
  profileUid: varchar("profile_uid", { length: 255 }), // Profile UID from Adumo tokenization
  puid: varchar("puid", { length: 36 }), // Legacy profile UID field (kept for compatibility)
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

export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(uuid())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  depositPaymentId: varchar("deposit_payment_id", { length: 36 }).references(() => payments.id),
  adumoSubscriberId: varchar("adumo_subscriber_id", { length: 255 }),
  adumoScheduleId: varchar("adumo_schedule_id", { length: 255 }),
  tier: varchar("tier", { length: 50 }).notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  totalMonths: int("total_months").notNull().default(12),
  paidMonths: int("paid_months").notNull().default(0),
  status: mysqlEnum("status", ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED", "FAILED"]).notNull().default("ACTIVE"),
  nextPaymentDate: timestamp("next_payment_date"),
  startDate: timestamp("start_date").defaultNow(),
  completedAt: timestamp("completed_at"),
  subscriptionData: json("subscription_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const accessRequests = mysqlTable("access_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(uuid())`),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 191 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  company: varchar("company", { length: 255 }),
  streetAddress: varchar("street_address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  ficaDocuments: json("fica_documents"),
  acceptedTerms: int("accepted_terms").notNull().default(0),
  acceptedPrivacy: int("accepted_privacy").notNull().default(0),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
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

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
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
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
export type AccessRequest = typeof accessRequests.$inferSelect;
