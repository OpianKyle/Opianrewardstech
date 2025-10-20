import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, CreditCard, DollarSign, RefreshCw, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function SubscriptionTest() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Customer Details
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    contactNumber: "+27211239876",
    mobileNumber: "+27871239876",
    recipient: "Test User",
    
    // Subscription Details
    amount: "123.54",
    collectionValue: "123.54",
    frequency: "MONTHLY",
    collectionDay: "7",
    accountNumber: `ACC_${Date.now()}`,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    endDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 years from now
    
    // Item Details
    itemDescription: "Monthly Subscription Payment",
    itemRef: "SUB_001",
    quantity: "1",
    
    // Shipping Address
    shippingAddress1: "15 Yorke Street",
    shippingAddress2: "Gardens",
    shippingAddress3: "Cape Town",
    shippingAddress4: "8000",
    shippingAddress5: "South Africa",
    
    // Additional Options
    shouldSendSms: false,
    shouldSendEmail: false,
    
    // Custom Variables
    variable1: "Subscription",
    variable2: `INV_${Date.now()}`,
  });

  const subscriptionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/test-subscription", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.formData && data.url) {
        toast({
          title: "Subscription Form Created ✅",
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
          description: data.message || "Failed to create subscription form",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription form",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    subscriptionMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="border-cyan-500/30 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
              <RefreshCw className="h-8 w-8" />
              Adumo Subscription Test
            </CardTitle>
            <CardDescription className="text-slate-300">
              Test recurring payment subscriptions using Adumo Online virtual form integration
            </CardDescription>
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Note:</strong> When redirected to Adumo's payment page, you may see technical fields like "puid" or other system identifiers. These are normal and used for payment processing - you can safely ignore them.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
                  <User className="h-5 w-5" />
                  <h3>Customer Details</h3>
                </div>
                <Separator className="bg-cyan-500/30" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-slate-200">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-firstName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-slate-200">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-lastName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactNumber" className="text-slate-200">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-contactNumber"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobileNumber" className="text-slate-200">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-mobileNumber"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient" className="text-slate-200">Recipient Name</Label>
                    <Input
                      id="recipient"
                      value={formData.recipient}
                      onChange={(e) => handleInputChange('recipient', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-recipient"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
                  <Calendar className="h-5 w-5" />
                  <h3>Subscription Configuration</h3>
                </div>
                <Separator className="bg-cyan-500/30" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency" className="text-slate-200">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="select-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EVERY">Every (Daily)</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="BIANNUALLY">Bi-Annually</SelectItem>
                        <SelectItem value="ANNUALLY">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">
                      {formData.frequency === "EVERY" && "1-30: Every X days"}
                      {formData.frequency === "WEEKLY" && "1-7: Day of week (1=Mon, 7=Sun)"}
                      {formData.frequency === "MONTHLY" && "1-28: Day of month"}
                      {formData.frequency === "QUARTERLY" && "Day of month"}
                      {formData.frequency === "BIANNUALLY" && "Day of month"}
                      {formData.frequency === "ANNUALLY" && "Day of month"}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="collectionDay" className="text-slate-200">Collection Day</Label>
                    <Input
                      id="collectionDay"
                      value={formData.collectionDay}
                      onChange={(e) => handleInputChange('collectionDay', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-collectionDay"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber" className="text-slate-200">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-accountNumber"
                    />
                  </div>
                  <div>
                    <Label htmlFor="collectionValue" className="text-slate-200">
                      Monthly Collection Amount (ZAR)
                    </Label>
                    <Input
                      id="collectionValue"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="123.54"
                      value={formData.collectionValue}
                      onChange={(e) => handleInputChange('collectionValue', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-collectionValue"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Recurring monthly amount (e.g., 123.54 for R123.54/month)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="startDate" className="text-slate-200">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-startDate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-slate-200">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-endDate"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
                  <DollarSign className="h-5 w-5" />
                  <h3>Initial Payment Details</h3>
                </div>
                <Separator className="bg-cyan-500/30" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-slate-200">
                      Initial Payment Amount (ZAR)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="123.54"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-amount"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      First payment amount (e.g., 123.54 for R123.54)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="itemDescription" className="text-slate-200">Item Description</Label>
                    <Input
                      id="itemDescription"
                      value={formData.itemDescription}
                      onChange={(e) => handleInputChange('itemDescription', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-itemDescription"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemRef" className="text-slate-200">Item Reference</Label>
                    <Input
                      id="itemRef"
                      value={formData.itemRef}
                      onChange={(e) => handleInputChange('itemRef', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-itemRef"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity" className="text-slate-200">Quantity</Label>
                    <Input
                      id="quantity"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-quantity"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
                  <CreditCard className="h-5 w-5" />
                  <h3>Shipping Address</h3>
                </div>
                <Separator className="bg-cyan-500/30" />
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="shippingAddress1" className="text-slate-200">Address Line 1</Label>
                    <Input
                      id="shippingAddress1"
                      value={formData.shippingAddress1}
                      onChange={(e) => handleInputChange('shippingAddress1', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-shippingAddress1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shippingAddress2" className="text-slate-200">Suburb</Label>
                      <Input
                        id="shippingAddress2"
                        value={formData.shippingAddress2}
                        onChange={(e) => handleInputChange('shippingAddress2', e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        data-testid="input-shippingAddress2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingAddress3" className="text-slate-200">City</Label>
                      <Input
                        id="shippingAddress3"
                        value={formData.shippingAddress3}
                        onChange={(e) => handleInputChange('shippingAddress3', e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        data-testid="input-shippingAddress3"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shippingAddress4" className="text-slate-200">Postal Code</Label>
                      <Input
                        id="shippingAddress4"
                        value={formData.shippingAddress4}
                        onChange={(e) => handleInputChange('shippingAddress4', e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        data-testid="input-shippingAddress4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingAddress5" className="text-slate-200">Country</Label>
                      <Input
                        id="shippingAddress5"
                        value={formData.shippingAddress5}
                        onChange={(e) => handleInputChange('shippingAddress5', e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        data-testid="input-shippingAddress5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400">Notification Options</h3>
                <Separator className="bg-cyan-500/30" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shouldSendSms" className="text-slate-200">Send SMS Notifications</Label>
                    <Switch
                      id="shouldSendSms"
                      checked={formData.shouldSendSms}
                      onCheckedChange={(checked) => handleInputChange('shouldSendSms', checked)}
                      data-testid="switch-shouldSendSms"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shouldSendEmail" className="text-slate-200">Send Email Notifications</Label>
                    <Switch
                      id="shouldSendEmail"
                      checked={formData.shouldSendEmail}
                      onCheckedChange={(checked) => handleInputChange('shouldSendEmail', checked)}
                      data-testid="switch-shouldSendEmail"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Variables */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400">Custom Variables</h3>
                <Separator className="bg-cyan-500/30" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="variable1" className="text-slate-200">Variable 1</Label>
                    <Input
                      id="variable1"
                      value={formData.variable1}
                      onChange={(e) => handleInputChange('variable1', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-variable1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="variable2" className="text-slate-200">Variable 2</Label>
                    <Input
                      id="variable2"
                      value={formData.variable2}
                      onChange={(e) => handleInputChange('variable2', e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      data-testid="input-variable2"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-cyan-500/30" />

              <Button
                type="submit"
                disabled={subscriptionMutation.isPending}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-lg"
                data-testid="button-submit"
              >
                {subscriptionMutation.isPending ? (
                  <>Processing...</>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Create Subscription Test
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-4 border-blue-500/30 bg-blue-950/30 backdrop-blur">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-300 mb-2">Test Information</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• This form tests Adumo's Virtual Form Post subscription integration</li>
              <li>• After submitting, you'll be redirected to Adumo's payment page</li>
              <li>• Enter test card details on the Adumo page to complete the subscription</li>
              <li>• The subscription will be created with the recurring payment schedule you specified</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
