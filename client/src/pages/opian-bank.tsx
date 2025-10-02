import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Shield, TrendingUp, Users, Rocket, LineChart, Lock, CheckCircle } from "lucide-react";
import opianLogo from "@assets/opian-rewards-logo-blue_1758534360427.png";
import heroImage from "@assets/stock_images/modern_financial_inn_6ed59ff3.jpg";
import securityImage from "@assets/stock_images/modern_banking_secur_fe100f88.jpg";
import growthImage from "@assets/stock_images/investment_growth_fi_cf572972.jpg";
import platformImage from "@assets/stock_images/institutional_bankin_52a2b2e4.jpg";
import communityImage from "@assets/stock_images/professional_investo_030958aa.jpg";

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

  const scrollToForm = () => {
    const formSection = document.getElementById('access-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.setItem("opian_bank_access", "granted");
    sessionStorage.setItem("opian_user_info", JSON.stringify(formData));

    toast({
      title: "Access Granted! 🎉",
      description: "Welcome to Opian Bank. Redirecting you to the Ascendancy Project...",
    });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_50%)]"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-cyan-500/20 backdrop-blur-md bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src={opianLogo} 
                alt="Opian Bank" 
                className="h-10 w-auto object-contain"
                data-testid="bank-logo"
              />
              <div>
                <h1 className="text-xl font-bold text-cyan-400">Opian Bank</h1>
                <p className="text-xs text-cyan-300/70">Financial Innovation Redefined</p>
              </div>
            </div>
            <Button
              onClick={scrollToForm}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
              data-testid="nav-request-access"
            >
              Request Access
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                Welcome to Opian Bank
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 mb-6">
                Your Gateway to the Future of Financial Innovation
              </p>
              <p className="text-base text-slate-400 mb-8">
                Join the exclusive network of forward-thinking investors and institutions 
                shaping the future of AI-driven finance and technology.
              </p>
              <Button
                onClick={scrollToForm}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg px-8 py-6"
                data-testid="hero-cta"
              >
                Get Started Today
              </Button>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30">
                <img 
                  src={heroImage} 
                  alt="Modern Financial Innovation" 
                  className="w-full h-auto object-cover"
                  data-testid="hero-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Left Aligned */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <Shield className="h-12 w-12 text-cyan-400 mb-4" />
              </div>
              <h3 className="text-4xl font-bold text-cyan-400">Bank-Grade Security</h3>
              <p className="text-lg text-slate-300">
                Your investments are protected with institutional-grade security infrastructure. 
                We employ multi-layered encryption, secure custody solutions, and comply with 
                South African financial regulations.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">FSP Licensed and Regulatory Compliant</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Multi-Factor Authentication</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">End-to-End Encryption</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border border-cyan-500/30">
                <img 
                  src={securityImage} 
                  alt="Bank-Grade Security" 
                  className="w-full h-full object-cover"
                  data-testid="security-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 - Right Aligned */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <div className="aspect-square rounded-2xl overflow-hidden border border-blue-500/30">
                <img 
                  src={growthImage} 
                  alt="Investment Growth Analytics" 
                  className="w-full h-full object-cover"
                  data-testid="growth-image"
                />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="inline-block">
                <LineChart className="h-12 w-12 text-blue-400 mb-4" />
              </div>
              <h3 className="text-4xl font-bold text-blue-400">Exclusive Growth Opportunities</h3>
              <p className="text-lg text-slate-300">
                Access curated investment opportunities in AI, fintech, and emerging technologies. 
                Our portfolio is designed for sophisticated investors seeking high-growth potential 
                in transformative sectors.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">AI-Powered Investment Analytics</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Diversified Portfolio Management</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Real-Time Performance Tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 - Left Aligned */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <Building2 className="h-12 w-12 text-cyan-400 mb-4" />
              </div>
              <h3 className="text-4xl font-bold text-cyan-400">Institutional Platform</h3>
              <p className="text-lg text-slate-300">
                Built for professionals, our platform delivers enterprise-grade tools and analytics. 
                Whether you're an individual investor or managing institutional capital, we provide 
                the infrastructure you need.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Professional-Grade Dashboard</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Advanced Reporting Tools</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">API Access for Integration</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border border-cyan-500/30">
                <img 
                  src={platformImage} 
                  alt="Institutional Banking Platform" 
                  className="w-full h-full object-cover"
                  data-testid="platform-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 4 - Right Aligned */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <div className="aspect-square rounded-2xl overflow-hidden border border-blue-500/30">
                <img 
                  src={communityImage} 
                  alt="Professional Investor Community" 
                  className="w-full h-full object-cover"
                  data-testid="community-image"
                />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="inline-block">
                <Users className="h-12 w-12 text-blue-400 mb-4" />
              </div>
              <h3 className="text-4xl font-bold text-blue-400">Elite Investor Community</h3>
              <p className="text-lg text-slate-300">
                Connect with like-minded investors, industry leaders, and innovators. Our community 
                provides unparalleled networking opportunities and collaborative investment insights.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Exclusive Networking Events</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Direct Access to Fund Managers</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-slate-300">Collaborative Investment Opportunities</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-2">
              <p className="text-5xl font-bold text-cyan-400">R50M+</p>
              <p className="text-lg text-slate-400">Assets Under Management</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-bold text-cyan-400">500+</p>
              <p className="text-lg text-slate-400">Active Investors</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-bold text-cyan-400">FSP Licensed</p>
              <p className="text-lg text-slate-400">Regulatory Compliant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="access-form" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Rocket className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h3 className="text-4xl font-bold text-cyan-400 mb-4">Ready to Get Started?</h3>
            <p className="text-lg text-slate-300">
              Complete this form to access exclusive investment opportunities in the Ascendancy Project
            </p>
          </div>

          <Card className="bg-slate-800/80 border-cyan-500/30 backdrop-blur-sm" data-testid="access-form-card">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-400">Request Access</CardTitle>
              <CardDescription className="text-slate-400">
                Join the future of AI-driven financial innovation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
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
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
          <p>© 2024 Opian Bank. All rights reserved. FSP Licensed and Regulatory Compliant.</p>
        </div>
      </footer>
    </div>
  );
}
