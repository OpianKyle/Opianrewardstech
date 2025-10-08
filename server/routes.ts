import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { insertInvestorSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { sendOtpEmail, testEmailConnection } from "./email";

// Adumo payment configuration using environment variables (required)
const ADUMO_CONFIG = {
  merchantId: process.env.ADUMO_MERCHANT_ID,
  jwtSecret: process.env.ADUMO_CLIENT_SECRET, // Use CLIENT_SECRET for JWT verification
  applicationId: process.env.ADUMO_APPLICATION_ID,
  // URLs - using staging for development, production when deployed
  apiUrl: process.env.ADUMO_BASE_URL || (process.env.NODE_ENV === "production" 
    ? "https://apiv3.adumoonline.com/product/payment/v1/initialisevirtual"
    : "https://staging-apiv3.adumoonline.com/product/payment/v1/initialisevirtual"),
  returnUrl: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000"}/payment-return`,
  notifyUrl: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000"}/api/payment-webhook`
};

// Validate required Adumo configuration
const validateAdumoConfig = () => {
  const required = ['merchantId', 'jwtSecret', 'applicationId'];
  const missing = required.filter(key => !ADUMO_CONFIG[key as keyof typeof ADUMO_CONFIG]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Adumo environment variables: ${missing.map(k => `ADUMO_${k.toUpperCase()}`).join(', ')}`);
  }
};

const createPaymentIntentSchema = z.object({
  amount: z.number().min(1),
  tier: z.string(),
  paymentMethod: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(4), // Last 4 digits of phone
});

// JWT configuration for investor authentication
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production environment");
}
const JWT_SECRET = process.env.JWT_SECRET || "opian-rewards-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token valid for 7 days

// Rate limiters for security
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per email
  message: "Too many OTP requests. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email when available, otherwise use IPv6-safe IP key
    const email = req.body?.email?.toLowerCase().trim();
    return email || ipKeyGenerator(req.ip || '127.0.0.1');
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per email
  message: "Too many verification attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email when available, otherwise use IPv6-safe IP key
    const email = req.body?.email?.toLowerCase().trim();
    return email || ipKeyGenerator(req.ip || '127.0.0.1');
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to generate cryptographically secure 6-digit OTP
function generateOtp(): string {
  const crypto = require('crypto');
  const code = crypto.randomInt(0, 1000000);
  return code.toString().padStart(6, '0');
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Test email connection on startup
  testEmailConnection().catch(err => console.error("Email test failed:", err));
  
  // Schedule periodic OTP cleanup (every hour)
  setInterval(async () => {
    try {
      await storage.cleanupExpiredOtps();
      console.log("🧹 Cleaned up expired OTPs");
    } catch (error) {
      console.error("Error cleaning up OTPs:", error);
    }
  }, 60 * 60 * 1000); // 1 hour
  
  // OTP-based authentication endpoints
  
  // Request OTP endpoint
  app.post("/api/auth/request-otp", otpRequestLimiter, async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      // Check if investor exists
      const investor = await storage.getInvestorByEmail(email);
      
      // SECURITY: Always return success to prevent email enumeration
      // Only send email if investor actually exists
      if (investor) {
        try {
          // Generate OTP
          const code = generateOtp();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          
          // Save OTP
          await storage.createOtp({
            email,
            code,
            expiresAt,
          });
          
          // Send email
          await sendOtpEmail(email, code, investor.firstName);
          console.log(`🔐 OTP sent to ${email}`);
        } catch (otpError) {
          // Log error but don't reveal to attacker
          console.error("OTP generation/send error:", otpError);
        }
      } else {
        // Log for monitoring but don't reveal to attacker
        console.log(`⚠️ OTP requested for non-existent email: ${email.substring(0, 3)}***`);
      }
      
      // SECURITY: Always return same response regardless of success or error
      res.json({ message: "If an account exists with this email, a verification code has been sent" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      // For unexpected errors, still return generic message to prevent enumeration
      console.error("OTP request unexpected error:", error);
      res.json({ message: "If an account exists with this email, a verification code has been sent" });
    }
  });
  
  // Verify OTP and login endpoint
  app.post("/api/auth/verify-otp", otpVerifyLimiter, async (req, res) => {
    try {
      const { email, code } = z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }).parse(req.body);
      
      // Find and validate OTP
      const otp = await storage.getValidOtp(email, code);
      if (!otp) {
        return res.status(401).json({ message: "Invalid or expired verification code" });
      }
      
      // Mark OTP as used
      await storage.markOtpAsUsed(otp.id);
      
      // Get investor
      const investor = await storage.getInvestorByEmail(email);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          investorId: investor.id, 
          email: investor.email,
          tier: investor.tier
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      console.log(`✅ OTP verified for ${email}`);
      
      res.json({
        token,
        investor: {
          id: investor.id,
          email: investor.email,
          firstName: investor.firstName,
          lastName: investor.lastName,
          tier: investor.tier,
          paymentStatus: investor.paymentStatus
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data" });
      } else {
        console.error("OTP verification error:", error);
        res.status(500).json({ message: "Verification failed" });
      }
    }
  });
  
  // Legacy authentication endpoint (DEPRECATED - use OTP authentication instead)
  // Disabled in production for security - weak authentication method
  
  // Login endpoint
  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    // SECURITY: Disable legacy weak authentication in production
    if (process.env.NODE_ENV === "production") {
      return res.status(410).json({ message: "This authentication method is no longer supported. Please use email verification." });
    }
    try {
      const { email, phone } = loginSchema.parse(req.body);
      
      // Find investor by email
      const investor = await storage.getInvestorByEmail(email);
      
      if (!investor) {
        return res.status(401).json({ message: "Invalid email or phone number" });
      }
      
      // Verify using last 4 digits of phone
      const last4Digits = investor.phone.slice(-4);
      if (phone !== last4Digits) {
        return res.status(401).json({ message: "Invalid email or phone number" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          investorId: investor.id, 
          email: investor.email,
          tier: investor.tier
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.json({
        token,
        investor: {
          id: investor.id,
          email: investor.email,
          firstName: investor.firstName,
          lastName: investor.lastName,
          tier: investor.tier,
          paymentStatus: investor.paymentStatus
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Login error: " + error.message });
      }
    }
  });
  
  // Verify token and get current investor
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const investor = await storage.getInvestor(decoded.investorId);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      res.json({
        id: investor.id,
        email: investor.email,
        firstName: investor.firstName,
        lastName: investor.lastName,
        phone: investor.phone,
        tier: investor.tier,
        paymentStatus: investor.paymentStatus,
        paymentMethod: investor.paymentMethod,
        amount: investor.amount,
        questProgress: investor.questProgress,
        createdAt: investor.createdAt
      });
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      }
      res.status(500).json({ message: "Authentication error: " + error.message });
    }
  });
  
  // Get investor transactions
  app.get("/api/investor/transactions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const payments = await storage.getPaymentsByInvestor(decoded.investorId);
      res.json(payments);
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      }
      res.status(500).json({ message: "Error fetching transactions: " + error.message });
    }
  });
  
  // Get investor invoices with payment schedule
  app.get("/api/investor/invoices", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const investor = await storage.getInvestor(decoded.investorId);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      const payments = await storage.getPaymentsByInvestor(decoded.investorId);
      
      // Calculate invoices based on payment method
      const invoices = [];
      const totalAmount = investor.amount;
      
      if (investor.paymentMethod === 'lump_sum') {
        // Single invoice for lump sum
        const paid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
        invoices.push({
          id: `${investor.id}-lump`,
          dueDate: investor.createdAt,
          amount: totalAmount,
          paid: paid,
          status: paid >= totalAmount ? 'paid' : 'outstanding',
          description: `${investor.tier.charAt(0).toUpperCase() + investor.tier.slice(1)} Tier - Lump Sum Payment`
        });
      } else {
        // Monthly installments
        const months = investor.paymentMethod === '12_months' ? 12 : 24;
        const monthlyAmount = Math.round(totalAmount / months);
        
        for (let i = 0; i < months; i++) {
          const dueDate = new Date(investor.createdAt || new Date());
          dueDate.setMonth(dueDate.getMonth() + i);
          
          // Check if this installment has been paid
          const installmentPayments = payments.filter(p => 
            p.status === 'completed' && 
            p.paymentData && 
            typeof p.paymentData === 'object' &&
            'installmentNumber' in p.paymentData &&
            p.paymentData.installmentNumber === i + 1
          );
          
          const paidAmount = installmentPayments.reduce((sum, p) => sum + p.amount, 0);
          const isPaid = paidAmount >= monthlyAmount;
          
          invoices.push({
            id: `${investor.id}-${i + 1}`,
            installmentNumber: i + 1,
            dueDate,
            amount: monthlyAmount,
            paid: paidAmount,
            status: isPaid ? 'paid' : dueDate < new Date() ? 'overdue' : 'outstanding',
            description: `${investor.tier.charAt(0).toUpperCase() + investor.tier.slice(1)} Tier - Installment ${i + 1} of ${months}`
          });
        }
      }
      
      res.json(invoices);
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      }
      res.status(500).json({ message: "Error fetching invoices: " + error.message });
    }
  });
  
  // Get detailed quest progress
  app.get("/api/investor/progress", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const investor = await storage.getInvestor(decoded.investorId);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      const payments = await storage.getPaymentsByInvestor(decoded.investorId);
      const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
      const totalAmount = investor.amount;
      
      // Calculate progress percentage
      const paymentProgress = Math.round((totalPaid / totalAmount) * 100);
      
      // Get quest progress or initialize default
      const questProgress: any = investor.questProgress || {
        level: 1,
        phase: "development",
        startDate: investor.createdAt,
        milestones: {
          capitalReclaimed: false,
          dividendPhase: false
        }
      };
      
      // Determine current phase based on payment completion
      let currentPhase = "development";
      let estimatedCompletion = null;
      
      if (paymentProgress >= 100) {
        currentPhase = "operational";
        // Estimate 18-24 months for capital reclaim after full payment
        estimatedCompletion = new Date(investor.createdAt || new Date());
        estimatedCompletion.setMonth(estimatedCompletion.getMonth() + 21);
      }
      
      res.json({
        investorTier: investor.tier,
        paymentProgress: {
          percentage: paymentProgress,
          amountPaid: totalPaid,
          totalAmount: totalAmount,
          remaining: totalAmount - totalPaid
        },
        questProgress: {
          level: questProgress.level || 1,
          phase: currentPhase,
          startDate: questProgress.startDate || investor.createdAt,
          milestones: {
            paymentComplete: paymentProgress >= 100,
            capitalReclaimed: questProgress.milestones?.capitalReclaimed || false,
            dividendPhase: questProgress.milestones?.dividendPhase || false
          },
          estimatedCompletion
        },
        timeline: [
          {
            phase: "Payment",
            status: paymentProgress >= 100 ? "completed" : "in_progress",
            completedDate: paymentProgress >= 100 ? new Date() : null
          },
          {
            phase: "Development",
            status: currentPhase === "operational" ? "completed" : paymentProgress >= 100 ? "in_progress" : "pending",
            completedDate: null
          },
          {
            phase: "Capital Reclaim",
            status: questProgress.milestones?.capitalReclaimed ? "completed" : "pending",
            completedDate: questProgress.milestones?.capitalReclaimed ? estimatedCompletion : null
          },
          {
            phase: "Dividend Distribution",
            status: questProgress.milestones?.dividendPhase ? "in_progress" : "pending",
            completedDate: null
          }
        ]
      });
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      }
      res.status(500).json({ message: "Error fetching progress: " + error.message });
    }
  });
  
  // Get tier pricing information
  app.get("/api/tiers", async (req, res) => {
    try {
      const tiers = {
        builder: {
          name: "The Builder",
          subtitle: "The Strategic Grind",
          icon: "hammer",
          pricing: {
            lump_sum: 12000,
            monthly_12: { amount: 1000, months: 12 },
            monthly_24: { amount: 500, months: 24 }
          },
          description: "Steady, consistent support for foundational growth. Perfect for the strategic grinder."
        },
        innovator: {
          name: "The Innovator", 
          subtitle: "The Balanced Champion",
          icon: "lightbulb",
          popular: true,
          pricing: {
            lump_sum: 24000,
            monthly_12: { amount: 2000, months: 12 },
            monthly_24: { amount: 1000, months: 24 }
          },
          description: "Optimal risk/reward ratio with maximum flexibility. The champion's choice."
        },
        visionary: {
          name: "The Visionary",
          subtitle: "Maximum Impact", 
          icon: "eye",
          pricing: {
            lump_sum: 36000,
            monthly_12: { amount: 3000, months: 12 },
            monthly_24: { amount: 1500, months: 24 }
          },
          description: "For those who go all-in on revolutionary change. Maximum impact, maximum rewards."
        }
      };
      
      res.json(tiers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching tier information: " + error.message });
    }
  });

  // Create investor registration
  app.post("/api/investors", async (req, res) => {
    try {
      const validatedData = insertInvestorSchema.parse(req.body);
      
      // Check if investor already exists
      const existingInvestor = await storage.getInvestorByEmail(validatedData.email);
      if (existingInvestor) {
        return res.status(400).json({ message: "Investor already registered with this email" });
      }

      const investor = await storage.createInvestor(validatedData);
      res.status(201).json(investor);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating investor: " + error.message });
      }
    }
  });

  // Get investor by email (DEPRECATED - use /api/auth/me instead)
  // SECURITY: Disabled in production to prevent PII exposure and account enumeration
  app.get("/api/investors/:email", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(410).json({ message: "This endpoint is no longer available. Please use authenticated endpoints." });
    }
    
    try {
      const { email } = req.params;
      const investor = await storage.getInvestorByEmail(email);
      
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      res.json(investor);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching investor: " + error.message });
    }
  });

  // Debug endpoint to check payments for an investor (DEVELOPMENT ONLY)
  // SECURITY: Disabled in production to prevent unauthorized data access
  app.get("/api/debug/payments/:investorId", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(410).json({ message: "Debug endpoints are not available in production" });
    }
    
    try {
      const { investorId } = req.params;
      const payments = await storage.getPaymentsByInvestor(investorId);
      
      console.log(`🔍 Debug: Found ${payments.length} payments for investor ${investorId}`);
      payments.forEach(payment => {
        console.log(`  Payment ${payment.id}: status=${payment.status}, amount=${payment.amount}, method=${payment.method}`);
      });
      
      res.json({
        investorId,
        paymentCount: payments.length,
        payments: payments
      });
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Error fetching payments: " + error.message });
    }
  });

  // Create Adumo payment (form data for Virtual integration)
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      // Validate Adumo configuration first
      validateAdumoConfig();
      
      const validatedData = createPaymentIntentSchema.parse(req.body);
      
      // Create or get investor
      let investor = await storage.getInvestorByEmail(validatedData.email);
      if (!investor) {
        investor = await storage.createInvestor({
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          tier: validatedData.tier,
          paymentMethod: validatedData.paymentMethod,
          amount: validatedData.amount,
        });
      }

      // Generate unique reference first
      const tempId = randomUUID().substring(0, 8);
      const reference = `OPIAN_${Date.now()}_${tempId}`;
      
      // Create payment record with reference stored in paymentData
      const payment = await storage.createPayment({
        investorId: investor.id,
        amount: validatedData.amount,
        method: "adumo",
        paymentData: {
          tier: validatedData.tier,
          paymentMethod: validatedData.paymentMethod,
          merchantReference: reference
        }
      });
      
      // Convert amount from cents to currency with 2 decimal places
      const currencyAmount = (validatedData.amount / 100).toFixed(2);

      // Generate JWT token for Adumo API authentication
      // Using Adumo's exact JWT payload structure
      const jwtPayload = {
        iss: "Opian Rewards",
        cuid: ADUMO_CONFIG.merchantId,
        auid: ADUMO_CONFIG.applicationId,
        amount: currencyAmount,
        mref: reference,
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 10) // 10 minutes expiry
      };
      
      const jwtToken = jwt.sign(jwtPayload, ADUMO_CONFIG.jwtSecret!);

      // Return form data for client-side form POST to Adumo Virtual
      // Using EXACT field names as per Adumo Virtual API documentation
      const formData = {
        MerchantID: ADUMO_CONFIG.merchantId,
        ApplicationID: ADUMO_CONFIG.applicationId,
        MerchantReference: reference,
        Amount: currencyAmount,
        Token: jwtToken, // Adumo uses "Token" not "JWT"
        txtCurrencyCode: "ZAR", // Adumo uses "txtCurrencyCode" not "CurrencyCode"
        RedirectSuccessfulURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}`,
        RedirectFailedURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}&status=failed`,
        // Optional customer details
        Variable1: validatedData.tier,
        Variable2: payment.id
      };

      // Log payment creation without sensitive data
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Payment intent created:', {
          paymentId: payment.id,
          investorId: investor.id,
          tier: validatedData.tier,
          amount: currencyAmount,
          reference: reference
        });
      }

      // Return form data for client-side POST
      res.json({ 
        formData: formData,
        url: ADUMO_CONFIG.apiUrl,
        paymentId: payment.id,
        investorId: investor.id,
        reference: reference
      });
    } catch (error: any) {
      console.error('❌ Payment creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating payment: " + error.message });
      }
    }
  });

  // Handle payment return from Adumo (both GET and POST)
  const handlePaymentReturn = async (req: any, res: any) => {
    try {
      console.log("🔄 Payment return received at", new Date().toISOString());
      console.log(`📝 Return method: ${req.method}`);
      console.log("📝 Return params:", req.method === 'GET' ? req.query : req.body);
      
      // Extract JWT token from request (Adumo sends _RESPONSE_TOKEN)
      const jwtToken = extractJwtToken(req);
      console.log("🔍 JWT token found:", jwtToken ? "YES" : "NO");
      
      let paymentStatus = "failed";
      let paymentRef = "";
      let transactionRef = "";
      
      if (jwtToken) {
        try {
          // Verify JWT token with signature validation and claim checks
          console.log("🔐 Verifying JWT token signature and claims...");
          const decoded = verifyAdumoJWT(jwtToken);
          
          // Extract validated fields from JWT
          const {
            result,           // Success/failure indicator (1 = success, -1 = failed, 0 = pending)
            mref,            // Merchant reference
            amount,          // Transaction amount
            transactionIndex, // Transaction reference
          } = decoded;
          
          paymentRef = mref;
          transactionRef = transactionIndex;
          
          console.log("🔍 JWT payment return processing:");
          console.log(`  Result: ${result} (${result === 1 ? "SUCCESS" : result === -1 ? "FAILED" : "PENDING"})`);
          console.log(`  Merchant Ref: ${mref}`);
          console.log(`  Amount: ${amount}`);
          
          // Map Adumo result codes: 1 = success, -1 = failed, 0 = pending
          const isSuccess = result === 1;
          paymentStatus = isSuccess ? "completed" : result === -1 ? "failed" : "pending";
          
          // Find payment by merchant reference
          if (mref && mref.startsWith('OPIAN_')) {
            console.log("✅ Updating payment status via JWT return...");
            const payment = await storage.getPaymentByMerchantReference(mref);
            
            if (payment) {
              // Create transaction record with comprehensive error handling
              console.log("📝 Attempting to create transaction record...");
              console.log(`📝 Payment ID: ${payment.id}, Merchant Ref: ${mref}`);
              
              try {
                let transaction = await storage.getTransactionByMerchantReference(mref);
                console.log(`📝 Existing transaction check: ${transaction ? 'FOUND' : 'NOT FOUND'}`);
                
                if (!transaction) {
                  const transactionData = {
                    transactionId: transactionIndex || randomUUID(),
                    merchantReference: mref,
                    status: result === 1 ? "AUTHORIZED" : result === -1 ? "DECLINED" : "PENDING",
                    amount: payment.amount,
                    currencyCode: "ZAR" as const,
                    paymentMethod: decoded.paymentMethod || "CARD",
                    puid: decoded.puid || null,
                    tkn: decoded.tkn || null,
                    token: jwtToken,
                    paymentId: payment.id,
                  };
                  
                  console.log(`📝 Transaction data prepared:`, JSON.stringify(transactionData, null, 2));
                  
                  transaction = await storage.createTransaction(transactionData);
                  console.log(`✅ Transaction ${transaction.transactionId} created SUCCESSFULLY`);
                  console.log(`✅ Transaction details:`, JSON.stringify(transaction, null, 2));
                } else {
                  console.log(`ℹ️ Transaction already exists: ${transaction.transactionId}`);
                }
              } catch (transactionError: any) {
                console.error(`❌ TRANSACTION CREATION FAILED:`, transactionError);
                console.error(`❌ Error message: ${transactionError.message}`);
                console.error(`❌ Error stack:`, transactionError.stack);
              }
              
              // Update payment status
              await storage.updatePaymentStatus(payment.id, paymentStatus);
              console.log(`💰 Payment ${payment.id} updated to: ${paymentStatus}`);
              
              // Update investor status if successful
              if (isSuccess) {
                console.log("👤 Updating investor status via JWT return...");
                const investor = await storage.updateInvestorPaymentStatus(
                  payment.investorId, 
                  "completed", 
                  transactionRef
                );
                
                // Initialize quest progress if not already initialized
                if (!investor.questProgress) {
                  console.log("🎮 Initializing quest progress via JWT return...");
                  const questProgress = {
                    level: 1,
                    phase: "development",
                    startDate: new Date().toISOString(),
                    milestones: {
                      capitalReclaimed: false,
                      dividendPhase: false
                    }
                  };
                  
                  await storage.updateInvestorProgress(payment.investorId, questProgress);
                  console.log("🎮 Quest progress initialized successfully via JWT return");
                }
              }
            } else {
              console.log("❌ Payment not found for merchant reference:", mref);
            }
          }
        } catch (jwtError: any) {
          console.error("❌ JWT validation error:", jwtError.message);
          paymentStatus = "error";
        }
      } else {
        console.log("⚠️ No JWT token found in return, checking for fallback parameters...");
        
        // Fallback to old-style parameters if no JWT token
        const { paymentId, reference, ResultCode, TransactionReference } = 
          req.method === 'GET' ? req.query : req.body;
        
        paymentRef = reference || TransactionReference || "";
        const resultCode = ResultCode;
        
        if (paymentId && paymentRef) {
          console.log("✅ Using fallback parameters to update payment status...");
          paymentStatus = resultCode === "00" ? "completed" : "failed";
          
          const payment = await storage.updatePaymentStatus(
            paymentId as string, 
            paymentStatus
          );
          console.log(`💰 Payment ${payment.id} updated to: ${payment.status}`);
          
          if (resultCode === "00") {
            await storage.updateInvestorPaymentStatus(
              payment.investorId, 
              "completed", 
              paymentRef as string
            );
          }
        }
      }

      // Redirect to frontend with payment result
      const status = paymentStatus === "completed" ? "success" : paymentStatus;
      console.log(`🔄 Redirecting to frontend with status: ${status}`);
      res.redirect(`/?payment=${status}&reference=${paymentRef}`);
    } catch (error: any) {
      console.error("❌ Payment return error:", error);
      res.redirect("/?payment=error");
    }
  };
  
  app.get("/payment-return", handlePaymentReturn);
  app.post("/payment-return", handlePaymentReturn);

  // Extract JWT token from various sources (case-insensitive)
  const extractJwtToken = (req: any): string | null => {
    // Check Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch) return bearerMatch[1];
    }

    // Check body fields (case-insensitive) - including _RESPONSE_TOKEN from Adumo
    const body = req.body || {};
    const bodyKeys = Object.keys(body);
    
    for (const key of bodyKeys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'token' || lowerKey === 'jwt' || lowerKey === '_response_token' || lowerKey === 'responsetoken') {
        return body[key];
      }
    }

    // Check query parameters - including _RESPONSE_TOKEN from Adumo
    const query = req.query || {};
    return query.token || query.jwt || query.Token || query.JWT || 
           query._RESPONSE_TOKEN || query._response_token || 
           query.RESPONSE_TOKEN || query.responseToken || null;
  };

  // Verify and validate Adumo JWT token
  const verifyAdumoJWT = (token: string): any => {
    if (!ADUMO_CONFIG.jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    // Verify JWT with signature validation
    const decoded = jwt.verify(token, ADUMO_CONFIG.jwtSecret, {
      algorithms: ['HS256'], // Only allow HS256 algorithm
      clockTolerance: 30, // Allow 30 seconds clock skew
    }) as any;

    // Validate required claims according to Adumo spec
    const requiredFields = ['cuid', 'auid', 'mref', 'amount', 'result'];
    const missingFields = requiredFields.filter(field => decoded[field] === undefined);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required JWT fields: ${missingFields.join(', ')}`);
    }

    // Validate merchant and application IDs match configuration
    if (decoded.cuid !== ADUMO_CONFIG.merchantId) {
      throw new Error(`JWT cuid mismatch: expected ${ADUMO_CONFIG.merchantId}, got ${decoded.cuid}`);
    }

    if (decoded.auid !== ADUMO_CONFIG.applicationId) {
      throw new Error(`JWT auid mismatch: expected ${ADUMO_CONFIG.applicationId}, got ${decoded.auid}`);
    }

    return decoded;
  };

  // Verify webhook signature (HMAC SHA-256)
  const verifyWebhookSignature = (req: any): boolean => {
    try {
      const crypto = require('crypto');
      const webhookSecret = process.env.ADUMO_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn('⚠️ ADUMO_WEBHOOK_SECRET not configured, skipping signature verification');
        return true; // Allow in development if not configured
      }

      // Get signature from headers (try common header names)
      const signature = req.headers['x-signature'] || 
                       req.headers['x-adumo-signature'] || 
                       req.headers['signature'];
      
      if (!signature) {
        console.error('❌ No signature header found in webhook request');
        return false;
      }

      // Get raw payload
      const payload = JSON.stringify(req.body);
      
      // Generate expected signature using HMAC SHA-256
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const expectedSignature = hmac.update(payload, 'utf8').digest('hex');
      
      // Remove 'sha256=' prefix if present
      const receivedSignature = signature.replace(/^sha256=/i, '');
      
      // Use timing-safe comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const receivedBuffer = Buffer.from(receivedSignature, 'hex');
      
      if (expectedBuffer.length !== receivedBuffer.length) {
        console.error('❌ Signature length mismatch');
        return false;
      }
      
      return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch (error) {
      console.error('❌ Error verifying webhook signature:', error);
      return false;
    }
  };

  // Process payment completion (webhook endpoint for Adumo)
  app.post("/api/payment-webhook", async (req, res) => {
    try {
      console.log("🔔 Adumo webhook received at", new Date().toISOString());
      
      // SECURITY: Verify webhook signature if configured
      if (process.env.ADUMO_WEBHOOK_SECRET && !verifyWebhookSignature(req)) {
        console.error("❌ Webhook signature verification failed");
        return res.status(401).json({ message: "Invalid signature" });
      }
      
      // Extract JWT token
      const jwtToken = extractJwtToken(req);
      console.log("🔍 JWT token found:", jwtToken ? "YES" : "NO");
      
      if (jwtToken) {
        // Verify JWT token with signature validation and claim checks
        console.log("🔐 Verifying JWT token signature and claims...");
        const decoded = verifyAdumoJWT(jwtToken);
        
        // Extract validated fields from JWT
        const {
          result,           // Success/failure indicator (1 = success, -1 = failed, 0 = pending)
          mref,            // Merchant reference
          amount,          // Transaction amount
          transactionIndex, // Transaction reference
          puid,            // Payment UID
          tkn,             // Tokenization token for card-on-file
        } = decoded;
        
        // Only log minimal, non-sensitive information in production
        if (process.env.NODE_ENV === 'development') {
          console.log("🔍 JWT webhook processing:");
          console.log(`  Result: ${result} (${result === 1 ? "SUCCESS" : result === -1 ? "FAILED" : "PENDING"})`);
          console.log(`  Merchant Ref: ${mref}`);
          console.log(`  Amount: ${amount}`);
        }
        
        // Process payment using merchant reference
        if (mref && mref.startsWith('OPIAN_')) {
          console.log(`🔍 Processing payment with reference: ${mref.substring(0, 20)}...`);
          
          // Find payment by merchant reference
          const payment = await storage.getPaymentByMerchantReference(mref);
          
          if (!payment) {
            console.log("❌ Payment not found for merchant reference");
            return res.status(404).json({ message: "Payment not found" });
          }

          // SECURITY: Check for replay attacks - prevent duplicate processing
          if (payment.status === "completed") {
            console.warn(`⚠️ REPLAY ATTACK DETECTED: Payment ${payment.id} already completed, ignoring webhook`);
            return res.json({ success: true, message: "Payment already processed" });
          }

          // Map Adumo result codes: 1 = success, -1 = failed, 0 = pending
          const isSuccess = result === 1;
          const paymentStatus = isSuccess ? "completed" : result === -1 ? "failed" : "pending";
          
          // SECURITY: Validate amount matches to prevent amount manipulation
          const expectedAmountCents = payment.amount;
          const receivedAmountCents = Math.round(parseFloat(amount) * 100); // Convert to cents
          
          if (expectedAmountCents !== receivedAmountCents) {
            console.error(`❌ AMOUNT MISMATCH: Expected ${expectedAmountCents} cents, received ${receivedAmountCents} cents`);
            return res.status(400).json({ message: "Amount validation failed" });
          }
          
          console.log("✅ Security checks passed, updating payment status...");
          console.log(`💰 Payment status: ${payment.status} → ${paymentStatus}`);
          
          // Create or update transaction record
          let transaction = await storage.getTransactionByMerchantReference(mref);
          if (!transaction) {
            // Create new transaction record
            transaction = await storage.createTransaction({
              transactionId: transactionIndex || randomUUID(),
              merchantReference: mref,
              status: result === 1 ? "AUTHORIZED" : result === -1 ? "DECLINED" : "PENDING",
              amount: expectedAmountCents,
              currencyCode: "ZAR",
              paymentMethod: decoded.paymentMethod || "CARD",
              puid: puid || null,
              tkn: tkn || null,
              token: jwtToken,
              paymentId: payment.id,
            });
          } else if (transaction.status !== "AUTHORIZED" && isSuccess) {
            // Update existing transaction
            await storage.updateTransactionStatus(
              transaction.transactionId,
              "AUTHORIZED"
            );
          }
          
          // Update payment status
          const updatedPayment = await storage.updatePaymentStatus(
            payment.id,
            paymentStatus
          );
          
          // Update investor payment status
          console.log("👤 Updating investor status...");
          const investor = await storage.updateInvestorPaymentStatus(
            payment.investorId,
            paymentStatus,
            transactionIndex
          );
          console.log(`🎯 Investor payment status: ${investor.paymentStatus}`);

          // If payment successful, initialize quest progress (only once)
          if (isSuccess && !investor.questProgress) {
            console.log("🎮 Initializing quest progress...");
            const questProgress = {
              level: 1,
              phase: "development", 
              startDate: new Date().toISOString(),
              milestones: {
                capitalReclaimed: false,
                dividendPhase: false
              }
            };
            
            await storage.updateInvestorProgress(investor.id, questProgress);
            console.log("🎮 Quest progress initialized");
          }
        } else {
          console.log("❌ Invalid merchant reference format");
          return res.status(400).json({ message: "Invalid merchant reference" });
        }
        
      } else {
        // Fallback to direct JSON payload format (Adumo V2 webhook format)
        console.log("🔄 No JWT token found, trying direct JSON payload format...");
        
        const { 
          merchantReference,
          transactionId,
          status,
          amount,
          puid,
          tkn,
          paymentMethod,
          ResultCode, 
          CustomField2,
          CustomField3
        } = req.body;
        
        // Try Adumo V2 webhook format first (from documentation)
        if (merchantReference && status) {
          console.log("✅ Processing Adumo V2 webhook format...");
          console.log(`  Merchant Reference: ${merchantReference}`);
          console.log(`  Status: ${status}`);
          console.log(`  Transaction ID: ${transactionId}`);
          
          // Find payment by merchant reference
          const payment = await storage.getPaymentByMerchantReference(merchantReference);
          
          if (!payment) {
            console.log("❌ Payment not found for merchant reference");
            return res.status(404).json({ message: "Payment not found" });
          }
          
          // SECURITY: Check for replay attacks
          if (payment.status === "completed") {
            console.warn(`⚠️ REPLAY ATTACK DETECTED: Payment already completed`);
            return res.json({ success: true, message: "Payment already processed" });
          }
          
          // Map Adumo status to our payment status
          // SETTLED, AUTHORIZED = completed, DECLINED/FAILED = failed
          const isSuccess = status === "SETTLED" || status === "AUTHORIZED" || status === "APPROVED";
          const paymentStatus = isSuccess ? "completed" : status === "DECLINED" || status === "FAILED" ? "failed" : "pending";
          
          console.log(`💰 Updating payment status to: ${paymentStatus}`);
          
          // Create transaction record
          let transaction = await storage.getTransactionByMerchantReference(merchantReference);
          if (!transaction && transactionId) {
            transaction = await storage.createTransaction({
              transactionId: transactionId,
              merchantReference: merchantReference,
              status: status,
              amount: payment.amount,
              currencyCode: "ZAR",
              paymentMethod: paymentMethod || "CARD",
              puid: puid || null,
              tkn: tkn || null,
              token: null,
              paymentId: payment.id,
            });
          }
          
          // Update payment status
          const updatedPayment = await storage.updatePaymentStatus(payment.id, paymentStatus);
          const investor = await storage.updateInvestorPaymentStatus(
            payment.investorId,
            paymentStatus,
            transactionId || merchantReference
          );
          
          // Initialize quest progress if successful
          if (isSuccess && !investor.questProgress) {
            const questProgress = {
              level: 1,
              phase: "development",
              startDate: new Date().toISOString(),
              milestones: { capitalReclaimed: false, dividendPhase: false }
            };
            await storage.updateInvestorProgress(investor.id, questProgress);
          }
        } 
        // Try legacy format (older integration)
        else if (CustomField2 && CustomField3) {
          console.log("✅ Processing legacy webhook format...");
          
          const payment = await storage.getPaymentByMerchantReference(CustomField2);
          if (payment && payment.status === "completed") {
            console.warn(`⚠️ REPLAY ATTACK DETECTED (legacy): Payment already completed`);
            return res.json({ success: true, message: "Payment already processed" });
          }
          
          const paymentStatus = ResultCode === "00" ? "completed" : "failed";
          const updatedPayment = await storage.updatePaymentStatus(CustomField2, paymentStatus);
          const investor = await storage.updateInvestorPaymentStatus(
            CustomField3,
            paymentStatus,
            req.body.TransactionReference
          );

          if (ResultCode === "00" && !investor.questProgress) {
            const questProgress = {
              level: 1,
              phase: "development",
              startDate: new Date().toISOString(),
              milestones: { capitalReclaimed: false, dividendPhase: false }
            };
            await storage.updateInvestorProgress(investor.id, questProgress);
          }
        } else {
          console.log("❌ Missing required fields in webhook payload");
          console.log("Received payload keys:", Object.keys(req.body));
          return res.status(400).json({ message: "Missing required fields" });
        }
      }

      console.log("✅ Webhook processed successfully");
      res.json({ success: true });
    } catch (error: any) {
      console.error("❌ Payment webhook error:", error.message);
      
      // Return appropriate error status based on error type
      if (error.message.includes('JWT') || error.message.includes('signature')) {
        res.status(401).json({ message: "Invalid authentication" });
      } else {
        res.status(500).json({ message: "Webhook processing error" });
      }
    }
  });

  // Get quest progression for investor
  app.get("/api/quest-progress/:investorId", async (req, res) => {
    try {
      const { investorId } = req.params;
      const investor = await storage.getInvestor(investorId);
      
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Calculate quest statistics based on tier and payment date
      const questStats = {
        totalInvested: investor.amount,
        totalCollected: investor.tier === "innovator" ? 132000 : 
                       investor.tier === "builder" ? 66000 : 198000,
        returnOnBelief: investor.tier === "innovator" ? 450 :
                       investor.tier === "builder" ? 450 : 450,
        progress: investor.questProgress || {},
        tier: investor.tier,
        paymentStatus: investor.paymentStatus
      };

      res.json(questStats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching quest progress: " + error.message });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message, tier } = req.body;
      
      // In production, this would send an email via SendGrid or similar service
      console.log("Contact form submission:", { name, email, message, tier });
      
      res.json({ success: true, message: "Contact form submitted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error submitting contact form: " + error.message });
    }
  });

  // Manual payment verification endpoint (for when Adumo webhooks fail)
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { merchantReference, transactionReference, status } = req.body;
      
      console.log("🔍 Manual payment verification requested:");
      console.log(`  Merchant Reference: ${merchantReference}`);
      console.log(`  Transaction Reference: ${transactionReference}`);
      console.log(`  Status: ${status}`);
      
      if (!merchantReference) {
        return res.status(400).json({ message: "Merchant reference is required" });
      }
      
      // Find payment by merchant reference
      const payment = await storage.getPaymentByMerchantReference(merchantReference);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found with that reference" });
      }
      
      // Prevent re-processing completed payments
      if (payment.status === "completed") {
        console.log("⚠️ Payment already completed, skipping update");
        return res.json({ 
          success: true, 
          message: "Payment already completed",
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.amount
          }
        });
      }
      
      // Determine payment status (default to completed if status is "authorised" or "completed")
      const paymentStatus = (status && (status.toLowerCase() === "authorised" || status.toLowerCase() === "completed")) 
        ? "completed" 
        : status === "failed" ? "failed" : "pending";
      
      console.log(`✅ Updating payment ${payment.id} from ${payment.status} to ${paymentStatus}`);
      
      // Create transaction record if it doesn't exist with comprehensive error handling
      console.log("📝 Attempting to create transaction record via manual verification...");
      console.log(`📝 Payment ID: ${payment.id}, Merchant Ref: ${merchantReference}`);
      
      try {
        let transaction = await storage.getTransactionByMerchantReference(merchantReference);
        console.log(`📝 Existing transaction check: ${transaction ? 'FOUND' : 'NOT FOUND'}`);
        
        if (!transaction) {
          const transactionData = {
            transactionId: transactionReference || randomUUID(),
            merchantReference: merchantReference,
            status: paymentStatus === "completed" ? "AUTHORIZED" : paymentStatus === "failed" ? "DECLINED" : "PENDING",
            amount: payment.amount,
            currencyCode: "ZAR" as const,
            paymentMethod: "CARD",
            puid: null,
            tkn: null,
            token: null,
            paymentId: payment.id,
          };
          
          console.log(`📝 Transaction data prepared:`, JSON.stringify(transactionData, null, 2));
          
          transaction = await storage.createTransaction(transactionData);
          console.log(`✅ Transaction ${transaction.transactionId} created SUCCESSFULLY via manual verification`);
          console.log(`✅ Transaction details:`, JSON.stringify(transaction, null, 2));
        } else {
          console.log(`ℹ️ Transaction already exists: ${transaction.transactionId}`);
        }
      } catch (transactionError: any) {
        console.error(`❌ TRANSACTION CREATION FAILED (manual verification):`, transactionError);
        console.error(`❌ Error message: ${transactionError.message}`);
        console.error(`❌ Error stack:`, transactionError.stack);
      }
      
      // Update payment status
      const updatedPayment = await storage.updatePaymentStatus(payment.id, paymentStatus);
      
      // If payment successful, update investor status and initialize quest
      if (paymentStatus === "completed") {
        console.log("👤 Updating investor status to completed...");
        const investor = await storage.updateInvestorPaymentStatus(
          payment.investorId,
          "completed",
          transactionReference || merchantReference
        );
        
        // Initialize quest progress if not already done
        if (!investor.questProgress) {
          console.log("🎮 Initializing quest progress...");
          const questProgress = {
            level: 1,
            phase: "development",
            startDate: new Date().toISOString(),
            milestones: {
              capitalReclaimed: false,
              dividendPhase: false
            }
          };
          
          await storage.updateInvestorProgress(investor.id, questProgress);
          console.log("🎮 Quest progress initialized successfully");
        }
        
        console.log("✅ Payment verification completed successfully");
        
        return res.json({
          success: true,
          message: "Payment verified and status updated to completed",
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            amount: updatedPayment.amount,
            investorId: updatedPayment.investorId
          },
          investor: {
            id: investor.id,
            email: investor.email,
            paymentStatus: investor.paymentStatus
          }
        });
      } else {
        return res.json({
          success: true,
          message: `Payment status updated to ${paymentStatus}`,
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            amount: updatedPayment.amount
          }
        });
      }
    } catch (error: any) {
      console.error("❌ Payment verification error:", error);
      res.status(500).json({ message: "Error verifying payment: " + error.message });
    }
  });

  // Debug endpoint to check database tables
  app.get("/api/debug/tables", async (req: Request, res: Response) => {
    try {
      const connection = await (pool as any).getConnection();
      const [tables] = await connection.execute('SHOW TABLES');
      const [txnStructure] = await connection.execute('DESCRIBE transactions');
      connection.release();
      
      res.json({ 
        tables, 
        transactionStructure: txnStructure 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Migration endpoint to update transactions table to new schema
  app.post("/api/debug/migrate-transactions", async (req: Request, res: Response) => {
    try {
      const connection = await (pool as any).getConnection();
      
      // Drop old transactions table
      await connection.execute('DROP TABLE IF EXISTS transactions');
      
      // Create new transactions table with updated schema
      await connection.execute(`
        CREATE TABLE transactions (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          invoice_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          merchant_reference VARCHAR(255) NOT NULL UNIQUE,
          adumo_transaction_id VARCHAR(255) UNIQUE,
          adumo_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
          payment_method VARCHAR(50),
          gateway ENUM('ADUMO', 'STRIPE', 'OTHER') NOT NULL DEFAULT 'ADUMO',
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
          request_payload TEXT,
          response_payload TEXT,
          notify_url_response TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      
      connection.release();
      
      res.json({ 
        success: true,
        message: "Transactions table migrated to new schema successfully"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Adumo Webhook Endpoint - receives payment status updates
  app.post("/api/adumo/webhook", async (req: Request, res: Response) => {
    try {
      console.log("🔔 Adumo webhook notification received:", new Date().toISOString());
      console.log("📦 Webhook payload:", JSON.stringify(req.body, null, 2));

      const webhookData = req.body;
      
      // Extract key fields from Adumo notification
      // Based on the user's example, Adumo sends these fields
      const merchantReference = webhookData.merchantReference || webhookData._MERCHANTREFERENCE;
      const transactionId = webhookData.transactionIndex || webhookData._TRANSACTIONINDEX;
      const status = webhookData.status || webhookData._STATUS;
      const amount = webhookData.amount || webhookData._AMOUNT || webhookData.TXTPRICE;
      const paymentMethod = webhookData.paymentMethod || webhookData._PAYMETHOD;

      if (!merchantReference) {
        console.error("❌ Missing merchant reference in webhook");
        return res.status(400).json({ error: "Missing merchant reference" });
      }

      console.log(`🔍 Processing payment: ${merchantReference}`);
      console.log(`   Transaction ID: ${transactionId}`);
      console.log(`   Status: ${status}`);
      console.log(`   Amount: ${amount}`);

      // Find the transaction by merchant reference
      let transaction = await storage.getTransactionByMerchantReference(merchantReference);

      if (!transaction) {
        console.error(`❌ Transaction not found for reference: ${merchantReference}`);
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Map Adumo status to our status enum
      let adumoStatus: "PENDING" | "SUCCESS" | "FAILED" | "CANCELED" | "REFUNDED" = "PENDING";
      
      if (status === "AUTHORISED" || status === "AUTHORIZED" || status === "SUCCESS") {
        adumoStatus = "SUCCESS";
      } else if (status === "DECLINED" || status === "FAILED" || status === "ERROR") {
        adumoStatus = "FAILED";
      } else if (status === "CANCELED" || status === "CANCELLED") {
        adumoStatus = "CANCELED";
      } else if (status === "REFUNDED") {
        adumoStatus = "REFUNDED";
      }

      console.log(`🔄 Updating transaction status from ${transaction.adumoStatus} to ${adumoStatus}`);

      // Update transaction with notify URL response
      const updatedTransaction = await storage.updateTransaction(transaction.id, {
        adumoTransactionId: transactionId || transaction.adumoTransactionId,
        adumoStatus,
        paymentMethod: paymentMethod || transaction.paymentMethod,
        notifyUrlResponse: JSON.stringify(webhookData),
      });

      console.log(`✅ Transaction updated successfully: ${updatedTransaction.id}`);

      // Update invoice status if payment succeeded
      if (adumoStatus === "SUCCESS") {
        await storage.updateInvoiceStatus(transaction.invoiceId, "paid");
        console.log(`💰 Invoice ${transaction.invoiceId} marked as paid`);
      } else if (adumoStatus === "FAILED") {
        await storage.updateInvoiceStatus(transaction.invoiceId, "failed");
        console.log(`❌ Invoice ${transaction.invoiceId} marked as failed`);
      }

      // Return success response to Adumo
      res.json({ 
        success: true, 
        message: "Webhook processed successfully",
        transactionId: transaction.id,
        status: adumoStatus
      });

    } catch (error: any) {
      console.error("❌ Error processing Adumo webhook:", error);
      res.status(500).json({ 
        error: "Webhook processing failed", 
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
