import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { randomUUID, randomInt } from "crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { sendOtpEmail, testEmailConnection } from "./email";

// Adumo payment configuration using environment variables (required)
const ADUMO_CONFIG = {
  merchantId: process.env.ADUMO_MERCHANT_ID,
  jwtSecret: process.env.ADUMO_CLIENT_SECRET, // Use CLIENT_SECRET for JWT verification
  applicationId: process.env.ADUMO_APPLICATION_ID,
  // OAuth credentials for subscription API
  oauthClientId: process.env.ADUMO_CLIENT_ID,
  oauthClientSecret: process.env.ADUMO_CLIENT_SECRET,
  // URLs - using staging for development, production when deployed
  apiUrl: process.env.ADUMO_BASE_URL || (process.env.NODE_ENV === "production" 
    ? "https://apiv3.adumoonline.com/product/payment/v1/initialisevirtual"
    : "https://staging-apiv3.adumoonline.com/product/payment/v1/initialisevirtual"),
  subscriptionApiUrl: process.env.NODE_ENV === "production"
    ? "https://apiv3.adumoonline.com/product/subscription/v1/api"
    : "https://staging-apiv3.adumoonline.com/product/subscription/v1/api",
  returnUrl: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000"}/payment-return`,
  notifyUrl: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000"}/api/payment-webhook`,
  subscriptionWebhookUrl: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000"}/api/subscription-webhook`
};

// Validate required Adumo configuration
const validateAdumoConfig = () => {
  const required = ['merchantId', 'jwtSecret', 'applicationId'];
  const missing = required.filter(key => !ADUMO_CONFIG[key as keyof typeof ADUMO_CONFIG]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Adumo environment variables: ${missing.map(k => `ADUMO_${k.toUpperCase()}`).join(', ')}`);
  }
};

// Adumo Subscription API Helper Functions
async function getAdumoOAuthToken(): Promise<string> {
  const oauthUrl = process.env.NODE_ENV === "production"
    ? "https://apiv3.adumoonline.com/oauth/token"
    : "https://staging-apiv3.adumoonline.com/oauth/token";

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: ADUMO_CONFIG.oauthClientId!,
    client_secret: ADUMO_CONFIG.oauthClientSecret!,
  });

  // Debug logging (remove in production)
  console.log("🔐 OAuth Request Details:", {
    url: oauthUrl,
    clientIdProvided: !!ADUMO_CONFIG.oauthClientId,
    clientIdLength: ADUMO_CONFIG.oauthClientId?.length,
    clientSecretProvided: !!ADUMO_CONFIG.oauthClientSecret,
    clientSecretLength: ADUMO_CONFIG.oauthClientSecret?.length
  });

  // Try sending credentials in request body (common OAuth 2.0 format)
  const response = await fetch(oauthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ OAuth token request failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url: oauthUrl,
      clientIdFirstChars: ADUMO_CONFIG.oauthClientId?.substring(0, 8) + '...',
    });
    throw new Error(`OAuth token request failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log("✅ OAuth token obtained successfully");
  return data.access_token;
}

async function createAdumoSubscriptionWithToken(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  cardToken: string; // Token from tokenization
  profileToken: string; // Profile token from tokenization
  monthlyAmount: number; // in cents
  totalMonths: number;
  startDate: Date;
  collectionDay?: string;
}): Promise<{ subscriberId: string; scheduleId: string; profileToken: string }> {
  const token = await getAdumoOAuthToken();
  
  const transactionUid = randomUUID();
  const merchantReference = `SUB_${Date.now()}_${randomUUID().substring(0, 8)}`;
  const endDate = new Date(params.startDate);
  endDate.setMonth(endDate.getMonth() + params.totalMonths);

  // Generate numeric-only account number (10 digits)
  const accountNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();

  // Create subscriber with tokenized card (as per Adumo API docs - Step 4)
  const subscriptionUrl = `${ADUMO_CONFIG.subscriptionApiUrl}/subscriber/${transactionUid}`;
  
  const subscriberResponse = await fetch(subscriptionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      applicationUid: ADUMO_CONFIG.applicationId,
      tokenUid: params.cardToken,
      transactionUid: transactionUid,
      subscriberDetails: {
        frequency: "MONTH",
        collectionDay: params.collectionDay || "1",
        accountNumber: accountNumber,
        merchantReference: merchantReference,
        startDate: params.startDate.toISOString(),
        endDate: endDate.toISOString(),
        collectionValue: params.monthlyAmount / 100,
        contactNumber: params.phone,
        mobileNumber: params.phone,
        shouldSendSms: true,
        shouldSendEmail: true,
        email: params.email,
      },
    }),
  });

  if (!subscriberResponse.ok) {
    const error = await subscriberResponse.text();
    throw new Error(`Failed to create subscription with token: ${error}`);
  }

  const subscriberData = await subscriberResponse.json();
  const subscriberId = subscriberData.subscriberUid || transactionUid;
  
  // The subscriber endpoint returns schedule details in the response
  // If not, create schedule separately (Adumo may require separate schedule creation)
  let scheduleId = subscriberData.scheduleUid;
  
  if (!scheduleId) {
    // Create payment schedule
    const scheduleResponse = await fetch(`${ADUMO_CONFIG.subscriptionApiUrl}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscriberUid: subscriberId,
        amount: (params.monthlyAmount / 100).toFixed(2),
        currencyCode: "ZAR",
        frequency: "MONTHLY",
        startDate: params.startDate.toISOString().split('T')[0],
        numberOfPayments: params.totalMonths,
        description: "Opian Rewards Monthly Subscription",
      }),
    });

    if (!scheduleResponse.ok) {
      const error = await scheduleResponse.text();
      throw new Error(`Failed to create payment schedule: ${error}`);
    }

    const scheduleData = await scheduleResponse.json();
    scheduleId = scheduleData.scheduleUid;
  }
  
  return {
    subscriberId,
    scheduleId: scheduleId || merchantReference,
    profileToken: params.profileToken,
  };
}

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

// JWT configuration for user authentication
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
  const code = randomInt(0, 1000000);
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
      const user = await storage.getUserByEmail(email);
      
      // SECURITY: Always return success to prevent email enumeration
      // Only send email if investor actually exists
      if (user) {
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
          await sendOtpEmail(email, code, user.firstName || undefined);
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
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          tier: user.tier
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      console.log(`✅ OTP verified for ${email}`);
      
      res.json({
        token,
        investor: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tier: user.tier,
          paymentStatus: user.paymentStatus
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
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or phone number" });
      }
      
      // Verify using last 4 digits of phone
      const last4Digits = user.phone?.slice(-4) || '';
      if (phone !== last4Digits) {
        return res.status(401).json({ message: "Invalid email or phone number" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          tier: user.tier
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.json({
        token,
        investor: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tier: user.tier,
          paymentStatus: user.paymentStatus
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
      
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        tier: user.tier,
        paymentStatus: user.paymentStatus,
        paymentMethod: user.paymentMethod,
        amount: user.amount,
        questProgress: user.questProgress,
        createdAt: user.createdAt
      });
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      }
      res.status(500).json({ message: "Authentication error: " + error.message });
    }
  });
  
  // Get investor transactions
  app.get("/api/user/transactions", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const payments = await storage.getPaymentsByUser(decoded.userId);
      res.json(payments);
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      }
      res.status(500).json({ message: "Error fetching transactions: " + error.message });
    }
  });
  
  // Get investor invoices with payment schedule
  app.get("/api/user/invoices", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      const payments = await storage.getPaymentsByUser(decoded.userId);
      
      // Calculate invoices based on payment method
      const invoices = [];
      const totalAmount = user.amount || 0;
      
      if (user.paymentMethod === 'lump_sum') {
        // Single invoice for lump sum
        const paid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
        invoices.push({
          id: `${user.id}-lump`,
          dueDate: user.createdAt,
          amount: totalAmount,
          paid: paid,
          status: paid >= totalAmount ? 'paid' : 'outstanding',
          description: `${(user.tier || 'unknown').charAt(0).toUpperCase() + (user.tier || 'unknown').slice(1)} Tier - Lump Sum Payment`
        });
      } else {
        // Monthly installments
        const months = user.paymentMethod === '12_months' ? 12 : 24;
        const monthlyAmount = Math.round(totalAmount / months);
        
        for (let i = 0; i < months; i++) {
          const dueDate = new Date(user.createdAt || new Date());
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
            id: `${user.id}-${i + 1}`,
            installmentNumber: i + 1,
            dueDate,
            amount: monthlyAmount,
            paid: paidAmount,
            status: isPaid ? 'paid' : dueDate < new Date() ? 'overdue' : 'outstanding',
            description: `${(user.tier || 'unknown').charAt(0).toUpperCase() + (user.tier || 'unknown').slice(1)} Tier - Installment ${i + 1} of ${months}`
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
  app.get("/api/user/progress", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      const payments = await storage.getPaymentsByUser(decoded.userId);
      const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
      const totalAmount = user.amount || 0;
      
      // Calculate progress percentage
      const paymentProgress = Math.round((totalPaid / totalAmount) * 100);
      
      // Get quest progress or initialize default
      const questProgress: any = user.questProgress || {
        level: 1,
        phase: "development",
        startDate: user.createdAt,
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
        estimatedCompletion = new Date(user.createdAt || new Date());
        estimatedCompletion.setMonth(estimatedCompletion.getMonth() + 21);
      }
      
      res.json({
        investorTier: user.tier,
        paymentProgress: {
          percentage: paymentProgress,
          amountPaid: totalPaid,
          totalAmount: totalAmount,
          remaining: totalAmount - totalPaid
        },
        questProgress: {
          level: questProgress.level || 1,
          phase: currentPhase,
          startDate: questProgress.startDate || user.createdAt,
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
          subtitle: "Early Believer",
          icon: "hammer",
          pricing: {
            lump_sum: 12000,
            deposit: 6000,
            monthly_12: { amount: 500, months: 12 }
          },
          description: "Perfect for early believers who want to participate in our growth journey with a manageable monthly commitment."
        },
        innovator: {
          name: "The Innovator", 
          subtitle: "Meaningful Stake",
          icon: "lightbulb",
          popular: true,
          pricing: {
            lump_sum: 24000,
            deposit: 12000,
            monthly_12: { amount: 1000, months: 12 }
          },
          description: "Ideal for partners who see the significant potential and want a meaningful stake in our success story."
        },
        visionary: {
          name: "The Visionary",
          subtitle: "Maximum Returns", 
          icon: "eye",
          pricing: {
            lump_sum: 36000,
            deposit: 18000,
            monthly_12: { amount: 1500, months: 12 }
          },
          description: "For those who fully embrace our vision and want to maximize their partnership returns."
        },
        cornerstone: {
          name: "The Cornerstone",
          subtitle: "Special Deal",
          icon: "crown",
          pricing: {
            lump_sum: 36000,
            deposit: null,
            monthly_12: null
          },
          description: "Equivalent to any amount over R36000, paid upfront for partners who prefer immediate full commitment and a special deal."
        }
      };
      
      res.json(tiers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching tier information: " + error.message });
    }
  });

  // Step 2.1 - Create profile and card token (Adumo Tokenization)
  app.post("/api/adumo/tokenize-card", async (req, res) => {
    try {
      const tokenizeSchema = z.object({
        cardNumber: z.string().min(13).max(19),
        cardholderName: z.string().min(1),
        expiryMonth: z.string().length(2),
        expiryYear: z.string().length(2),
        cvv: z.string().min(3).max(4),
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      });

      const cardData = tokenizeSchema.parse(req.body);

      // Step 1: Get OAuth token
      const token = await getAdumoOAuthToken();

      // Step 2: Create profile and card token
      const tokenizationUrl = process.env.NODE_ENV === "production"
        ? `https://apiv3.adumoonline.com/product/security/tokenization/v1/${ADUMO_CONFIG.applicationId}/profile`
        : `https://staging-apiv3.adumoonline.com/product/security/tokenization/v1/${ADUMO_CONFIG.applicationId}/profile`;

      const tokenResponse = await fetch(tokenizationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardNumber: cardData.cardNumber,
          cardholderName: cardData.cardholderName,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          cvv: cardData.cvv,
          email: cardData.email,
          firstName: cardData.firstName,
          lastName: cardData.lastName,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ Tokenization failed:", errorText);
        return res.status(tokenResponse.status).json({ 
          message: "Card tokenization failed", 
          error: errorText 
        });
      }

      const tokenData = await tokenResponse.json();
      
      console.log("✅ Card tokenized successfully");

      res.json({
        success: true,
        profileToken: tokenData.profileToken,
        cardToken: tokenData.cardToken,
        message: "Card tokenized successfully",
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("❌ Tokenization error:", error);
      res.status(500).json({ message: "Tokenization failed: " + error.message });
    }
  });

  // Step 2.2 - Create subscription with tokenized card (using proper Adumo flow)
  app.post("/api/adumo/create-subscription", async (req, res) => {
    try {
      const subscriptionSchema = z.object({
        tokenUid: z.string(), // Card token from Step 2.1
        profileUid: z.string(), // Profile token from Step 2.1
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().min(1),
        monthlyAmount: z.number().min(1), // in cents
        totalMonths: z.number().min(1).max(24),
        tier: z.string(),
      });

      const subData = subscriptionSchema.parse(req.body);

      // Create subscription with tokenized card
      const startDate = new Date();
      const { subscriberId, scheduleId, profileToken } = await createAdumoSubscriptionWithToken({
        email: subData.email,
        firstName: subData.firstName,
        lastName: subData.lastName,
        phone: subData.phone,
        cardToken: subData.tokenUid,
        profileToken: subData.profileUid,
        monthlyAmount: subData.monthlyAmount,
        totalMonths: subData.totalMonths,
        startDate,
      });

      console.log("✅ Subscription created with schedule");

      // Create or update user with subscription details
      let user = await storage.getUserByEmail(subData.email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email: subData.email,
          firstName: subData.firstName,
          lastName: subData.lastName,
          phone: subData.phone,
          tier: subData.tier,
          paymentMethod: `${subData.totalMonths}_months`,
          amount: subData.monthlyAmount * subData.totalMonths,
        });
      }

      // Store subscription in database
      await storage.createSubscription({
        userId: user.id,
        tier: subData.tier,
        monthlyAmount: (subData.monthlyAmount / 100).toString(),
        totalMonths: subData.totalMonths,
        adumoSubscriberId: subscriberId,
        adumoScheduleId: scheduleId,
      });

      // Store payment method token  
      await storage.createPaymentMethod({
        userId: user.id,
        puid: profileToken,
        cardType: "CARD",
        lastFourDigits: "****", // We don't have this from tokenization
      });

      res.json({
        success: true,
        subscriptionId: subscriberId,
        scheduleId: scheduleId,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
        },
        message: "Subscription created successfully",
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("❌ Subscription creation error:", error);
      res.status(500).json({ message: "Subscription creation failed: " + error.message });
    }
  });

  // Step 2.3 - Create subscription from completed payment (for deposit + monthly flow)
  app.post("/api/adumo/create-subscription-from-payment", async (req, res) => {
    try {
      const schema = z.object({
        paymentId: z.string(),
        reference: z.string(),
        tokenUid: z.string(),
        profileUid: z.string(),
      });

      const data = schema.parse(req.body);

      // Get payment to extract subscription details
      const payment = await storage.getPaymentByMerchantReference(data.reference);
      
      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          message: "Payment not found" 
        });
      }

      // Verify payment is completed
      if (payment.status !== "completed") {
        return res.status(400).json({ 
          success: false, 
          message: "Payment must be completed before creating subscription" 
        });
      }

      const paymentData = payment.paymentData as any;
      
      // Verify this is a deposit payment with subscription details
      if (!paymentData?.isDeposit || !paymentData?.monthlyAmount) {
        return res.status(400).json({ 
          success: false, 
          message: "Payment is not a deposit payment with subscription" 
        });
      }

      // Get user details
      const userDetails = paymentData.userDetails;
      if (!userDetails) {
        return res.status(400).json({ 
          success: false, 
          message: "User details not found in payment" 
        });
      }

      console.log("🔄 Creating subscription from payment...");
      console.log(`   Payment ID: ${payment.id}`);
      console.log(`   Monthly Amount: R${(paymentData.monthlyAmount / 100).toFixed(2)}`);
      console.log(`   Total Months: ${paymentData.totalMonths || 12}`);

      // Create subscription with tokenized card
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + 1); // Start next month
      
      const { subscriberId, scheduleId, profileToken } = await createAdumoSubscriptionWithToken({
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        phone: userDetails.phone,
        cardToken: data.tokenUid,
        profileToken: data.profileUid,
        monthlyAmount: paymentData.monthlyAmount,
        totalMonths: paymentData.totalMonths || 12,
        startDate,
        collectionDay: "7"
      });

      console.log("✅ Subscription created successfully via Adumo API");

      // Get user
      const user = await storage.getUserByEmail(userDetails.email);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Store subscription in database
      const subscription = await storage.createSubscription({
        userId: user.id,
        tier: paymentData.tier,
        monthlyAmount: (paymentData.monthlyAmount / 100).toString(),
        totalMonths: paymentData.totalMonths || 12,
        adumoSubscriberId: subscriberId,
        adumoScheduleId: scheduleId,
      });

      // Store payment method token
      await storage.createPaymentMethod({
        userId: user.id,
        puid: profileToken,
        cardType: "CARD",
        lastFourDigits: "****",
      });

      console.log(`✅ Subscription ${subscription.id} stored in database`);

      res.json({
        success: true,
        subscriberId,
        scheduleId,
        subscriptionId: subscription.id,
        message: "Subscription created successfully from payment"
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("❌ Subscription creation from payment error:", error);
      res.status(500).json({ 
        success: false,
        message: "Subscription creation failed: " + error.message 
      });
    }
  });

  // Complete user registration with card tokenization and subscription (Step 1, 2.1, 2.2 combined)
  app.post("/api/register-with-subscription", async (req, res) => {
    try {
      const registrationSchema = z.object({
        // User details
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().min(1),
        tier: z.string(),
        paymentMethod: z.string(),
        // Card details for tokenization
        cardNumber: z.string().min(13).max(19),
        cardholderName: z.string().min(1),
        expiryMonth: z.string().length(2),
        expiryYear: z.string().length(2),
        cvv: z.string().min(3).max(4),
        // Subscription details
        monthlyAmount: z.number().min(1),
        totalMonths: z.number().min(1).max(24),
        collectionDay: z.string().default("1"),
      });

      const regData = registrationSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(regData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already registered with this email" });
      }

      console.log("🔐 Step 1: Getting OAuth token...");
      const token = await getAdumoOAuthToken();

      console.log("💳 Step 2.1: Tokenizing card...");
      // Tokenize card
      const tokenizationUrl = process.env.NODE_ENV === "production"
        ? `https://apiv3.adumoonline.com/product/security/tokenization/v1/${ADUMO_CONFIG.applicationId}/profile`
        : `https://staging-apiv3.adumoonline.com/product/security/tokenization/v1/${ADUMO_CONFIG.applicationId}/profile`;

      const tokenResponse = await fetch(tokenizationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardNumber: regData.cardNumber,
          cardholderName: regData.cardholderName,
          expiryMonth: regData.expiryMonth,
          expiryYear: regData.expiryYear,
          cvv: regData.cvv,
          email: regData.email,
          firstName: regData.firstName,
          lastName: regData.lastName,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ Tokenization failed:", errorText);
        return res.status(tokenResponse.status).json({ 
          message: "Card tokenization failed", 
          error: errorText 
        });
      }

      const tokenData = await tokenResponse.json();
      console.log("✅ Card tokenized successfully");

      console.log("📅 Step 2.2: Creating subscription with tokenized card...");
      // Create subscription with tokenized card
      const startDate = new Date();
      const { subscriberId, scheduleId, profileToken } = await createAdumoSubscriptionWithToken({
        email: regData.email,
        firstName: regData.firstName,
        lastName: regData.lastName,
        phone: regData.phone,
        cardToken: tokenData.cardToken,
        profileToken: tokenData.profileToken,
        monthlyAmount: regData.monthlyAmount,
        totalMonths: regData.totalMonths,
        startDate,
        collectionDay: regData.collectionDay,
      });
      console.log("✅ Subscription and schedule created successfully");

      console.log("👤 Creating user record...");
      // Create user
      const user = await storage.createUser({
        email: regData.email,
        firstName: regData.firstName,
        lastName: regData.lastName,
        phone: regData.phone,
        tier: regData.tier,
        paymentMethod: regData.paymentMethod,
        amount: regData.monthlyAmount * regData.totalMonths,
      });

      // Store subscription in database
      await storage.createSubscription({
        userId: user.id,
        tier: regData.tier,
        monthlyAmount: (regData.monthlyAmount / 100).toString(),
        totalMonths: regData.totalMonths,
        adumoSubscriberId: subscriberId,
        adumoScheduleId: scheduleId,
      });

      // Store payment method token
      await storage.createPaymentMethod({
        userId: user.id,
        puid: profileToken,
        cardType: "CARD",
        lastFourDigits: regData.cardNumber.slice(-4),
      });

      console.log("✅ Registration complete!");

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tier: user.tier,
        },
        subscription: {
          subscriberId: subscriberId,
          scheduleId: scheduleId,
        },
        message: "Registration and subscription created successfully",
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("❌ Registration error:", error);
      res.status(500).json({ message: "Registration failed: " + error.message });
    }
  });

  // Create user registration (simplified - for non-subscription flow)
  app.post("/api/investors", async (req, res) => {
    try {
      const validatedData = z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        phone: z.string(),
        tier: z.string(),
        paymentMethod: z.string(),
        amount: z.number()
      }).parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already registered with this email" });
      }

      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating user: " + error.message });
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
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "Investor not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching investor: " + error.message });
    }
  });

  // Debug endpoint to check payments for a user (DEVELOPMENT ONLY)
  // SECURITY: Disabled in production to prevent unauthorized data access
  app.get("/api/debug/payments/:userId", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(410).json({ message: "Debug endpoints are not available in production" });
    }
    
    try {
      const { userId } = req.params;
      const payments = await storage.getPaymentsByUser(userId);
      
      console.log(`🔍 Debug: Found ${payments.length} payments for user ${userId}`);
      payments.forEach(payment => {
        console.log(`  Payment ${payment.id}: status=${payment.status}, amount=${payment.amount}, method=${payment.method}`);
      });
      
      res.json({
        userId,
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
      
      // Create or get user first
      let user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        user = await storage.createUser({
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
        });
      }
      
      // Calculate deposit amount and monthly payment for deposit_monthly method
      let finalAmount = validatedData.amount;
      let monthlyAmount = 0;
      
      if (validatedData.paymentMethod === "deposit_monthly") {
        // Deposit calculation based on tier
        const depositAmounts: Record<string, number> = {
          builder: 600000,    // R6,000 deposit
          innovator: 1200000, // R12,000 deposit
          visionary: 1800000, // R18,000 deposit
        };
        
        // Monthly payment calculation based on tier
        const monthlyAmounts: Record<string, number> = {
          builder: 50000,    // R500/month
          innovator: 100000, // R1,000/month
          visionary: 150000, // R1,500/month
        };
        
        finalAmount = depositAmounts[validatedData.tier] || validatedData.amount;
        monthlyAmount = monthlyAmounts[validatedData.tier] || 0;
      }

      // Generate unique reference first
      const tempId = randomUUID().substring(0, 8);
      const reference = `OPIAN_${Date.now()}_${tempId}`;
      
      // Create payment record with reference and subscription info stored in paymentData
      const paymentDataToStore: any = {
        userId: user.id,
        tier: validatedData.tier,
        paymentMethod: validatedData.paymentMethod,
        merchantReference: reference
      };
      
      // Add subscription details if using deposit_monthly method
      if (validatedData.paymentMethod === "deposit_monthly" && monthlyAmount > 0) {
        paymentDataToStore.isDeposit = true;
        paymentDataToStore.monthlyAmount = monthlyAmount;
        paymentDataToStore.totalMonths = 12;
        paymentDataToStore.userDetails = {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
        };
      }
      
      console.log("🔍 Creating payment with data:", JSON.stringify({
        userId: user.id,
        amount: finalAmount,
        method: "adumo",
        paymentData: paymentDataToStore
      }, null, 2));
      
      const payment = await storage.createPayment({
        userId: user.id,
        amount: finalAmount,
        method: "adumo",
        paymentData: paymentDataToStore
      });
      
      console.log("✅ Payment created:", JSON.stringify(payment, null, 2));
      
      // Convert amount from cents to currency with 2 decimal places
      const currencyAmount = (finalAmount / 100).toFixed(2);

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
      const formData: any = {
        puid: randomUUID(), // Unique payment/transaction ID
        MerchantID: ADUMO_CONFIG.merchantId,
        ApplicationID: ADUMO_CONFIG.applicationId,
        MerchantReference: reference,
        Amount: currencyAmount,
        Token: jwtToken, // Adumo uses "Token" not "JWT"
        txtCurrencyCode: "ZAR", // Adumo uses "txtCurrencyCode" not "CurrencyCode"
        RedirectSuccessfulURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}`,
        RedirectFailedURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}&status=failed`,
        
        // Additional variables for merchant use
        Variable1: validatedData.tier,
        Variable2: payment.id,
        
        // First item details
        Qty1: "1",
        ItemRef1: `${validatedData.tier.toUpperCase()}_TIER`,
        ItemDescr1: `Opian ${validatedData.tier.charAt(0).toUpperCase() + validatedData.tier.slice(1)} Tier`,
        ItemAmount1: currencyAmount,
        
        // Shipping details
        ShippingCost: "0.00",
        Discount: "0.00",
        
        // Client shipping/contact details
        Recipient: `${validatedData.firstName} ${validatedData.lastName}`,
        ShippingAddress1: "",
        ShippingAddress2: "",
        ShippingAddress3: "",
        ShippingAddress4: "",
        ShippingAddress5: "South Africa"
      };
      
      // Add recurring payment fields if using deposit_monthly method
      if (validatedData.paymentMethod === "deposit_monthly" && monthlyAmount > 0) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 1); // Start next month
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 12); // 12 months duration
        
        formData.frequency = "MONTHLY";
        formData.collectionDay = "7"; // 7th day of the month
        formData.accountNumber = `ACC_${user.id}`;
        formData.startDate = startDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        formData.endDate = endDate.toISOString().split('T')[0];
        formData.collectionValue = (monthlyAmount / 100).toFixed(2); // Monthly amount in currency
        formData.contactNumber = validatedData.phone || "";
        formData.mobileNumber = validatedData.phone || "";
        formData.emailAddress = validatedData.email;
        formData.shouldSendSms = "false";
        formData.shouldSendEmail = "true";
      }

      // Log payment creation without sensitive data
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Payment intent created:', {
          paymentId: payment.id,
          userId: user.id,
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
        userId: user.id,
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
            status,           // Actual status from Adumo: AUTHORISED, DECLINED, etc.
            mref,            // Merchant reference
            amount,          // Transaction amount
            transactionIndex, // Transaction reference
          } = decoded;
          
          paymentRef = mref;
          transactionRef = transactionIndex;
          
          console.log("🔍 JWT payment return processing:");
          console.log(`  Result: ${result} (${result === 0 ? "SUCCESS" : result === -1 ? "FAILED" : result === 1 ? "SUCCESS WITH WARNING" : "UNKNOWN"})`);
          console.log(`  Status: ${status}`);
          console.log(`  Merchant Ref: ${mref}`);
          console.log(`  Amount: ${amount}`);
          
          // Use the status field for accurate payment status determination
          // AUTHORISED/SETTLED means the payment was successful
          // Result codes: 0 = Success, -1 = Failure, 1 = Success with warning
          const isSuccess = status === "AUTHORISED" || status === "SETTLED" || result === 0 || result === 1;
          paymentStatus = isSuccess ? "completed" : 
                         (status === "DECLINED" || status === "FAILED" || result === -1) ? "failed" : "pending";
          
          // Find payment by merchant reference
          if (mref && mref.startsWith('OPIAN_')) {
            console.log("✅ Updating payment status via JWT return...");
            const payment = await storage.getPaymentByMerchantReference(mref);
            
            if (payment) {
              // Debug: Log the entire payment object
              console.log("🔍 Payment object retrieved:", JSON.stringify(payment, null, 2));
              console.log("🔍 Payment data field:", JSON.stringify(payment.paymentData, null, 2));
              
              // Get userId from payment data
              const userId = (payment.paymentData as any)?.userId;
              
              if (!userId) {
                console.error("❌ No userId found in payment data");
                console.error("❌ paymentData type:", typeof payment.paymentData);
                console.error("❌ paymentData value:", payment.paymentData);
              } else {
                // Create or get invoice first
                console.log("📝 Creating invoice before transaction...");
                let invoice;
                try {
                  // Check if invoice already exists for this payment
                  const existingTransaction = await storage.getTransactionByMerchantReference(mref);
                  if (existingTransaction?.invoiceId) {
                    console.log(`📝 Using existing invoice: ${existingTransaction.invoiceId}`);
                    invoice = { id: existingTransaction.invoiceId };
                  } else {
                    // Create new invoice
                    const amountInCurrency = (payment.amount / 100).toFixed(2);
                    invoice = await storage.createInvoice({
                      userId: userId,
                      amount: amountInCurrency,
                      status: isSuccess ? "paid" : "pending",
                      description: `Payment for ${(payment.paymentData as any)?.tier} tier - ${(payment.paymentData as any)?.paymentMethod}`,
                    });
                    console.log(`✅ Invoice ${invoice.id} created successfully`);
                  }
                } catch (invoiceError: any) {
                  console.error(`❌ Invoice creation failed:`, invoiceError.message);
                  invoice = null;
                }

                // Create transaction record with comprehensive error handling
                if (invoice) {
                  console.log("📝 Attempting to create transaction record...");
                  console.log(`📝 Payment ID: ${payment.id}, Merchant Ref: ${mref}`);
                  
                  try {
                    let transaction = await storage.getTransactionByMerchantReference(mref);
                    console.log(`📝 Existing transaction check: ${transaction ? 'FOUND' : 'NOT FOUND'}`);
                    
                    if (!transaction) {
                      // Determine Adumo status based on the status field and result code
                      // Result codes: 0 = Success, -1 = Failure, 1 = Success with warning
                      let adumoStatus: "SUCCESS" | "FAILED" | "PENDING" | "CANCELED" | "REFUNDED";
                      if (status === "AUTHORISED" || status === "SETTLED" || result === 0 || result === 1) {
                        adumoStatus = "SUCCESS";
                      } else if (status === "DECLINED" || status === "FAILED" || result === -1) {
                        adumoStatus = "FAILED";
                      } else if (status === "CANCELED") {
                        adumoStatus = "CANCELED";
                      } else if (status === "REFUNDED") {
                        adumoStatus = "REFUNDED";
                      } else {
                        adumoStatus = "PENDING";
                      }
                      
                      const transactionData = {
                        invoiceId: invoice.id,
                        userId: userId,
                        merchantReference: mref,
                        adumoTransactionId: transactionIndex || null,
                        adumoStatus: adumoStatus,
                        paymentMethod: decoded.paymentMethod || "CARD",
                        gateway: "ADUMO" as const,
                        amount: (payment.amount / 100).toFixed(2),
                        currency: "ZAR" as const,
                        requestPayload: JSON.stringify(payment.paymentData), // Store original payment data
                        responsePayload: JSON.stringify(decoded), // Store decoded JWT
                        notifyUrlResponse: JSON.stringify(req.method === 'GET' ? req.query : req.body), // Store raw Adumo response
                      };
                      
                      console.log(`📝 Transaction data prepared:`, JSON.stringify(transactionData, null, 2));
                      
                      transaction = await storage.createTransaction(transactionData);
                      console.log(`✅ Transaction ${transaction.id} created SUCCESSFULLY`);
                      console.log(`✅ Transaction details:`, JSON.stringify(transaction, null, 2));
                    } else {
                      console.log(`ℹ️ Transaction already exists: ${transaction.id}`);
                    }
                  } catch (transactionError: any) {
                    console.error(`❌ TRANSACTION CREATION FAILED:`, transactionError);
                    console.error(`❌ Error message: ${transactionError.message}`);
                    console.error(`❌ Error stack:`, transactionError.stack);
                  }
                }
              }
              
              // Update payment status
              await storage.updatePaymentStatus(payment.id, paymentStatus);
              console.log(`💰 Payment ${payment.id} updated to: ${paymentStatus}`);
              
              // Update investor status if successful
              if (isSuccess) {
                console.log("👤 Updating investor status via JWT return...");
                const user = await storage.updateUserPaymentStatus(
                  payment.userId, 
                  "completed", 
                  transactionRef
                );
                
                // Extract and update investment details from payment data
                if (payment.paymentData && typeof payment.paymentData === 'object') {
                  const paymentData = payment.paymentData as any;
                  const investmentDetails: any = {};
                  
                  if (paymentData.tier) {
                    investmentDetails.tier = paymentData.tier;
                  }
                  if (paymentData.paymentMethod) {
                    investmentDetails.paymentMethod = paymentData.paymentMethod;
                  }
                  
                  // Note: Subscription creation for deposit payments now handled via /api/register-with-subscription endpoint
                  // which includes card tokenization. This webhook path is for payment verification only.
                  if (paymentData.isDeposit && paymentData.monthlyAmount) {
                    console.log("ℹ️ Deposit payment detected - subscription should be created via registration endpoint");
                  }
                  if (payment.amount) {
                    investmentDetails.amount = payment.amount;
                  }
                  
                  if (Object.keys(investmentDetails).length > 0) {
                    console.log("💼 Updating investment details:", investmentDetails);
                    await storage.updateUserInvestmentDetails(payment.userId, investmentDetails);
                    console.log("✅ Investment details updated successfully");
                  }
                }
                
                // Initialize quest progress if not already initialized
                if (!user.questProgress) {
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
                  
                  await storage.updateUserProgress(payment.userId, questProgress);
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
            await storage.updateUserPaymentStatus(
              payment.userId, 
              "completed", 
              paymentRef as string
            );
            
            // Extract and update investment details from payment data
            if (payment.paymentData && typeof payment.paymentData === 'object') {
              const paymentData = payment.paymentData as any;
              const investmentDetails: any = {};
              
              if (paymentData.tier) {
                investmentDetails.tier = paymentData.tier;
              }
              if (paymentData.paymentMethod) {
                investmentDetails.paymentMethod = paymentData.paymentMethod;
              }
              if (payment.amount) {
                investmentDetails.amount = payment.amount;
              }
              
              if (Object.keys(investmentDetails).length > 0) {
                console.log("💼 Updating investment details (fallback):", investmentDetails);
                await storage.updateUserInvestmentDetails(payment.userId, investmentDetails);
                console.log("✅ Investment details updated successfully (fallback)");
              }
            }
          }
        }
      }

      // Redirect to frontend with payment result
      const status = paymentStatus === "completed" ? "success" : paymentStatus;
      console.log(`🔄 Redirecting to frontend with status: ${status}`);
      
      // Check if this is a deposit payment that needs subscription setup
      let isDepositPayment = false;
      let tier = "";
      let monthlyAmount = "";
      
      if (paymentRef && paymentRef.startsWith('OPIAN_')) {
        const payment = await storage.getPaymentByMerchantReference(paymentRef);
        if (payment?.paymentData) {
          const paymentData = payment.paymentData as any;
          if (paymentData.isDeposit && paymentData.monthlyAmount) {
            isDepositPayment = true;
            tier = paymentData.tier || "builder";
            monthlyAmount = ((paymentData.monthlyAmount / 100).toFixed(0)) || "500";
          }
        }
      }
      
      // Redirect based on payment type and status
      if (status === "success") {
        if (isDepositPayment) {
          // Redirect to subscription setup for deposit payments
          console.log(`🔄 Deposit payment successful - redirecting to subscription setup`);
          res.redirect(`/subscription-setup?paymentId=${paymentRef}&reference=${paymentRef}&tier=${tier}&monthlyAmount=${monthlyAmount}`);
        } else {
          // Redirect to login page for regular payments
          res.redirect(`/login?payment=${status}&reference=${paymentRef}`);
        }
      } else {
        res.redirect(`/?payment=${status}&reference=${paymentRef}`);
      }
    } catch (error: any) {
      console.error("❌ Payment return error:", error);
      res.redirect("/login?payment=error");
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
          status,           // Actual status from Adumo: AUTHORISED, DECLINED, etc.
          mref,            // Merchant reference
          amount,          // Transaction amount
          transactionIndex, // Transaction reference
          puid,            // Payment UID
          tkn,             // Tokenization token for card-on-file
        } = decoded;
        
        // Only log minimal, non-sensitive information in production
        if (process.env.NODE_ENV === 'development') {
          console.log("🔍 JWT webhook processing:");
          console.log(`  Result: ${result} (${result === 0 ? "SUCCESS" : result === -1 ? "FAILED" : result === 1 ? "SUCCESS WITH WARNING" : "UNKNOWN"})`);
          console.log(`  Status: ${status}`);
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

          // Use the status field for accurate payment status determination
          // AUTHORISED/SETTLED means the payment was successful
          // Result codes: 0 = Success, -1 = Failure, 1 = Success with warning
          const isSuccess = status === "AUTHORISED" || status === "SETTLED" || result === 0 || result === 1;
          const paymentStatus = isSuccess ? "completed" : 
                               (status === "DECLINED" || status === "FAILED" || result === -1) ? "failed" : "pending";
          
          // SECURITY: Validate amount matches to prevent amount manipulation
          const expectedAmountCents = payment.amount;
          const receivedAmountCents = Math.round(parseFloat(amount) * 100); // Convert to cents
          
          if (expectedAmountCents !== receivedAmountCents) {
            console.error(`❌ AMOUNT MISMATCH: Expected ${expectedAmountCents} cents, received ${receivedAmountCents} cents`);
            return res.status(400).json({ message: "Amount validation failed" });
          }
          
          console.log("✅ Security checks passed, updating payment status...");
          console.log(`💰 Payment status: ${payment.status} → ${paymentStatus}`);
          
          // Get userId from payment data
          const userId = (payment.paymentData as any)?.userId;
          
          if (!userId) {
            console.error("❌ No userId found in payment data for webhook");
          } else {
            // Create or get invoice first
            let invoice;
            let transaction = await storage.getTransactionByMerchantReference(mref);
            
            if (transaction?.invoiceId) {
              console.log(`📝 Webhook: Using existing invoice: ${transaction.invoiceId}`);
              invoice = { id: transaction.invoiceId };
            } else {
              // Create new invoice
              const amountInCurrency = (expectedAmountCents / 100).toFixed(2);
              invoice = await storage.createInvoice({
                userId: userId,
                amount: amountInCurrency,
                status: isSuccess ? "paid" : "pending",
                description: `Payment for ${(payment.paymentData as any)?.tier} tier - ${(payment.paymentData as any)?.paymentMethod}`,
              });
              console.log(`✅ Webhook: Invoice ${invoice.id} created successfully`);
            }
            
            // Create or update transaction record
            if (!transaction) {
              // Determine Adumo status based on the status field and result code
              // Result codes: 0 = Success, -1 = Failure, 1 = Success with warning
              let adumoStatus: "SUCCESS" | "FAILED" | "PENDING" | "CANCELED" | "REFUNDED";
              if (status === "AUTHORISED" || status === "SETTLED" || result === 0 || result === 1) {
                adumoStatus = "SUCCESS";
              } else if (status === "DECLINED" || status === "FAILED" || result === -1) {
                adumoStatus = "FAILED";
              } else if (status === "CANCELED") {
                adumoStatus = "CANCELED";
              } else if (status === "REFUNDED") {
                adumoStatus = "REFUNDED";
              } else {
                adumoStatus = "PENDING";
              }
              
              // Create new transaction record
              transaction = await storage.createTransaction({
                invoiceId: invoice.id,
                userId: userId,
                merchantReference: mref,
                adumoTransactionId: transactionIndex || null,
                adumoStatus: adumoStatus,
                paymentMethod: decoded.paymentMethod || "CARD",
                gateway: "ADUMO" as const,
                amount: (expectedAmountCents / 100).toFixed(2),
                currency: "ZAR" as const,
                requestPayload: JSON.stringify(payment.paymentData), // Store original payment data
                responsePayload: JSON.stringify(decoded), // Store decoded JWT
                notifyUrlResponse: JSON.stringify(req.body), // Store raw webhook body
              });
              console.log(`✅ Webhook: Transaction ${transaction.id} created`);
            } else if (transaction.adumoStatus !== "SUCCESS" && isSuccess) {
              // Update existing transaction status if needed
              console.log(`📝 Webhook: Updating existing transaction status`);
            }
          }
          
          // Update payment status
          const updatedPayment = await storage.updatePaymentStatus(
            payment.id,
            paymentStatus
          );
          
          // Update investor payment status
          console.log("👤 Updating investor status...");
          const user = await storage.updateUserPaymentStatus(
            payment.userId,
            paymentStatus,
            transactionIndex
          );
          console.log(`🎯 Investor payment status: ${user.paymentStatus}`);

          // If payment successful, update investment details and initialize quest progress
          if (isSuccess) {
            // Extract and update investment details from payment data
            if (payment.paymentData && typeof payment.paymentData === 'object') {
              const paymentData = payment.paymentData as any;
              const investmentDetails: any = {};
              
              if (paymentData.tier) {
                investmentDetails.tier = paymentData.tier;
              }
              if (paymentData.paymentMethod) {
                investmentDetails.paymentMethod = paymentData.paymentMethod;
              }
              if (payment.amount) {
                investmentDetails.amount = payment.amount;
              }
              
              if (Object.keys(investmentDetails).length > 0) {
                console.log("💼 Updating investment details (webhook):", investmentDetails);
                await storage.updateUserInvestmentDetails(payment.userId, investmentDetails);
                console.log("✅ Investment details updated successfully (webhook)");
              }
              
              // Check if this is a deposit payment that requires subscription creation
              if (paymentData.isDeposit && paymentData.monthlyAmount) {
                console.log("🔔 DEPOSIT PAYMENT DETECTED - Subscription creation required");
                console.log(`   Monthly Amount: R${(paymentData.monthlyAmount / 100).toFixed(2)}`);
                console.log(`   Total Months: ${paymentData.totalMonths || 12}`);
                console.log(`   Card Token Available: ${tkn ? "YES" : "NO"}`);
                console.log(`   Payment UID: ${puid || "N/A"}`);
                
                // TODO: Implement subscription creation
                // Currently, subscriptions are only created via /api/register-with-subscription
                // which includes card tokenization. The virtual payment form does not return
                // the card token needed for subscription creation.
                //
                // To create subscriptions from regular payments, we need to:
                // 1. Redirect user to card tokenization after successful payment, OR
                // 2. Change the payment flow to tokenize card before payment
                
                if (tkn) {
                  console.log("⚠️  Card token received but subscription creation not implemented yet");
                  // Could call createAdumoSubscriptionWithToken here if we have all required data
                } else {
                  console.log("⚠️  No card token - cannot create subscription via Adumo API");
                  console.log("💡 User will need to complete subscription setup separately");
                }
              }
            }
            
            // Initialize quest progress (only once)
            if (!user.questProgress) {
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
              
              await storage.updateUserProgress(user.id, questProgress);
              console.log("🎮 Quest progress initialized");
            }
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
              userId: payment.userId,
              invoiceId: payment.id,
              merchantReference: merchantReference,
              amount: payment.amount.toString(),
              adumoTransactionId: transactionId || null,
              adumoStatus: isSuccess ? "SUCCESS" : status === "DECLINED" || status === "FAILED" ? "FAILED" : "PENDING",
              paymentMethod: paymentMethod || "CARD",
            });
          }
          
          // Update payment status
          const updatedPayment = await storage.updatePaymentStatus(payment.id, paymentStatus);
          const user = await storage.updateUserPaymentStatus(
            payment.userId,
            paymentStatus,
            transactionId || merchantReference
          );
          
          // Initialize quest progress if successful
          if (isSuccess && !user.questProgress) {
            const questProgress = {
              level: 1,
              phase: "development",
              startDate: new Date().toISOString(),
              milestones: { capitalReclaimed: false, dividendPhase: false }
            };
            await storage.updateUserProgress(user.id, questProgress);
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
          const user = await storage.updateUserPaymentStatus(
            CustomField3,
            paymentStatus,
            req.body.TransactionReference
          );

          if (ResultCode === "00" && !user.questProgress) {
            const questProgress = {
              level: 1,
              phase: "development",
              startDate: new Date().toISOString(),
              milestones: { capitalReclaimed: false, dividendPhase: false }
            };
            await storage.updateUserProgress(user.id, questProgress);
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
  app.get("/api/quest-progress/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Calculate quest statistics based on tier and payment date
      const questStats = {
        totalInvested: user.amount,
        totalCollected: user.tier === "innovator" ? 132000 : 
                       user.tier === "builder" ? 66000 : 198000,
        returnOnBelief: user.tier === "innovator" ? 450 :
                       user.tier === "builder" ? 450 : 450,
        progress: user.questProgress || {},
        tier: user.tier,
        paymentStatus: user.paymentStatus
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
            userId: payment.userId,
            invoiceId: payment.id,
            merchantReference: merchantReference,
            amount: payment.amount.toString(),
            adumoTransactionId: transactionReference || null,
            adumoStatus: (paymentStatus === "completed" ? "SUCCESS" : paymentStatus === "failed" ? "FAILED" : "PENDING") as "PENDING" | "SUCCESS" | "FAILED" | "CANCELED" | "REFUNDED",
            paymentMethod: "CARD",
          };
          
          console.log(`📝 Transaction data prepared:`, JSON.stringify(transactionData, null, 2));
          
          transaction = await storage.createTransaction(transactionData);
          console.log(`✅ Transaction ${transaction.adumoTransactionId} created SUCCESSFULLY via manual verification`);
          console.log(`✅ Transaction details:`, JSON.stringify(transaction, null, 2));
        } else {
          console.log(`ℹ️ Transaction already exists: ${transaction.adumoTransactionId}`);
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
        const user = await storage.updateUserPaymentStatus(
          payment.userId,
          "completed",
          transactionReference || merchantReference
        );
        
        // Initialize quest progress if not already done
        if (!user.questProgress) {
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
          
          await storage.updateUserProgress(user.id, questProgress);
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
            userId: updatedPayment.userId
          },
          investor: {
            id: user.id,
            email: user.email,
            paymentStatus: user.paymentStatus
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
  app.get("/api/debug/tables", async (req, res) => {
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
  app.post("/api/debug/migrate-transactions", async (req, res) => {
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
  app.post("/api/adumo/webhook", async (req, res) => {
    try {
      console.log("🔔 Adumo webhook notification received:", new Date().toISOString());
      console.log("📦 Webhook payload:", JSON.stringify(req.body, null, 2));

      const webhookData = req.body || {};
      
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

  // Subscription Webhook Endpoint - receives subscription payment notifications from Adumo
  app.post("/api/subscription-webhook", async (req, res) => {
    try {
      console.log("🔔 Subscription webhook notification received:", new Date().toISOString());
      console.log("📦 Subscription webhook payload:", JSON.stringify(req.body, null, 2));

      const webhookData = req.body || {};
      
      // Extract key fields from Adumo subscription notification
      const subscriberId = webhookData.subscriberUid || webhookData.subscriber_uid;
      const scheduleId = webhookData.scheduleUid || webhookData.schedule_uid;
      const status = webhookData.status || webhookData.paymentStatus;
      const amount = webhookData.amount;
      const transactionId = webhookData.transactionId || webhookData.transaction_id;

      if (!subscriberId) {
        console.error("❌ Missing subscriber ID in subscription webhook");
        return res.status(400).json({ error: "Missing subscriber ID" });
      }

      console.log(`🔍 Processing subscription payment: ${subscriberId}`);
      console.log(`   Schedule ID: ${scheduleId}`);
      console.log(`   Status: ${status}`);
      console.log(`   Amount: ${amount}`);
      console.log(`   Transaction ID: ${transactionId}`);

      // Find subscription by Adumo subscriber ID
      const subscription = await storage.getSubscriptionByAdumoSubscriberId(subscriberId);

      if (!subscription) {
        console.error(`❌ Subscription not found for subscriber ID: ${subscriberId}`);
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Process successful subscription payment
      if (status === "SUCCESS" || status === "COMPLETED" || status === "PAID") {
        console.log(`✅ Subscription payment successful for subscription: ${subscription.id}`);
        
        // Increment paid months
        const updatedSubscription = await storage.incrementSubscriptionPaidMonths(subscription.id);
        
        console.log(`📊 Subscription progress: ${updatedSubscription.paidMonths}/${updatedSubscription.totalMonths} months paid`);
        
        // Update next payment date (add 30 days)
        if (updatedSubscription.status === "ACTIVE") {
          const nextPaymentDate = new Date();
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
          
          await storage.updateSubscription(subscription.id, {
            nextPaymentDate,
          });
          
          console.log(`📅 Next payment date updated to: ${nextPaymentDate.toISOString()}`);
        }
        
        // If all payments completed, update user's payment status
        if (updatedSubscription.status === "COMPLETED") {
          console.log(`🎉 Subscription completed! All ${updatedSubscription.totalMonths} payments received.`);
          
          // Update user status to reflect fully paid
          await storage.updateUserPaymentStatus(
            subscription.userId,
            "completed",
            `subscription_${subscription.id}`
          );
        }
      } else if (status === "FAILED" || status === "DECLINED") {
        console.error(`❌ Subscription payment failed for subscription: ${subscription.id}`);
        
        // Optionally update subscription status or send notification
        await storage.updateSubscription(subscription.id, {
          status: "FAILED",
          subscriptionData: {
            ...subscription.subscriptionData as any,
            lastFailedPayment: new Date().toISOString(),
            failureReason: webhookData.failureReason || "Payment failed",
          },
        });
      }

      // Return success response to Adumo
      res.json({ 
        success: true, 
        message: "Subscription webhook processed successfully",
        subscriptionId: subscription.id,
        paidMonths: subscription.paidMonths,
      });

    } catch (error: any) {
      console.error("❌ Error processing subscription webhook:", error);
      res.status(500).json({ 
        error: "Subscription webhook processing failed", 
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
