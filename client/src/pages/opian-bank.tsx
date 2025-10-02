import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, Users, ArrowRight, Sparkles, CheckCircle2, Lock, BarChart3 } from "lucide-react";
import opianLogo from "@assets/opian-rewards-logo-blue_1758534360427.png";
import heroImage from "@assets/generated_images/Futuristic_financial_technology_hero_b9e18dc0.png";
import securityImage from "@assets/generated_images/Digital_security_shield_visualization_c6d91e21.png";
import growthImage from "@assets/generated_images/Financial_growth_data_visualization_42860af4.png";
import networkImage from "@assets/generated_images/Professional_network_visualization_b8426efe.png";

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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/10" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src={opianLogo} 
                alt="Opian Bank" 
                className="h-12 w-auto object-contain"
                data-testid="bank-logo"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Opian Bank</h1>
                <p className="text-xs text-slate-400">Financial Innovation Redefined</p>
              </div>
            </div>
            <Button
              onClick={scrollToForm}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold border-0 shadow-lg shadow-cyan-500/20"
              data-testid="nav-request-access"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 z-10">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-cyan-300">AI-Powered Banking Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                  The Future of
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  Financial Innovation
                </span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                Join the exclusive network of forward-thinking investors and institutions 
                shaping the future of AI-driven finance and technology.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg px-8 py-6 shadow-2xl shadow-cyan-500/30 border-0"
                  data-testid="hero-cta"
                >
                  Request Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 font-semibold text-lg px-8 py-6"
                  onClick={scrollToForm}
                >
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-bold text-cyan-400">R50M+</p>
                  <p className="text-sm text-slate-500">Assets Managed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-cyan-400">500+</p>
                  <p className="text-sm text-slate-500">Active Investors</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-cyan-400">FSP</p>
                  <p className="text-sm text-slate-500">Licensed</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl" />
              <img 
                src={heroImage} 
                alt="Futuristic Banking Technology" 
                className="relative w-full h-full object-contain drop-shadow-2xl"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Enterprise-Grade Banking
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built for the future with institutional-grade security and AI-powered insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Security Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group" data-testid="security-card">
              <CardHeader>
                <div className="w-full h-48 mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                  <img 
                    src={securityImage} 
                    alt="Bank-Grade Security" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    data-testid="security-image"
                  />
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-lg bg-cyan-500/10">
                    <Shield className="h-6 w-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">Bank-Grade Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-base mb-6">
                  Military-grade encryption and multi-layered security infrastructure protecting your investments 24/7.
                </CardDescription>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <span>End-to-End Encryption</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <span>Multi-Factor Authentication</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <span>FSP Regulatory Compliance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Growth Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group" data-testid="growth-card">
              <CardHeader>
                <div className="w-full h-48 mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <img 
                    src={growthImage} 
                    alt="Investment Growth" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    data-testid="growth-image"
                  />
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">AI-Powered Growth</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-base mb-6">
                  Leverage artificial intelligence for superior investment insights and portfolio optimization.
                </CardDescription>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span>Predictive Analytics</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span>Real-Time Performance</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span>Smart Portfolio Management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Network Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group" data-testid="network-card">
              <CardHeader>
                <div className="w-full h-48 mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                  <img 
                    src={networkImage} 
                    alt="Professional Network" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    data-testid="network-image"
                  />
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-lg bg-cyan-500/10">
                    <Users className="h-6 w-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">Elite Network</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-base mb-6">
                  Connect with industry leaders and innovative investors in our exclusive community.
                </CardDescription>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <span>Exclusive Events</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <span>Expert Fund Managers</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <span>Collaborative Opportunities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 p-12 md:p-16">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzIyZDNlZSIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
            <div className="relative text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  Ready to Transform Your Financial Future?
                </span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Join the Ascendancy Project and gain access to exclusive investment opportunities in AI and emerging technologies.
              </p>
              <Button
                onClick={scrollToForm}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xl px-12 py-7 shadow-2xl shadow-cyan-500/30 border-0"
              >
                Request Access Now
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="access-form" className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-6">
              <Lock className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Secure Your Access
            </h3>
            <p className="text-lg text-slate-400">
              Complete the form below to join the Ascendancy Project
            </p>
          </div>

          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-cyan-500/20 backdrop-blur-xl" data-testid="access-form-card">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-400">Request Access</CardTitle>
              <CardDescription className="text-slate-400">
                Join the future of AI-driven financial innovation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
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
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
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
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
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
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
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
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
                    data-testid="input-company"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-6 text-lg shadow-lg shadow-cyan-500/20 border-0"
                  data-testid="button-submit"
                >
                  Request Access to Ascendancy Project
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>

              <p className="text-xs text-slate-500 mt-6 text-center">
                By submitting this form, you agree to our terms and conditions. Your data is secured with bank-grade encryption.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img 
                src={opianLogo} 
                alt="Opian Bank" 
                className="h-8 w-auto object-contain opacity-70"
              />
              <div className="text-sm text-slate-500">
                © 2024 Opian Bank. FSP Licensed & Regulatory Compliant.
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
