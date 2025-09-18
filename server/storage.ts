import { type User, type InsertUser, type Investor, type InsertInvestor, type Payment, type InsertPayment } from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private investors: Map<string, Investor>;
  private payments: Map<string, Payment>;

  constructor() {
    this.users = new Map();
    this.investors = new Map();
    this.payments = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
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
    return Array.from(this.investors.values()).find(
      (investor) => investor.email === email,
    );
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
    if (!investor) {
      throw new Error("Investor not found");
    }
    
    const updatedInvestor = {
      ...investor,
      paymentStatus: status,
      stripePaymentIntentId: paymentIntentId || investor.stripePaymentIntentId,
      updatedAt: new Date(),
    };
    
    this.investors.set(id, updatedInvestor);
    return updatedInvestor;
  }

  async updateInvestorProgress(id: string, progress: any): Promise<Investor> {
    const investor = this.investors.get(id);
    if (!investor) {
      throw new Error("Investor not found");
    }
    
    const updatedInvestor = {
      ...investor,
      questProgress: progress,
      updatedAt: new Date(),
    };
    
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
      updatedAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentsByInvestor(investorId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.investorId === investorId
    );
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    const payment = this.payments.get(id);
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    const updatedPayment = {
      ...payment,
      status,
      updatedAt: new Date(),
    };
    
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
}

export const storage = new MemStorage();
