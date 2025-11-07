import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PaymentSectionProps {
  selectedTier?: string | null;
  setSelectedTier?: (tier: string) => void;
  showPaymentModal?: boolean;
  setShowPaymentModal?: (show: boolean) => void;
}

export function PaymentSection({ 
  selectedTier: externalSelectedTier,
  setSelectedTier: externalSetSelectedTier,
  showPaymentModal: externalShowPaymentModal, 
  setShowPaymentModal: externalSetShowPaymentModal 
}: PaymentSectionProps) {
  const [internalShowPaymentModal, internalSetShowPaymentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [internalSelectedTier, internalSetSelectedTier] = useState("");
  
  // Use external state if provided, otherwise use internal state
  const showPaymentModal = externalShowPaymentModal ?? internalShowPaymentModal;
  const setShowPaymentModal = externalSetShowPaymentModal ?? internalSetShowPaymentModal;
  const selectedTier = externalSelectedTier ?? internalSelectedTier;
  const setSelectedTier = externalSetSelectedTier ?? internalSetSelectedTier;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/create-payment-intent", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Handle development mode
      if (data.devMode) {
        toast({
          title: "Development Mode",
          description: data.message || "Payment simulated successfully. Redirecting...",
        });
        
        // Close the modal and redirect after a short delay
        setTimeout(() => {
          setShowPaymentModal(false);
          window.location.href = data.redirectUrl;
        }, 2000);
        return;
      }
      
      // Handle production mode with Adumo form data
      if (data.formData && data.url) {
        toast({
          title: "Payment Initialized", 
          description: "Redirecting to secure Adumo payment processing...",
        });
        
        // Submit form to Adumo's hosted payment page
        setTimeout(() => {
          submitAdumoForm(data.url, data.formData);
        }, 1500);
      } else if (data.redirectUrl) {
        // Fallback for direct redirect URL
        toast({
          title: "Payment Initialized", 
          description: "Redirecting to secure Adumo payment processing...",
        });
        
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      } else {
        toast({
          title: "Payment Error",
          description: "No redirect URL received from payment processor",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to create and submit Adumo payment form
  const submitAdumoForm = (adumoUrl: string, formData: any) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = adumoUrl;
    form.style.display = 'none';

    // Add all form fields
    Object.keys(formData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const contactMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "We'll get back to you within 24 hours.",
      });
      setShowContactModal(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all required fields are filled
    if (!selectedTier || !formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including phone number.",
        variant: "destructive",
      });
      return;
    }

    // For non-cornerstone tiers, require payment method selection
    if (selectedTier !== 'cornerstone' && !selectedPaymentMethod) {
      toast({
        title: "Missing Payment Method",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    // For cornerstone, require custom amount
    if (selectedTier === 'cornerstone' && !customAmount) {
      toast({
        title: "Missing Amount",
        description: "Please enter a custom amount for Cornerstone tier.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      toast({
        title: "Agreement Required",
        description: "Please accept the Terms & Conditions and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    // Calculate amount based on tier and payment method
    const tierPricing: Record<string, Record<string, number>> = {
      builder: { lump_sum: 12000, deposit: 6000, monthly_12: 500 },
      innovator: { lump_sum: 24000, deposit: 12000, monthly_12: 1000 },
      visionary: { lump_sum: 36000, deposit: 18000, monthly_12: 1500 }
    };

    let amount = 0;
    
    if (selectedTier === 'cornerstone') {
      // For cornerstone, use custom amount (must be over R36,000)
      amount = parseInt(customAmount) || 36000;
      if (amount < 36000) {
        toast({
          title: "Invalid Amount",
          description: "Cornerstone tier requires a minimum of R36,000.",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedPaymentMethod === 'deposit_monthly') {
      // For deposit + monthly payments, use the deposit amount
      amount = tierPricing[selectedTier]?.['deposit'] || 0;
    } else {
      // For lump sum or other methods
      amount = tierPricing[selectedTier]?.[selectedPaymentMethod] || 0;
    }

    paymentMutation.mutate({
      tier: selectedTier,
      paymentMethod: selectedTier === 'cornerstone' ? 'lump_sum' : selectedPaymentMethod,
      amount: amount * 100, // Convert to cents
      customAmount: selectedTier === 'cornerstone' ? amount : undefined,
      ...formData
    });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataElement = new FormData(e.target as HTMLFormElement);
    const contactData = {
      name: formDataElement.get("name"),
      email: formDataElement.get("email"), 
      message: formDataElement.get("message"),
      tier: formDataElement.get("tier")
    };
    
    contactMutation.mutate(contactData);
  };

  return (
    <>
      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 border-2 border-amber-500/30 max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" data-testid="payment-modal">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-xl sm:text-2xl text-amber-700 dark:text-amber-400 text-center">
              Investment Options
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePaymentSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm sm:text-base">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="h-11 sm:h-12 text-sm sm:text-base"
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm sm:text-base">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="h-11 sm:h-12 text-sm sm:text-base"
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11 sm:h-12 text-sm sm:text-base"
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm sm:text-base">Cell Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27 82 123 4567"
                  required
                  className="h-11 sm:h-12 text-sm sm:text-base"
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tier" className="text-sm sm:text-base">Select Tier</Label>
              <Select onValueChange={setSelectedTier} value={selectedTier || ""} required>
                <SelectTrigger data-testid="select-tier" className="h-11 sm:h-12 text-sm sm:text-base">
                  <SelectValue placeholder="Choose your tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builder">The Builder - from R12,000</SelectItem>
                  <SelectItem value="innovator">The Innovator - from R24,000</SelectItem>
                  <SelectItem value="visionary">The Visionary - from R36,000</SelectItem>
                  <SelectItem value="cornerstone">The Cornerstone - R36,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Amount for Cornerstone Tier */}
            {selectedTier === 'cornerstone' && (
              <div>
                <Label htmlFor="customAmount" className="text-sm sm:text-base">Custom Amount (Minimum R36,000)</Label>
                <Input
                  id="customAmount"
                  type="number"
                  min="36000"
                  step="1000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount (e.g., 50000)"
                  required
                  className="h-11 sm:h-12 text-sm sm:text-base"
                  data-testid="input-custom-amount"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cornerstone tier: Single lump sum payment over R36,000
                </p>
              </div>
            )}

            {/* Payment Method for non-Cornerstone tiers */}
            {selectedTier && selectedTier !== 'cornerstone' && (
              <div>
                <Label htmlFor="paymentMethod" className="text-sm sm:text-base">Payment Method</Label>
                <Select onValueChange={setSelectedPaymentMethod} value="lump_sum" required>
                  <SelectTrigger data-testid="select-payment-method" className="h-11 sm:h-12 text-sm sm:text-base">
                    <SelectValue placeholder="Choose payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lump_sum">One-off Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div className="border-2 border-primary rounded-lg p-3 sm:p-4 hover:bg-primary/10 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-credit-card text-primary text-lg sm:text-xl"></i>
                  <div>
                    <p className="font-bold text-primary text-sm sm:text-base">Adumo Secure Payment</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Credit/Debit Cards, EFT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions and Privacy Policy */}
            <div className="space-y-2 sm:space-y-3 py-3 sm:py-4 border-t border-border">
              <label htmlFor="terms" className="flex items-center min-h-[44px] cursor-pointer group">
                <Checkbox 
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4"
                  data-testid="checkbox-terms"
                />
                <span className="text-sm sm:text-base font-medium leading-relaxed">
                  I accept the{" "}
                  <a 
                    href="/terms" 
                    target="_blank"
                    className="text-primary hover:text-primary/80 underline"
                    onClick={(e) => e.stopPropagation()}
                    data-testid="link-terms"
                  >
                    Terms & Conditions
                  </a>
                </span>
              </label>
              
              <label htmlFor="privacy" className="flex items-center min-h-[44px] cursor-pointer group">
                <Checkbox 
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                  className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4"
                  data-testid="checkbox-privacy"
                />
                <span className="text-sm sm:text-base font-medium leading-relaxed">
                  I accept the{" "}
                  <a 
                    href="/privacy" 
                    target="_blank"
                    className="text-primary hover:text-primary/80 underline"
                    onClick={(e) => e.stopPropagation()}
                    data-testid="link-privacy"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
              
              <p className="text-xs sm:text-sm text-muted-foreground">
                By proceeding, you confirm that you understand and agree to our terms regarding investment risks, payment processing, and data protection.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
                data-testid="button-cancel-payment"
              >
                Cancel
              </Button>
              <AnimatedButton
                type="submit"
                disabled={paymentMutation.isPending}
                className="flex-1 bg-primary text-primary-foreground font-bold h-11 sm:h-12 text-sm sm:text-base"
                data-testid="button-continue-payment"
              >
                {paymentMutation.isPending ? "Processing..." : "Continue"}
              </AnimatedButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 border-2 border-amber-500/30 max-w-[95vw] sm:max-w-md p-4 sm:p-6" data-testid="contact-modal">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-xl sm:text-2xl text-amber-700 dark:text-amber-400 text-center">
              Contact Our Investment Team
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleContactSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="contactName" className="text-sm sm:text-base">Name</Label>
              <Input
                id="contactName"
                name="name"
                required
                className="h-11 sm:h-12 text-sm sm:text-base"
                data-testid="input-contact-name"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail" className="text-sm sm:text-base">Email</Label>
              <Input
                id="contactEmail"
                name="email"
                type="email"
                required
                className="h-11 sm:h-12 text-sm sm:text-base"
                data-testid="input-contact-email"
              />
            </div>

            <div>
              <Label htmlFor="contactTier" className="text-sm sm:text-base">Interested Tier</Label>
              <Select name="tier">
                <SelectTrigger data-testid="select-contact-tier" className="h-11 sm:h-12 text-sm sm:text-base">
                  <SelectValue placeholder="Select tier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builder">The Builder</SelectItem>
                  <SelectItem value="innovator">The Innovator</SelectItem>
                  <SelectItem value="visionary">The Visionary</SelectItem>
                  <SelectItem value="cornerstone">The Cornerstone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contactMessage" className="text-sm sm:text-base">Message</Label>
              <textarea
                id="contactMessage"
                name="message"
                className="w-full p-3 sm:p-4 bg-input border border-border rounded-md text-foreground text-sm sm:text-base min-h-[100px]"
                rows={4}
                required
                data-testid="textarea-contact-message"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowContactModal(false)}
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
                data-testid="button-cancel-contact"
              >
                Cancel
              </Button>
              <AnimatedButton
                type="submit"
                disabled={contactMutation.isPending}
                className="flex-1 bg-primary text-primary-foreground font-bold h-11 sm:h-12 text-sm sm:text-base"
                data-testid="button-send-message"
              >
                {contactMutation.isPending ? "Sending..." : "Send Message"}
              </AnimatedButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
