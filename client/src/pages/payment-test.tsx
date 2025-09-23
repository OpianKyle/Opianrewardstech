import { useState } from "react";
import PaymentForm from "@/components/payment-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentTest() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "PROSPER", price: "550.00" });

  return (
    <div className="min-h-screen bg-background p-8" data-testid="payment-test-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Adumo Payment Integration Test</h1>
        
        {!showPaymentForm ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Test Adumo Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Selected Plan:</p>
                <p className="font-medium">{selectedPlan.name} Plan - R{selectedPlan.price}/month</p>
              </div>
              
              <Button 
                onClick={() => setShowPaymentForm(true)}
                className="w-full"
                data-testid="button-start-payment-test"
              >
                Test Adumo Payment Integration
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <p>This will test the Adumo payment form with your staging credentials.</p>
                <p>Make sure you've set up your environment variables first.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentForm(false)}
                data-testid="button-back-to-test"
              >
                ← Back to Test Menu
              </Button>
            </div>
            
            <PaymentForm
              planName={selectedPlan.name}
              planPrice={selectedPlan.price}
              onSuccess={() => {
                console.log("Payment successful!");
                setShowPaymentForm(false);
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}