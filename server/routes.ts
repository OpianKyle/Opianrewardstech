import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvestorSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Adumo payment configuration using environment variables (required)
const ADUMO_CONFIG = {
  merchantId: process.env.ADUMO_MERCHANT_ID,
  jwtSecret: process.env.ADUMO_JWT_SECRET,
  applicationId: process.env.ADUMO_APPLICATION_ID,
  // URLs - using staging for development, production when deployed
  apiUrl: process.env.NODE_ENV === "production" 
    ? "https://apiv3.adumoonline.com/product/payment/v1/initialisevirtual"
    : "https://staging-apiv3.adumoonline.com/product/payment/v1/initialisevirtual",
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

  // Create Adumo payment (server-side initialization)
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
          tier: validatedData.tier,
          paymentMethod: validatedData.paymentMethod,
          amount: validatedData.amount,
        });
      }

      // Create payment record with reference
      const payment = await storage.createPayment({
        investorId: investor.id,
        amount: validatedData.amount,
        method: "adumo",
        paymentData: {
          tier: validatedData.tier,
          paymentMethod: validatedData.paymentMethod
        }
      });

      // Generate unique reference and store it with the payment
      const reference = `OPIAN_${Date.now()}_${payment.id.substring(0, 8)}`;
      
      // Update payment with reference for lookup
      await storage.updatePaymentStatus(payment.id, "pending");
      
      // Convert amount from cents to currency with 2 decimal places
      const currencyAmount = (validatedData.amount / 100).toFixed(2);

      // Generate JWT token for Adumo API authentication
      const jwtPayload = {
        MerchantUID: ADUMO_CONFIG.merchantId,
        ApplicationUID: ADUMO_CONFIG.applicationId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 15) // 15 minutes expiry
      };
      
      const jwtToken = jwt.sign(jwtPayload, ADUMO_CONFIG.jwtSecret);

      // Prepare payload for Adumo's server-to-server API
      const adumoPayload = {
        MerchantUID: ADUMO_CONFIG.merchantId,
        ApplicationUID: ADUMO_CONFIG.applicationId,
        TransactionAmount: currencyAmount,
        TransactionCurrency: "ZAR",
        TransactionReference: reference,
        CustomerEmail: validatedData.email,
        CustomerFirstName: validatedData.firstName,
        CustomerLastName: validatedData.lastName,
        ReturnURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}`,
        CancelURL: `${ADUMO_CONFIG.returnUrl}?paymentId=${payment.id}&reference=${reference}&status=cancelled`,
        NotifyURL: ADUMO_CONFIG.notifyUrl,
        TransactionDescription: `Opian Rewards - ${validatedData.tier} Tier`,
        CustomField1: reference,
        CustomField2: payment.id,
        CustomField3: investor.id
      };

      console.log('🔍 Sending to Adumo:', JSON.stringify(adumoPayload, null, 2));

      // Make server-to-server call to Adumo
      const adumoResponse = await fetch(ADUMO_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(adumoPayload)
      });

      const adumoResult = await adumoResponse.json();
      console.log('🎯 Adumo Response:', JSON.stringify(adumoResult, null, 2));

      if (!adumoResponse.ok) {
        throw new Error(`Adumo API error: ${adumoResult.message || 'Unknown error'}`);
      }

      // Return the redirect URL from Adumo
      res.json({ 
        redirectUrl: adumoResult.RedirectURL || adumoResult.redirectUrl,
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
      const { paymentId, reference, ResultCode, ResultDescription, TransactionReference } = 
        req.method === 'GET' ? req.query : req.body;
      
      const paymentRef = reference || TransactionReference;
      const resultCode = ResultCode;
      
      if (paymentId && paymentRef) {
        const payment = await storage.updatePaymentStatus(
          paymentId as string, 
          resultCode === "00" ? "completed" : "failed"
        );
        
        // Update investor status
        if (resultCode === "00") {
          await storage.updateInvestorPaymentStatus(
            payment.investorId, 
            "completed", 
            paymentRef as string
          );
          
          // Initialize quest progress
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
        }
      }

      // Redirect to frontend with payment result
      const status = resultCode === "00" ? "success" : "failed";
      res.redirect(`/?payment=${status}&reference=${paymentRef}`);
    } catch (error: any) {
      console.error("Payment return error:", error);
      res.redirect("/?payment=error");
    }
  };
  
  app.get("/payment-return", handlePaymentReturn);
  app.post("/payment-return", handlePaymentReturn);

  // Process payment completion (webhook endpoint for Adumo)
  app.post("/api/payment-webhook", async (req, res) => {
    try {
      // Adumo webhook data structure
      const { 
        ResultCode, 
        ResultDescription, 
        TransactionReference, 
        TransactionAmount,
        CustomField1, // reference
        CustomField2, // paymentId  
        CustomField3  // investorId
      } = req.body;
      
      console.log("Adumo webhook received:", req.body);
      
      // TODO: In production, implement proper webhook signature verification
      // For now, proceed with basic validation
      
      if (CustomField2 && CustomField3) {
        const payment = await storage.updatePaymentStatus(
          CustomField2, // paymentId from CustomField2
          ResultCode === "00" ? "completed" : "failed"
        );
        
        // Update investor payment status
        const investor = await storage.updateInvestorPaymentStatus(
          CustomField3, // investorId from CustomField3
          ResultCode === "00" ? "completed" : "failed", 
          TransactionReference
        );

        // If payment successful, initialize quest progress
        if (ResultCode === "00") {
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
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Payment webhook error:", error);
      res.status(500).json({ message: "Error processing payment webhook: " + error.message });
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
