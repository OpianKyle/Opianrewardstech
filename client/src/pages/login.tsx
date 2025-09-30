import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, phone);
      toast({
        title: "Login successful",
        description: "Welcome back to Opian Rewards",
      });
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or phone number",
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
          <CardTitle className="text-2xl font-bold text-center text-white">
            Investor Portal
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            Login to view your investments and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-200">
                Last 4 Digits of Phone Number
              </Label>
              <Input
                id="phone"
                type="text"
                placeholder="1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, 4))}
                maxLength={4}
                required
                className="bg-gray-700/50 border-cyan-500/30 text-white placeholder:text-gray-400"
                data-testid="input-phone"
              />
              <p className="text-xs text-gray-400">
                Enter the last 4 digits of your registered phone number
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? 'Logging in...' : 'Login to Dashboard'}
            </Button>
          </form>
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
