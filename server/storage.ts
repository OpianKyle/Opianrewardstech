import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db, isDatabaseConnected } from "./db";
import { 
  InsertUser, 
  User, 
  InsertInvestor, 
  Investor,
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
  users,
  investors,
  invoices,
  payments,
  transactions,
  paymentMethods,
  otps
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Investor operations
  getInvestor(id: string): Promise<Investor | undefined>;
  getInvestorByEmail(email: string): Promise<Investor | undefined>;
  createInvestor(investor: InsertInvestor): Promise<Investor>;
  updateInvestorPaymentStatus(id: string, status: string, adumoPaymentId?: string): Promise<Investor>;
  updateInvestorProgress(id: string, progress: any): Promise<Investor>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: string, status: string): Promise<Invoice>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByInvestor(investorId: string): Promise<Payment[]>;
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
    };
    
    await db.insert(users).values(newUser);
    return newUser as User;
  }

  async getInvestor(id: string): Promise<Investor | undefined> {
    const result = await db.select().from(investors).where(eq(investors.id, id)).limit(1);
    return result[0];
  }

  async getInvestorByEmail(email: string): Promise<Investor | undefined> {
    const result = await db.select().from(investors).where(eq(investors.email, email)).limit(1);
    return result[0];
  }

  async createInvestor(insertInvestor: InsertInvestor): Promise<Investor> {
    const id = randomUUID();
    const newInvestor = {
      ...insertInvestor,
      id,
      paymentStatus: "pending",
      adumoPaymentId: null,
      adumoCustomerId: null,
      subscriptionId: null,
      questProgress: {},
      certificateGenerated: null,
    };
    
    await db.insert(investors).values(newInvestor);
    return newInvestor as Investor;
  }

  async updateInvestorPaymentStatus(
    id: string,
    status: string,
    adumoPaymentId?: string,
  ): Promise<Investor> {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date(),
    };
    
    if (adumoPaymentId) {
      updateData.adumoPaymentId = adumoPaymentId;
    }
    
    await db.update(investors).set(updateData).where(eq(investors.id, id));
    
    const result = await db.select().from(investors).where(eq(investors.id, id)).limit(1);
    if (!result[0]) {
      throw new Error("Investor not found");
    }
    return result[0];
  }

  async updateInvestorProgress(id: string, progress: any): Promise<Investor> {
    const investor = await this.getInvestor(id);
    if (!investor) {
      throw new Error("Investor not found");
    }
    
    const currentProgress = investor.questProgress || {};
    const updatedProgress = { ...currentProgress, ...progress };
    
    await db.update(investors)
      .set({ 
        questProgress: updatedProgress,
        updatedAt: new Date()
      })
      .where(eq(investors.id, id));
    
    const result = await db.select().from(investors).where(eq(investors.id, id)).limit(1);
    return result[0]!;
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

  async getPaymentsByInvestor(investorId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.investorId, investorId));
  }

  async getPaymentByMerchantReference(reference: string): Promise<Payment | undefined> {
    // Since merchant reference is stored in paymentData JSON field, we need to use JSON query
    const result = await db.select().from(payments).where(sql`JSON_EXTRACT(payment_data, '$.merchantReference') = ${reference}`).limit(1);
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
    const newOtp = {
      id,
      email: insertOtp.email,
      code: insertOtp.code,
      expiresAt: insertOtp.expiresAt,
      used: 0,
    };
    
    await db.insert(otps).values(newOtp);
    return newOtp as Otp;
  }

  async getValidOtp(email: string, code: string): Promise<Otp | undefined> {
    const result = await db
      .select()
      .from(otps)
      .where(
        sql`${otps.email} = ${email} AND ${otps.code} = ${code} AND ${otps.used} = 0 AND ${otps.expiresAt} > NOW()`
      )
      .limit(1);
    
    return result[0];
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db.update(otps).set({ used: 1 }).where(eq(otps.id, id));
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db.delete(otps).where(sql`${otps.expiresAt} < NOW()`);
  }
}

// Legacy compatibility - fallback to MemStorage if database is not available
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private investors: Map<string, Investor>;
  private invoices: Map<string, Invoice>;
  private payments: Map<string, Payment>;
  private transactions: Map<string, Transaction>;
  private paymentMethodsMap: Map<string, PaymentMethod>;
  private otpsMap: Map<string, Otp>;

  constructor() {
    this.users = new Map();
    this.investors = new Map();
    this.invoices = new Map();
    this.payments = new Map();
    this.transactions = new Map();
    this.paymentMethodsMap = new Map();
    this.otpsMap = new Map();
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getInvestor(id: string): Promise<Investor | undefined> {
    return this.investors.get(id);
  }

  async getInvestorByEmail(email: string): Promise<Investor | undefined> {
    return Array.from(this.investors.values()).find((investor) => investor.email === email);
  }

  async createInvestor(insertInvestor: InsertInvestor): Promise<Investor> {
    const id = randomUUID();
    const investor: Investor = {
      ...insertInvestor,
      id,
      paymentStatus: "pending",
      adumoPaymentId: null,
      adumoCustomerId: null,
      subscriptionId: null,
      questProgress: {},
      certificateGenerated: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.investors.set(id, investor);
    return investor;
  }

  async updateInvestorPaymentStatus(id: string, status: string, adumoPaymentId?: string): Promise<Investor> {
    const investor = this.investors.get(id);
    if (!investor) throw new Error("Investor not found");
    const updatedInvestor = { ...investor, paymentStatus: status, adumoPaymentId: adumoPaymentId || investor.adumoPaymentId, updatedAt: new Date() };
    this.investors.set(id, updatedInvestor);
    return updatedInvestor;
  }

  async updateInvestorProgress(id: string, progress: any): Promise<Investor> {
    const investor = this.investors.get(id);
    if (!investor) throw new Error("Investor not found");
    const currentProgress = investor.questProgress || {};
    const updatedInvestor = { ...investor, questProgress: { ...currentProgress, ...progress }, updatedAt: new Date() };
    this.investors.set(id, updatedInvestor);
    return updatedInvestor;
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

  async getPaymentsByInvestor(investorId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter((payment) => payment.investorId === investorId);
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