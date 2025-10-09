import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');

    if (paymentStatus === 'success') {
      setPaymentSuccess(true);
      toast({
        title: "Payment Successful! 🎉",
        description: `Your investment has been processed successfully. Reference: ${reference}. Please login to access your portal.`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again or contact support.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'error') {
      toast({
        title: "Payment Error",
        description: "An error occurred during payment processing. Please contact support.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('POST', '/api/auth/request-otp', { email });
      
      setStep('otp');
      toast({
        title: "Code Sent",
        description: "If an account exists with this email, a verification code has been sent.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Could not send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/verify-otp', { email, code: otp });

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        toast({
          title: "Login Successful",
          description: "Welcome back to Opian Rewards",
        });
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800/50 border-cyan-500/30 backdrop-blur" data-testid="card-login">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl font-bold text-cyan-400">
              OPIAN REWARDS
            </div>
          </div>
          {paymentSuccess && (
            <div className="flex items-center justify-center gap-2 mb-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-400 font-medium">Payment Successful!</p>
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-center text-white">
            {step === 'email' ? 'Investor Portal Login' : 'Enter Verification Code'}
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            {step === 'email' 
              ? 'Enter your email to receive a login code'
              : 'Check your email for the 6-digit code'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="investor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-700/50 border-cyan-500/30 text-white placeholder:text-gray-400"
                  data-testid="input-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold"
                disabled={isLoading}
                data-testid="button-request-otp"
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-200">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="bg-gray-700/50 border-cyan-500/30 text-white placeholder:text-gray-400 text-center text-2xl tracking-widest"
                  data-testid="input-otp"
                />
                <p className="text-xs text-gray-400 text-center">
                  Code expires in 10 minutes
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold"
                disabled={isLoading}
                data-testid="button-verify-otp"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-transparent"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                }}
                data-testid="button-back-to-email"
              >
                ← Use different email
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-cyan-400 hover:text-cyan-300" data-testid="link-home">
              ← Back to Home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
