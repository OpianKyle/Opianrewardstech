import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Shield, CheckCircle, Loader2, ArrowRight } from "lucide-react";

export default function SubscriptionSetup() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const paymentId = searchParams.get("paymentId");
  const reference = searchParams.get("reference");
  const tier = searchParams.get("tier") || "builder";
  const monthlyAmount = searchParams.get("monthlyAmount") || "500";
  
  const { toast } = useToast();
  
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: ""
  });
  
  const [step, setStep] = useState<"intro" | "form" | "processing" | "complete">("intro");

  // Mutation to tokenize card and create subscription
  const setupSubscriptionMutation = useMutation({
    mutationFn: async (data: typeof cardData) => {
      // Step 1: Tokenize card
      const tokenResponse = await apiRequest("POST", "/api/adumo/tokenize-card", {
        cardNumber: data.cardNumber.replace(/\s/g, ""),
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
        cardholderName: data.cardholderName
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.success) {
        throw new Error(tokenData.message || "Card tokenization failed");
      }
      
      // Step 2: Create subscription with tokenized card
      const subResponse = await apiRequest("POST", "/api/adumo/create-subscription-from-payment", {
        paymentId,
        reference,
        tokenUid: tokenData.cardToken,
        profileUid: tokenData.profileToken
      });
      
      return subResponse.json();
    },
    onSuccess: (data) => {
      setStep("complete");
      toast({
        title: "Subscription Created! 🎉",
        description: "Your monthly payments have been set up successfully.",
      });
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Setup Failed",
        description: error.message || "Unable to set up your subscription. Please try again.",
        variant: "destructive"
      });
      setStep("form");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");
    setupSubscriptionMutation.mutate(cardData);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  if (!paymentId || !reference) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-900 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400">Invalid Access</CardTitle>
            <CardDescription className="text-slate-400">
              This page requires a valid payment reference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")}
              className="w-full"
              data-testid="button-go-home"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-900 border-cyan-500/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-cyan-400">All Set! 🎉</CardTitle>
            <CardDescription className="text-slate-400">
              Your subscription has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-slate-400">Monthly Amount:</p>
              <p className="text-2xl font-bold text-cyan-400">R{monthlyAmount}</p>
            </div>
            <p className="text-sm text-slate-400 text-center">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-slate-900 border-cyan-500/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-cyan-500/20 p-3">
                <CreditCard className="h-12 w-12 text-cyan-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-cyan-400">Complete Your Subscription Setup</CardTitle>
            <CardDescription className="text-slate-400">
              Your deposit payment was successful! Now let's set up your monthly payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tier:</span>
                <span className="text-cyan-400 font-semibold capitalize">{tier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Monthly Payment:</span>
                <span className="text-cyan-400 font-semibold">R{monthlyAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Duration:</span>
                <span className="text-cyan-400 font-semibold">12 months</span>
              </div>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                Your card details are securely tokenized and encrypted. We never store your full card information.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold text-white">What happens next:</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Enter your card details for secure tokenization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Monthly payments of R{monthlyAmount} will be processed automatically</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Payments start on the 7th of next month</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={() => setStep("form")}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-continue-setup"
            >
              Continue to Card Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-900 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Enter Card Details</CardTitle>
          <CardDescription className="text-slate-400">
            Securely tokenize your card for monthly payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholderName" className="text-slate-300">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={cardData.cardholderName}
                onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
                required
                disabled={step === "processing"}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-cardholder-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-slate-300">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={(e) => setCardData({ 
                  ...cardData, 
                  cardNumber: formatCardNumber(e.target.value)
                })}
                required
                disabled={step === "processing"}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-card-number"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth" className="text-slate-300">Month</Label>
                <Input
                  id="expiryMonth"
                  placeholder="MM"
                  maxLength={2}
                  value={cardData.expiryMonth}
                  onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                  required
                  disabled={step === "processing"}
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-expiry-month"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryYear" className="text-slate-300">Year</Label>
                <Input
                  id="expiryYear"
                  placeholder="YY"
                  maxLength={2}
                  value={cardData.expiryYear}
                  onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                  required
                  disabled={step === "processing"}
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-expiry-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-slate-300">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  maxLength={4}
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                  required
                  disabled={step === "processing"}
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-cvv"
                />
              </div>
            </div>

            <Alert className="bg-slate-800/50 border-slate-700">
              <Shield className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-slate-400 text-sm">
                Your card will be securely tokenized. We never store your full card details.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              disabled={step === "processing"}
              data-testid="button-setup-subscription"
            >
              {step === "processing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up subscription...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Set Up Subscription
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-700 text-slate-400 hover:bg-slate-800"
              onClick={() => setLocation("/dashboard")}
              disabled={step === "processing"}
              data-testid="button-skip-later"
            >
              I'll do this later
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
