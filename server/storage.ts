import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, isDatabaseAvailable } from "./db";
import { 
  InsertUser, 
  User, 
  InsertInvestor, 
  Investor, 
  InsertPayment, 
  Payment,
  InsertTransaction,
  Transaction,
  InsertPaymentMethod,
  PaymentMethod,
  users,
  investors,
  payments,
  transactions,
  paymentMethods
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
  updateInvestorPaymentStatus(id: string, status: string, paymentIntentId?: string): Promise<Investor>;
  updateInvestorProgress(id: string, progress: any): Promise<Investor>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByInvestor(investorId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string): Promise<Payment>;
  
  // Transaction operations (Adumo integration)
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionByMerchantReference(reference: string): Promise<Transaction | undefined>;
  updateTransactionStatus(transactionId: string, status: string, errorCode?: number, errorMessage?: string): Promise<Transaction>;
  
  // Payment method operations
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]>;
  deactivatePaymentMethod(id: string): Promise<PaymentMethod>;
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
      stripePaymentIntentId: null,
      adumoPaymentId: null,
      questProgress: {},
      certificateGenerated: null,
    };
    
    await db.insert(investors).values(newInvestor);
    return newInvestor as Investor;
  }

  async updateInvestorPaymentStatus(
    id: string,
    status: string,
    paymentIntentId?: string,
  ): Promise<Investor> {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date(),
    };
    
    if (paymentIntentId) {
      updateData.stripePaymentIntentId = paymentIntentId;
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
    
    const updatedProgress = { ...investor.questProgress, ...progress };
    
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

  // Adumo Integration Methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    await db.insert(transactions).values(insertTransaction);
    
    const result = await db.select().from(transactions).where(eq(transactions.transactionId, insertTransaction.transactionId)).limit(1);
    if (!result[0]) {
      throw new Error("Failed to create transaction");
    }
    return result[0];
  }

  async getTransactionByMerchantReference(reference: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.merchantReference, reference)).limit(1);
    return result[0];
  }

  async updateTransactionStatus(
    transactionId: string, 
    status: string, 
    errorCode?: number, 
    errorMessage?: string
  ): Promise<Transaction> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (errorCode !== undefined) {
      updateData.errorCode = errorCode;
    } else {
      updateData.errorCode = null;
    }
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    } else {
      updateData.errorMessage = null;
    }
    
    await db.update(transactions)
      .set(updateData)
      .where(eq(transactions.transactionId, transactionId));
    
    const result = await db.select().from(transactions).where(eq(transactions.transactionId, transactionId)).limit(1);
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
}

// Legacy compatibility - fallback to MemStorage if database is not available
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private investors: Map<string, Investor>;
  private payments: Map<string, Payment>;
  private transactions: Map<string, Transaction>;
  private paymentMethodsMap: Map<string, PaymentMethod>;

  constructor() {
    this.users = new Map();
    this.investors = new Map();
    this.payments = new Map();
    this.transactions = new Map();
    this.paymentMethodsMap = new Map();
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
      stripePaymentIntentId: null,
      adumoPaymentId: null,
      questProgress: {},
      certificateGenerated: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.investors.set(id, investor);
    return investor;
  }

  async updateInvestorPaymentStatus(id: string, status: string, paymentIntentId?: string): Promise<Investor> {
    const investor = this.investors.get(id);
    if (!investor) throw new Error("Investor not found");
    const updatedInvestor = { ...investor, paymentStatus: status, stripePaymentIntentId: paymentIntentId || investor.stripePaymentIntentId, updatedAt: new Date() };
    this.investors.set(id, updatedInvestor);
    return updatedInvestor;
  }

  async updateInvestorProgress(id: string, progress: any): Promise<Investor> {
    const investor = this.investors.get(id);
    if (!investor) throw new Error("Investor not found");
    const updatedInvestor = { ...investor, questProgress: { ...investor.questProgress, ...progress }, updatedAt: new Date() };
    this.investors.set(id, updatedInvestor);
    return updatedInvestor;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = { ...insertPayment, id, status: "pending", createdAt: new Date(), updatedAt: new Date() };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentsByInvestor(investorId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter((payment) => payment.investorId === investorId);
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    const payment = this.payments.get(id);
    if (!payment) throw new Error("Payment not found");
    const updatedPayment = { ...payment, status, updatedAt: new Date() };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Adumo Integration stub methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = { 
      transactionId: insertTransaction.transactionId!,
      merchantReference: insertTransaction.merchantReference!,
      status: insertTransaction.status!,
      amount: insertTransaction.amount!,
      currencyCode: insertTransaction.currencyCode || "ZAR",
      paymentMethod: insertTransaction.paymentMethod!,
      timestamp: new Date(),
      puid: insertTransaction.puid || null,
      token: insertTransaction.token || null,
      errorCode: insertTransaction.errorCode || null,
      errorMessage: insertTransaction.errorMessage || null,
      errorDetail: insertTransaction.errorDetail || null,
      paymentId: insertTransaction.paymentId || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.transactions.set(transaction.transactionId, transaction);
    return transaction;
  }

  async getTransactionByMerchantReference(reference: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(t => t.merchantReference === reference);
  }

  async updateTransactionStatus(transactionId: string, status: string, errorCode?: number, errorMessage?: string): Promise<Transaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error("Transaction not found");
    const updated = { 
      ...transaction, 
      status, 
      errorCode: errorCode || null, 
      errorMessage: errorMessage || null, 
      updatedAt: new Date() 
    };
    this.transactions.set(transactionId, updated);
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
}

// Export storage instance - use DatabaseStorage if available, fallback to MemStorage
let storageInstance: IStorage;

try {
  // Check if database is available and configured
  if (isDatabaseAvailable()) {
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