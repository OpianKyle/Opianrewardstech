import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvestorSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

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

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  // Get investor by email
  app.get("/api/investors/:email", async (req, res) => {
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

  // Debug endpoint to check payments for an investor
  app.get("/api/debug/payments/:investorId", async (req, res) => {
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
      const jwtPayload = {
        MerchantUID: ADUMO_CONFIG.merchantId,
        ApplicationUID: ADUMO_CONFIG.applicationId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 15) // 15 minutes expiry
      };
      
      const jwtToken = jwt.sign(jwtPayload, ADUMO_CONFIG.jwtSecret!);

      // Return form data for client-side form POST to Adumo Virtual
      // Using exact field names as per Adumo documentation
      const formData = {
        MerchantID: ADUMO_CONFIG.merchantId,
        ApplicationID: ADUMO_CONFIG.applicationId,
        TransactionReference: reference,
        MerchantReference: reference, // Using same reference for both
        Amount: currencyAmount,
        CurrencyCode: "ZAR",
        Description: `Opian Rewards - ${validatedData.tier} Tier`,
        CustomerFirstName: validatedData.firstName,
        CustomerLastName: validatedData.lastName,
        CustomerEmail: validatedData.email,
        ReturnURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}`,
        CancelURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}&status=cancelled`,
        NotifyURL: ADUMO_CONFIG.notifyUrl,
        CustomField1: reference,
        CustomField2: payment.id,
        CustomField3: investor.id,
        JWT: jwtToken
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
      
      const { paymentId, reference, ResultCode, ResultDescription, TransactionReference } = 
        req.method === 'GET' ? req.query : req.body;
      
      const paymentRef = reference || TransactionReference;
      const resultCode = ResultCode;
      
      console.log("🔍 Payment return processing:");
      console.log(`  PaymentId: ${paymentId}`);
      console.log(`  Reference: ${paymentRef}`);
      console.log(`  ResultCode: ${resultCode} (${resultCode === "00" ? "SUCCESS" : "FAILED"})`);
      
      if (paymentId && paymentRef) {
        console.log("✅ Updating payment status via return...");
        const payment = await storage.updatePaymentStatus(
          paymentId as string, 
          resultCode === "00" ? "completed" : "failed"
        );
        console.log(`💰 Payment ${payment.id} updated to: ${payment.status}`);
        
        // Update investor status
        if (resultCode === "00") {
          console.log("👤 Updating investor status via return...");
          await storage.updateInvestorPaymentStatus(
            payment.investorId, 
            "completed", 
            paymentRef as string
          );
          
          // Initialize quest progress
          console.log("🎮 Initializing quest progress via return...");
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
          console.log("🎮 Quest progress initialized successfully via return");
        }
      } else {
        console.log("❌ Missing required fields in return: paymentId or reference");
      }

      // Redirect to frontend with payment result
      const status = resultCode === "00" ? "success" : "failed";
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

    // Check body fields (case-insensitive)
    const body = req.body || {};
    const bodyKeys = Object.keys(body);
    
    for (const key of bodyKeys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'token' || lowerKey === 'jwt') {
        return body[key];
      }
    }

    // Check query parameters
    const query = req.query || {};
    return query.token || query.jwt || query.Token || query.JWT || null;
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

  // Process payment completion (webhook endpoint for Adumo)
  app.post("/api/payment-webhook", async (req, res) => {
    try {
      console.log("🔔 Adumo webhook received at", new Date().toISOString());
      
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
          
          if (payment) {
            // Map Adumo result codes: 1 = success, -1 = failed, 0 = pending
            const isSuccess = result === 1;
            const paymentStatus = isSuccess ? "completed" : result === -1 ? "failed" : "pending";
            
            console.log("✅ Found payment, updating status...");
            console.log(`💰 Payment status: ${payment.status} → ${paymentStatus}`);
            
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

            // If payment successful, initialize quest progress
            if (isSuccess) {
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
            console.log("❌ Payment not found for merchant reference");
          }
        } else {
          console.log("❌ Invalid merchant reference format");
        }
        
      } else {
        // Fallback to legacy format for compatibility
        console.log("🔄 No JWT token found, trying legacy format...");
        
        const { 
          ResultCode, 
          CustomField2, // paymentId  
          CustomField3  // investorId
        } = req.body;
        
        if (CustomField2 && CustomField3) {
          console.log("✅ Processing legacy webhook format...");
          const paymentStatus = ResultCode === "00" ? "completed" : "failed";
          
          const payment = await storage.updatePaymentStatus(CustomField2, paymentStatus);
          const investor = await storage.updateInvestorPaymentStatus(
            CustomField3,
            paymentStatus,
            req.body.TransactionReference
          );

          if (ResultCode === "00") {
            const questProgress = {
              level: 1,
              phase: "development",
              startDate: new Date().toISOString(),
              milestones: { capitalReclaimed: false, dividendPhase: false }
            };
            await storage.updateInvestorProgress(investor.id, questProgress);
          }
        } else {
          console.log("❌ Missing required fields");
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

  const httpServer = createServer(app);
  return httpServer;
}
