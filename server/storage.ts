import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db, isDatabaseConnected } from "./db";
import { 
  InsertUser, 
  User, 
  InsertInvoice,
  Invoice, 
  InsertPayment, 
  Payment,
  InsertTransaction,
  Transaction,
  InsertPaymentMethod,
  PaymentMethod,
  InsertOtp,
  Otp,
  InsertSubscription,
  Subscription,
  InsertAccessRequest,
  AccessRequest,
  users,
  invoices,
  payments,
  transactions,
  paymentMethods,
  otps,
  subscriptions,
  accessRequests
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPaymentStatus(id: string, status: string, adumoPaymentId?: string): Promise<User>;
  updateUserProgress(id: string, progress: any): Promise<User>;
  updateUserInvestmentDetails(id: string, details: Partial<User>): Promise<User>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: string, status: string): Promise<Invoice>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  getPaymentByMerchantReference(reference: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: string): Promise<Payment>;
  
  // Transaction operations (Adumo integration)
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionByMerchantReference(reference: string): Promise<Transaction | undefined>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  
  // Payment method operations
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]>;
  deactivatePaymentMethod(id: string): Promise<PaymentMethod>;
  
  // OTP operations
  createOtp(otp: InsertOtp): Promise<Otp>;
  getValidOtp(email: string, code: string): Promise<Otp | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByAdumoSubscriberId(adumoSubscriberId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  incrementSubscriptionPaidMonths(id: string): Promise<Subscription>;
  
  // Access Request operations
  createAccessRequest(accessRequest: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequest(id: string): Promise<AccessRequest | undefined>;
  getAllAccessRequests(): Promise<AccessRequest[]>;
  updateAccessRequestStatus(id: string, status: string): Promise<AccessRequest>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser = {
      ...insertUser,
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      phone: insertUser.phone || null,
      company: insertUser.company || null,
      streetAddress: insertUser.streetAddress || null,
      city: insertUser.city || null,
      province: insertUser.province || null,
      postalCode: insertUser.postalCode || null,
      country: insertUser.country || null,
      ficaDocuments: insertUser.ficaDocuments || null,
      tier: insertUser.tier || null,
      paymentMethod: insertUser.paymentMethod || null,
      amount: insertUser.amount || null,
      paymentStatus: insertUser.paymentStatus || "pending",
      adumoPaymentId: insertUser.adumoPaymentId || null,
      adumoCustomerId: insertUser.adumoCustomerId || null,
      subscriptionId: insertUser.subscriptionId || null,
      questProgress: insertUser.questProgress || null,
      certificateGenerated: insertUser.certificateGenerated || null,
    };
    
    await db.insert(users).values(newUser);
    return newUser as User;
  }

  async updateUserPaymentStatus(
    id: string,
    status: string,
    adumoPaymentId?: string,
  ): Promise<User> {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date(),
    };
    
    if (adumoPaymentId) {
      updateData.adumoPaymentId = adumoPaymentId;
    }
    
    await db.update(users).set(updateData).where(eq(users.id, id));
    
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("User not found");
    }
    return result[0];
  }

  async updateUserProgress(id: string, progress: any): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const currentProgress = user.questProgress || {};
    const updatedProgress = { ...currentProgress, ...progress };
    
    await db.update(users)
      .set({ 
        questProgress: updatedProgress,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
    
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0]!;
  }

  async updateUserInvestmentDetails(id: string, details: Partial<User>): Promise<User> {
    await db.update(users)
      .set({ 
        ...details,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
    
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("User not found");
    }
    return result[0];
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const newPayment = {
      ...insertPayment,
      id,
      status: "pending",
      paymentData: insertPayment.paymentData || {},
    };
    
    await db.insert(payments).values(newPayment);
    return newPayment as Payment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const result = await db.select().from(payments).where(eq(payments.userId, userId));
    
    // Parse paymentData if it's a string (MySQL sometimes returns JSON as string)
    result.forEach((payment: Payment) => {
      if (payment.paymentData && typeof payment.paymentData === 'string') {
        payment.paymentData = JSON.parse(payment.paymentData as string);
      }
    });
    
    return result;
  }

  async getPaymentByMerchantReference(reference: string): Promise<Payment | undefined> {
    // Since merchant reference is stored in paymentData JSON field, we need to use JSON query
    const result = await db.select().from(payments).where(sql`JSON_EXTRACT(payment_data, '$.merchantReference') = ${reference}`).limit(1);
    
    // Parse paymentData if it's a string (MySQL sometimes returns JSON as string)
    if (result[0] && typeof result[0].paymentData === 'string') {
      result[0].paymentData = JSON.parse(result[0].paymentData);
    }
    
    return result[0];
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    await db.update(payments)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id));
    
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("Payment not found");
    }
    
    // Parse paymentData if it's a string (MySQL sometimes returns JSON as string)
    if (result[0].paymentData && typeof result[0].paymentData === 'string') {
      result[0].paymentData = JSON.parse(result[0].paymentData as string);
    }
    
    return result[0];
  }

  // Invoice Methods
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const newInvoice = {
      ...insertInvoice,
      id,
    };
    
    await db.insert(invoices).values(newInvoice);
    return newInvoice as Invoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    await db.update(invoices)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id));
    
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("Invoice not found");
    }
    return result[0];
  }

  // Adumo Integration Methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const newTransaction = {
      ...insertTransaction,
      id,
    };
    
    await db.insert(transactions).values(newTransaction);
    return newTransaction as Transaction;
  }

  async getTransactionByMerchantReference(reference: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.merchantReference, reference)).limit(1);
    return result[0];
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await db.update(transactions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id));
    
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("Transaction not found");
    }
    return result[0];
  }

  // Payment Method Operations
  async createPaymentMethod(insertPaymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = randomUUID();
    const newPaymentMethod = {
      id,
      userId: insertPaymentMethod.userId,
      cardType: insertPaymentMethod.cardType || null,
      lastFourDigits: insertPaymentMethod.lastFourDigits || null,
      expiryMonth: insertPaymentMethod.expiryMonth || null,
      expiryYear: insertPaymentMethod.expiryYear || null,
      tokenUid: insertPaymentMethod.tokenUid || null,
      profileUid: insertPaymentMethod.profileUid || null,
      puid: insertPaymentMethod.puid || null,
      isActive: 1,
    };
    
    await db.insert(paymentMethods).values(newPaymentMethod);
    return newPaymentMethod as PaymentMethod;
  }

  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }

  async deactivatePaymentMethod(id: string): Promise<PaymentMethod> {
    await db.update(paymentMethods)
      .set({ 
        isActive: 0,
        updatedAt: new Date()
      })
      .where(eq(paymentMethods.id, id));
    
    const result = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("Payment method not found");
    }
    return result[0];
  }

  // OTP Operations
  async createOtp(insertOtp: InsertOtp): Promise<Otp> {
    const id = randomUUID();
    // Normalize email to lowercase for consistent storage
    const newOtp = {
      id,
      email: insertOtp.email.toLowerCase(),
      code: insertOtp.code,
      expiresAt: insertOtp.expiresAt,
      used: 0,
    };
    
    await db.insert(otps).values(newOtp);
    console.log(`💾 OTP created: email=${newOtp.email}, code=${newOtp.code}, expires=${newOtp.expiresAt}`);
    return newOtp as Otp;
  }

  async getValidOtp(email: string, code: string): Promise<Otp | undefined> {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase();
    const now = new Date();
    
    const result = await db
      .select()
      .from(otps)
      .where(
        sql`LOWER(${otps.email}) = ${normalizedEmail} AND ${otps.code} = ${code} AND ${otps.used} = 0 AND ${otps.expiresAt} > ${now}`
      )
      .limit(1);
    
    console.log(`🔍 OTP lookup: email=${normalizedEmail}, code=${code}, now=${now.toISOString()}, found=${!!result[0]}`);
    if (result[0]) {
      console.log(`✅ Found OTP: expires=${result[0].expiresAt}`);
    }
    return result[0];
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db.update(otps).set({ used: 1 }).where(eq(otps.id, id));
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db.delete(otps).where(sql`${otps.expiresAt} < NOW()`);
  }

  // Subscription Operations
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const newSubscription = {
      id,
      userId: insertSubscription.userId,
      depositPaymentId: insertSubscription.depositPaymentId || null,
      adumoSubscriberId: insertSubscription.adumoSubscriberId || null,
      adumoScheduleId: insertSubscription.adumoScheduleId || null,
      tier: insertSubscription.tier,
      monthlyAmount: insertSubscription.monthlyAmount,
      totalMonths: insertSubscription.totalMonths || 12,
      paidMonths: insertSubscription.paidMonths || 0,
      status: insertSubscription.status || "ACTIVE",
      nextPaymentDate: insertSubscription.nextPaymentDate || null,
      startDate: insertSubscription.startDate || new Date(),
      completedAt: insertSubscription.completedAt || null,
      subscriptionData: insertSubscription.subscriptionData || null,
    };
    
    await db.insert(subscriptions).values(newSubscription);
    return newSubscription as Subscription;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    return result[0];
  }

  async getSubscriptionByAdumoSubscriberId(adumoSubscriberId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.adumoSubscriberId, adumoSubscriberId)).limit(1);
    return result[0];
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    await db.update(subscriptions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id));
    
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("Subscription not found");
    }
    return result[0];
  }

  async incrementSubscriptionPaidMonths(id: string): Promise<Subscription> {
    const subscription = await this.getSubscription(id);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    
    const newPaidMonths = (subscription.paidMonths || 0) + 1;
    const updates: Partial<Subscription> = {
      paidMonths: newPaidMonths,
    };
    
    if (newPaidMonths >= subscription.totalMonths) {
      updates.status = "COMPLETED";
      updates.completedAt = new Date();
    }
    
    return this.updateSubscription(id, updates);
  }

  // Access Request Operations
  async createAccessRequest(insertAccessRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = randomUUID();
    const newAccessRequest = {
      id,
      firstName: insertAccessRequest.firstName,
      lastName: insertAccessRequest.lastName,
      email: insertAccessRequest.email,
      phone: insertAccessRequest.phone,
      company: insertAccessRequest.company || null,
      streetAddress: insertAccessRequest.streetAddress,
      city: insertAccessRequest.city,
      province: insertAccessRequest.province,
      postalCode: insertAccessRequest.postalCode,
      country: insertAccessRequest.country,
      ficaDocuments: insertAccessRequest.ficaDocuments || null,
      acceptedTerms: insertAccessRequest.acceptedTerms || 0,
      acceptedPrivacy: insertAccessRequest.acceptedPrivacy || 0,
      status: insertAccessRequest.status || "pending",
    };
    
    await db.insert(accessRequests).values(newAccessRequest);
    return newAccessRequest as AccessRequest;
  }

  async getAccessRequest(id: string): Promise<AccessRequest | undefined> {
    const result = await db.select().from(accessRequests).where(eq(accessRequests.id, id)).limit(1);
    return result[0];
  }

  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return await db.select().from(accessRequests);
  }

  async updateAccessRequestStatus(id: string, status: string): Promise<AccessRequest> {
    await db.update(accessRequests)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(accessRequests.id, id));
    
    const result = await db.select().from(accessRequests).where(eq(accessRequests.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("Access request not found");
    }
    return result[0];
  }
}

// Legacy compatibility - fallback to MemStorage if database is not available
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private invoices: Map<string, Invoice>;
  private payments: Map<string, Payment>;
  private transactions: Map<string, Transaction>;
  private paymentMethodsMap: Map<string, PaymentMethod>;
  private otpsMap: Map<string, Otp>;
  private subscriptionsMap: Map<string, Subscription>;
  private accessRequestsMap: Map<string, AccessRequest>;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.payments = new Map();
    this.transactions = new Map();
    this.paymentMethodsMap = new Map();
    this.otpsMap = new Map();
    this.subscriptionsMap = new Map();
    this.accessRequestsMap = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      phone: insertUser.phone || null,
      company: insertUser.company || null,
      streetAddress: insertUser.streetAddress || null,
      city: insertUser.city || null,
      province: insertUser.province || null,
      postalCode: insertUser.postalCode || null,
      country: insertUser.country || null,
      ficaDocuments: insertUser.ficaDocuments || null,
      tier: insertUser.tier || null,
      paymentMethod: insertUser.paymentMethod || null,
      amount: insertUser.amount || null,
      paymentStatus: insertUser.paymentStatus || "pending",
      adumoPaymentId: insertUser.adumoPaymentId || null,
      adumoCustomerId: insertUser.adumoCustomerId || null,
      subscriptionId: insertUser.subscriptionId || null,
      questProgress: insertUser.questProgress || null,
      certificateGenerated: insertUser.certificateGenerated || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPaymentStatus(id: string, status: string, adumoPaymentId?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, paymentStatus: status, adumoPaymentId: adumoPaymentId || user.adumoPaymentId, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProgress(id: string, progress: any): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const currentProgress = user.questProgress || {};
    const updatedUser = { ...user, questProgress: { ...currentProgress, ...progress }, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserInvestmentDetails(id: string, details: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...details, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      status: "pending", 
      paymentData: insertPayment.paymentData || {}, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter((payment) => payment.userId === userId);
  }

  async getPaymentByMerchantReference(reference: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(payment => {
      const paymentData = payment.paymentData as any;
      return paymentData?.merchantReference === reference;
    });
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    const payment = this.payments.get(id);
    if (!payment) throw new Error("Payment not found");
    const updatedPayment = { ...payment, status, updatedAt: new Date() };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Invoice Methods
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      status: insertInvoice.status || "pending",
      description: insertInvoice.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error("Invoice not found");
    const updatedInvoice = { ...invoice, status, updatedAt: new Date() };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  // Adumo Integration stub methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction,
      id,
      adumoStatus: insertTransaction.adumoStatus || "PENDING",
      gateway: insertTransaction.gateway || "ADUMO",
      currency: insertTransaction.currency || "ZAR",
      adumoTransactionId: insertTransaction.adumoTransactionId || null,
      paymentMethod: insertTransaction.paymentMethod || null,
      requestPayload: insertTransaction.requestPayload || null,
      responsePayload: insertTransaction.responsePayload || null,
      notifyUrlResponse: insertTransaction.notifyUrlResponse || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionByMerchantReference(reference: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(t => t.merchantReference === reference);
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error("Transaction not found");
    const updated = { 
      ...transaction, 
      ...updates,
      updatedAt: new Date() 
    };
    this.transactions.set(id, updated);
    return updated;
  }

  async createPaymentMethod(insertPaymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = randomUUID();
    const paymentMethod: PaymentMethod = { 
      id,
      userId: insertPaymentMethod.userId,
      cardType: insertPaymentMethod.cardType || null,
      lastFourDigits: insertPaymentMethod.lastFourDigits || null,
      expiryMonth: insertPaymentMethod.expiryMonth || null,
      expiryYear: insertPaymentMethod.expiryYear || null,
      tokenUid: insertPaymentMethod.tokenUid || null,
      profileUid: insertPaymentMethod.profileUid || null,
      puid: insertPaymentMethod.puid || null,
      isActive: 1, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.paymentMethodsMap.set(id, paymentMethod);
    return paymentMethod;
  }

  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethodsMap.values()).filter(pm => pm.userId === userId);
  }

  async deactivatePaymentMethod(id: string): Promise<PaymentMethod> {
    const paymentMethod = this.paymentMethodsMap.get(id);
    if (!paymentMethod) throw new Error("Payment method not found");
    const updated = { ...paymentMethod, isActive: 0, updatedAt: new Date() };
    this.paymentMethodsMap.set(id, updated);
    return updated;
  }

  // OTP Operations (in-memory implementation)
  async createOtp(insertOtp: InsertOtp): Promise<Otp> {
    const id = randomUUID();
    const otp: Otp = {
      id,
      email: insertOtp.email,
      code: insertOtp.code,
      expiresAt: insertOtp.expiresAt,
      used: 0,
      createdAt: new Date(),
    };
    this.otpsMap.set(id, otp);
    return otp;
  }

  async getValidOtp(email: string, code: string): Promise<Otp | undefined> {
    const now = new Date();
    return Array.from(this.otpsMap.values()).find(
      otp => otp.email === email && otp.code === code && otp.used === 0 && otp.expiresAt > now
    );
  }

  async markOtpAsUsed(id: string): Promise<void> {
    const otp = this.otpsMap.get(id);
    if (otp) {
      this.otpsMap.set(id, { ...otp, used: 1 });
    }
  }

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    Array.from(this.otpsMap.entries()).forEach(([id, otp]) => {
      if (otp.expiresAt < now) {
        this.otpsMap.delete(id);
      }
    });
  }

  // Subscription Operations (in-memory implementation)
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      id,
      userId: insertSubscription.userId,
      depositPaymentId: insertSubscription.depositPaymentId || null,
      adumoSubscriberId: insertSubscription.adumoSubscriberId || null,
      adumoScheduleId: insertSubscription.adumoScheduleId || null,
      tier: insertSubscription.tier,
      monthlyAmount: insertSubscription.monthlyAmount,
      totalMonths: insertSubscription.totalMonths || 12,
      paidMonths: insertSubscription.paidMonths || 0,
      status: insertSubscription.status || "ACTIVE",
      nextPaymentDate: insertSubscription.nextPaymentDate || null,
      startDate: insertSubscription.startDate || new Date(),
      completedAt: insertSubscription.completedAt || null,
      subscriptionData: insertSubscription.subscriptionData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptionsMap.set(id, subscription);
    return subscription;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptionsMap.get(id);
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsMap.values()).find(s => s.userId === userId);
  }

  async getSubscriptionByAdumoSubscriberId(adumoSubscriberId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsMap.values()).find(s => s.adumoSubscriberId === adumoSubscriberId);
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptionsMap.get(id);
    if (!subscription) throw new Error("Subscription not found");
    const updated = { 
      ...subscription, 
      ...updates,
      updatedAt: new Date() 
    };
    this.subscriptionsMap.set(id, updated);
    return updated;
  }

  async incrementSubscriptionPaidMonths(id: string): Promise<Subscription> {
    const subscription = this.subscriptionsMap.get(id);
    if (!subscription) throw new Error("Subscription not found");
    
    const newPaidMonths = (subscription.paidMonths || 0) + 1;
    const updates: Partial<Subscription> = {
      paidMonths: newPaidMonths,
    };
    
    if (newPaidMonths >= subscription.totalMonths) {
      updates.status = "COMPLETED";
      updates.completedAt = new Date();
    }
    
    return this.updateSubscription(id, updates);
  }

  // Access Request Operations (in-memory implementation)
  async createAccessRequest(insertAccessRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = randomUUID();
    const accessRequest: AccessRequest = {
      id,
      firstName: insertAccessRequest.firstName,
      lastName: insertAccessRequest.lastName,
      email: insertAccessRequest.email,
      phone: insertAccessRequest.phone,
      company: insertAccessRequest.company || null,
      streetAddress: insertAccessRequest.streetAddress,
      city: insertAccessRequest.city,
      province: insertAccessRequest.province,
      postalCode: insertAccessRequest.postalCode,
      country: insertAccessRequest.country,
      ficaDocuments: insertAccessRequest.ficaDocuments || null,
      acceptedTerms: insertAccessRequest.acceptedTerms || 0,
      acceptedPrivacy: insertAccessRequest.acceptedPrivacy || 0,
      status: insertAccessRequest.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accessRequestsMap.set(id, accessRequest);
    return accessRequest;
  }

  async getAccessRequest(id: string): Promise<AccessRequest | undefined> {
    return this.accessRequestsMap.get(id);
  }

  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return Array.from(this.accessRequestsMap.values());
  }

  async updateAccessRequestStatus(id: string, status: string): Promise<AccessRequest> {
    const accessRequest = this.accessRequestsMap.get(id);
    if (!accessRequest) throw new Error("Access request not found");
    const updated = { ...accessRequest, status, updatedAt: new Date() };
    this.accessRequestsMap.set(id, updated);
    return updated;
  }
}

// Export storage instance - use DatabaseStorage if available, fallback to MemStorage
let storageInstance: IStorage;

try {
  // Check if database is available and configured
  if (isDatabaseConnected()) {
    console.log("🗄️ Using MySQL Database Storage (Xneelo)");
    storageInstance = new DatabaseStorage();
  } else {
    console.log("🧠 Using in-memory storage for development");
    storageInstance = new MemStorage();
  }
} catch (error) {
  console.error("❌ Database initialization failed, falling back to in-memory storage:", error);
  storageInstance = new MemStorage();
}

export const storage = storageInstance;