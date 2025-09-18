import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvestorSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";

// Stripe setup (fallback payment processor)
// Note: In production, replace with proper Adumo integration
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

  // Create payment intent (Stripe fallback - implement Adumo integration here)
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
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

      // Create payment record
      const payment = await storage.createPayment({
        investorId: investor.id,
        amount: validatedData.amount,
        method: "adumo", // Primary payment method
        paymentData: {
          tier: validatedData.tier,
          paymentMethod: validatedData.paymentMethod
        }
      });

      // For now, return a mock payment intent structure
      // In production, this would integrate with Adumo's API
      const paymentIntent = {
        id: payment.id,
        client_secret: `pi_${payment.id}_secret_${Date.now()}`,
        amount: validatedData.amount,
        currency: "zar",
        status: "requires_payment_method",
        metadata: {
          investorId: investor.id,
          tier: validatedData.tier,
          paymentMethod: validatedData.paymentMethod
        }
      };

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        investorId: investor.id
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    }
  });

  // Process payment completion (webhook endpoint for Adumo)
  app.post("/api/payment-webhook", async (req, res) => {
    try {
      const { paymentIntentId, status, adumoPaymentId } = req.body;
      
      // Find payment and investor
      const payment = await storage.updatePaymentStatus(paymentIntentId, status);
      
      // Update investor payment status
      const investor = await storage.updateInvestorPaymentStatus(
        payment.investorId, 
        status, 
        adumoPaymentId
      );

      // If payment successful, initialize quest progress
      if (status === "succeeded") {
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
