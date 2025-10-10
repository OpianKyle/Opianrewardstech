import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentTest() {
  const [tier, setTier] = useState("builder");
  const [paymentMethod, setPaymentMethod] = useState("deposit_monthly");
  const [formData, setFormData] = useState({
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "+27821234567"
  });

  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/create-payment-intent", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.formData && data.url) {
        toast({
          title: "Payment Intent Created ✅",
          description: "Redirecting to Adumo payment gateway...",
        });
        
        // Submit form to Adumo
        setTimeout(() => {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.url;
          
          Object.entries(data.formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });
          
          document.body.appendChild(form);
          form.submit();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create payment intent",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment intent",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tierPricing: Record<string, { amount: number; deposit: number; monthly: number }> = {
      builder: { amount: 5000000, deposit: 600000, monthly: 50000 },
      innovator: { amount: 10000000, deposit: 1200000, monthly: 100000 },
      visionary: { amount: 15000000, deposit: 1800000, monthly: 150000 }
    };

    const pricing = tierPricing[tier];
    const amount = paymentMethod === "deposit_monthly" ? pricing.deposit : pricing.amount;

    paymentMutation.mutate({
      tier,
      paymentMethod,
      amount,
      ...formData
    });
  };

  return (
    <div className="min-h-screen bg-background p-8" data-testid="payment-test-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Adumo Payment & Subscription Test</h1>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Test Payment & OAuth Subscription</CardTitle>
            <CardDescription>
              Test both regular payments and subscription creation with OAuth authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier Package</Label>
                  <Select value={tier} onValueChange={setTier}>
                    <SelectTrigger id="tier" data-testid="select-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="builder">Builder (R50k)</SelectItem>
                      <SelectItem value="innovator">Innovator (R100k)</SelectItem>
                      <SelectItem value="visionary">Visionary (R150k)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod" data-testid="select-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lump_sum">Lump Sum (Full Payment)</SelectItem>
                      <SelectItem value="deposit_monthly">Deposit + Monthly (OAuth Subscription)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    data-testid="input-first-name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    data-testid="input-last-name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-phone"
                  required
                />
              </div>

              {paymentMethod === "deposit_monthly" && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📋 OAuth Subscription Test
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This will test the OAuth flow:
                  </p>
                  <ol className="text-sm text-blue-600 dark:text-blue-400 list-decimal list-inside mt-2 space-y-1">
                    <li>Get OAuth token from Adumo</li>
                    <li>Create subscriber in Adumo</li>
                    <li>Create payment schedule</li>
                    <li>Process deposit payment</li>
                  </ol>
                </div>
              )}

              <Button 
                type="submit"
                className="w-full"
                disabled={paymentMutation.isPending}
                data-testid="button-test-payment"
              >
                {paymentMutation.isPending ? "Processing..." : "Test Payment Flow"}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Make sure ADUMO_MERCHANT_ID, ADUMO_CLIENT_SECRET, and ADUMO_APPLICATION_ID are set</p>
                <p>• This uses staging credentials for testing</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}