import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Shield, Lock } from "lucide-react";

const paymentFormSchema = z.object({
  // Card details
  cardNumber: z.string()
    .min(13, "Card number must be at least 13 digits")
    .max(19, "Card number must be at most 19 digits")
    .regex(/^\d+$/, "Card number must contain only digits"),
  cardholderName: z.string().min(3, "Cardholder name is required"),
  expiryMonth: z.string()
    .length(2, "Month must be 2 digits")
    .regex(/^(0[1-9]|1[0-2])$/, "Invalid month"),
  expiryYear: z.string()
    .length(2, "Year must be 2 digits")
    .regex(/^\d{2}$/, "Invalid year"),
  cvv: z.string()
    .min(3, "CVV must be at least 3 digits")
    .max(4, "CVV must be at most 4 digits")
    .regex(/^\d+$/, "CVV must contain only digits"),
  // Save card option
  saveCard: z.boolean().default(true),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  planName: string;
  planPrice: string;
  planTier: string;
  paymentMethod: string; // "monthly" or "deposit_monthly"
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userPhone?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentFormNew({
  planName,
  planPrice,
  planTier,
  paymentMethod,
  userEmail,
  userFirstName,
  userLastName,
  userPhone,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      saveCard: true,
    },
  });

  const handleSubmit = async (values: PaymentFormValues) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call new tokenization + payment endpoint
      const response = await apiRequest("POST", "/api/payment/tokenize-and-pay", {
        // User details
        email: userEmail,
        firstName: userFirstName,
        lastName: userLastName,
        phone: userPhone,
        // Payment details
        tier: planTier,
        paymentMethod,
        amount: parseFloat(planPrice) * 100, // Convert to cents
        // Card details for tokenization
        cardNumber: values.cardNumber,
        cardholderName: values.cardholderName,
        expiryMonth: values.expiryMonth,
        expiryYear: values.expiryYear,
        cvv: values.cvv,
        saveCard: values.saveCard,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment failed");
      }

      // Success
      toast({
        title: "Payment Successful",
        description: values.saveCard 
          ? "Your payment has been processed and card saved for future use."
          : "Your payment has been processed successfully.",
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });

      onSuccess();
    } catch (err: any) {
      const errorMessage = err.message || "Payment failed. Please try again.";
      setError(errorMessage);
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="payment-form-new">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Complete Your Subscription</span>
        </CardTitle>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium">{planName} Plan</p>
          <p>R{planPrice}/{paymentMethod === "deposit_monthly" ? "deposit + monthly" : "month"}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Secure Payment Processing
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Your card information is encrypted and securely processed by Adumo Online.
                    We never store your full card details.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          field.onChange(formatted.replace(/\s/g, ""));
                        }}
                        value={formatCardNumber(field.value)}
                        data-testid="input-card-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cardholderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cardholder Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="JOHN DOE"
                        data-testid="input-cardholder-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiryMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Month</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="MM"
                          maxLength={2}
                          data-testid="input-expiry-month"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Year</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="YY"
                          maxLength={2}
                          data-testid="input-expiry-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="123"
                        maxLength={4}
                        data-testid="input-cvv"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saveCard"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-save-card"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        <Lock className="w-3 h-3 inline mr-1" />
                        Save card for future payments
                      </FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Securely save your card for faster checkout next time
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Plan:</span>
                <span className="font-medium">{planName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                <span className="font-medium">R{planPrice}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Currency:</span>
                <span className="font-medium">ZAR</span>
              </div>
              <hr className="border-slate-200 dark:border-slate-700" />
              <div className="flex items-center justify-between font-medium">
                <span>Total:</span>
                <span className="text-lg">R{planPrice}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
                data-testid="button-cancel-payment"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1"
                data-testid="button-submit-payment"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Pay Securely
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              By clicking "Pay Securely", you agree to our terms of service.
              Your payment is processed securely by Adumo Online.
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
