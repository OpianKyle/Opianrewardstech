import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Shield, TrendingUp, Users } from "lucide-react";
import opianLogo from "@assets/opian-rewards-logo-blue_1758534360427.png";

export default function OpianBank() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Store access granted in sessionStorage
    sessionStorage.setItem("opian_bank_access", "granted");
    sessionStorage.setItem("opian_user_info", JSON.stringify(formData));

    toast({
      title: "Access Granted! 🎉",
      description: "Welcome to Opian Bank. Redirecting you to the Ascendancy Project...",
    });

    // Redirect to Ascendancy Project
    setTimeout(() => {
      setLocation("/ascendancy");
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_50%)]"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-cyan-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <img 
                src={opianLogo} 
                alt="Opian Bank" 
                className="h-12 w-auto object-contain"
                data-testid="bank-logo"
              />
              <div>
                <h1 className="text-2xl font-bold text-cyan-400">Opian Bank</h1>
                <p className="text-xs text-cyan-300/70">Financial Innovation Redefined</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Welcome to Opian Bank
              </h2>
              <p className="text-xl text-slate-300">
                Your Gateway to the Future of Financial Innovation
              </p>
            </div>

            <p className="text-lg text-slate-400">
              Join the exclusive network of forward-thinking investors and institutions 
              shaping the future of AI-driven finance and technology.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold">Secure</h3>
                </div>
                <p className="text-sm text-slate-400">Bank-grade security for your investments</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold">Growth</h3>
                </div>
                <p className="text-sm text-slate-400">Exclusive investment opportunities</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold">Institutional</h3>
                </div>
                <p className="text-sm text-slate-400">Professional-grade platform</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold">Community</h3>
                </div>
                <p className="text-sm text-slate-400">Join elite investor network</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <Card className="bg-slate-800/50 border-cyan-500/30 backdrop-blur-sm" data-testid="access-form">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-400">Request Access</CardTitle>
              <CardDescription className="text-slate-400">
                Complete this form to access exclusive investment opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-500"
                      data-testid="input-firstName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-500"
                      data-testid="input-lastName"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-500"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-500"
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-300">Company (Optional)</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-500"
                    data-testid="input-company"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3"
                  data-testid="button-submit"
                >
                  Request Access to Ascendancy Project
                </Button>
              </form>

              <p className="text-xs text-slate-500 mt-4 text-center">
                By submitting this form, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-cyan-400">R50M+</p>
            <p className="text-sm text-slate-400">Assets Under Management</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-cyan-400">500+</p>
            <p className="text-sm text-slate-400">Active Investors</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-cyan-400">FSP Licensed</p>
            <p className="text-sm text-slate-400">Regulatory Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
