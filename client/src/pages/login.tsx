import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2, Shield, Building } from 'lucide-react';
import opianBankLogo from "@assets/Opian bank_1760685427396.png";

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setAuthToken } = useAuth();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');

    if (paymentStatus === 'success') {
      setPaymentSuccess(true);
      toast({
        title: "Payment Successful",
        description: `Your investment has been processed successfully. Reference: ${reference}. Please login to access your investor portal.`,
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
        title: "Verification Code Sent",
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
        await setAuthToken(data.token);
        toast({
          title: "Login Successful",
          description: "Welcome to your Investor Portal",
        });
        setLocation('/dashboard');
      } else {
        toast({
          title: "Verification Failed",
          description: "Server did not return authentication token",
          variant: "destructive",
        });
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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-black to-yellow-950/10"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      <Card className="w-full max-w-md bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 border-amber-500/30 backdrop-blur-xl relative z-10" data-testid="card-login">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={opianBankLogo} 
              alt="Opian Investment Partners" 
              className="h-16 w-auto object-contain"
            />
          </div>
          
          {paymentSuccess && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-amber-400" />
              <p className="text-sm text-amber-400 font-medium">Investment Payment Successful</p>
            </div>
          )}
          
          <CardTitle className="text-2xl font-serif font-bold text-amber-100">
            {step === 'email' ? 'Investor Portal Access' : 'Verify Your Identity'}
          </CardTitle>
          <CardDescription className="text-center text-amber-200/70">
            {step === 'email' 
              ? 'Enter your registered email address to receive a secure verification code'
              : 'Enter the 6-digit verification code sent to your email'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8">
          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-200">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="investor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-800/50 border-amber-500/30 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500 focus:ring-amber-500/20"
                  data-testid="input-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold shadow-lg shadow-amber-500/30"
                disabled={isLoading}
                data-testid="button-request-otp"
              >
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-amber-200">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="bg-zinc-800/50 border-amber-500/30 text-amber-100 placeholder:text-amber-200/40 text-center text-2xl tracking-widest focus:border-amber-500 focus:ring-amber-500/20"
                  data-testid="input-otp"
                />
                <p className="text-xs text-amber-200/60 text-center">
                  Verification code expires in 10 minutes
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold shadow-lg shadow-amber-500/30"
                disabled={isLoading}
                data-testid="button-verify-otp"
              >
                {isLoading ? 'Verifying...' : 'Verify & Access Portal'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
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
          
          <div className="mt-6 pt-6 border-t border-amber-500/20">
            <div className="flex items-center justify-center gap-2 text-xs text-amber-200/60 mb-4">
              <Shield className="h-3 w-3" />
              <span>Secure authentication • Bank-grade encryption</span>
            </div>
            <a href="/" className="block text-center text-sm text-amber-400 hover:text-amber-300 transition-colors" data-testid="link-home">
              ← Return to Home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
