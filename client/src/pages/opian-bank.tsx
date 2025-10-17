import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, Users, ArrowRight, Sparkles, CheckCircle2, Lock, BarChart3, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import opianLogo from "@assets/opian-rewards-logo-blue_1758534360427.png";
import opianBankLogo from "@assets/Opian bank_1760685427396.png";
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
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    country: "South Africa",
    acceptedTerms: false,
    acceptedPrivacy: false,
  });
  const [ficaFiles, setFicaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToForm = () => {
    const formSection = document.getElementById('access-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone ||
        !formData.streetAddress || !formData.city || !formData.province || !formData.postalCode || !formData.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptedTerms || !formData.acceptedPrivacy) {
      toast({
        title: "Agreement Required",
        description: "Please accept the Terms & Conditions and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert files to base64 if any
      const ficaDocuments = ficaFiles.length > 0 ? await Promise.all(
        ficaFiles.map(file => new Promise<{ name: string; data: string; type: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            name: file.name,
            data: reader.result as string,
            type: file.type
          });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      ) : null;

      const requestData = {
        ...formData,
        acceptedTerms: formData.acceptedTerms ? 1 : 0,
        acceptedPrivacy: formData.acceptedPrivacy ? 1 : 0,
        ficaDocuments
      };

      await apiRequest("POST", "/api/access-requests", requestData);

      sessionStorage.setItem("opian_bank_access", "granted");
      sessionStorage.setItem("opian_user_info", JSON.stringify(formData));

      toast({
        title: "Access Request Submitted! 🎉",
        description: "Thank you for your interest. We'll be in touch soon. Redirecting you to the Ascendancy Project...",
      });

      setTimeout(() => {
        setLocation("/ascendancy");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFicaFiles(Array.from(e.target.files));
    }
  };

  const handleCheckboxChange = (field: "acceptedTerms" | "acceptedPrivacy") => (checked: boolean) => {
    setFormData({
      ...formData,
      [field]: checked,
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
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={opianBankLogo} 
                alt="Opian Bank" 
                className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                data-testid="bank-logo"
              />
            </div>
            <Button
              onClick={scrollToForm}
              className="hidden md:inline-flex bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold border-0 shadow-lg shadow-cyan-500/20"
              data-testid="nav-request-access"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center pt-16 sm:pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8 z-10">
              <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <Sparkles className="h-3 sm:h-4 w-3 sm:w-4 text-cyan-400" />
                <span className="text-xs sm:text-sm text-cyan-300">AI-Powered Banking Platform</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                  The Future of
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  Financial Innovation
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl leading-relaxed">
                Join the exclusive network of forward-thinking investors and institutions 
                shaping the future of AI-driven finance and technology.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-2xl shadow-cyan-500/30 border-0"
                  data-testid="hero-cta"
                >
                  Request Access
                  <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
                  onClick={scrollToForm}
                >
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 border-t border-white/10">
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400">R50M+</p>
                  <p className="text-xs sm:text-sm text-slate-500">Assets Managed</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400">500+</p>
                  <p className="text-xs sm:text-sm text-slate-500">Active Investors</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400">FSP</p>
                  <p className="text-xs sm:text-sm text-slate-500">Licensed</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-64 sm:h-80 lg:h-[600px] flex items-center justify-center">
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
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Enterprise-Grade Banking
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto px-4">
              Built for the future with institutional-grade security and AI-powered insights
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Security Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group" data-testid="security-card">
              <CardHeader>
                <div className="w-full h-40 sm:h-48 mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                  <img 
                    src={securityImage} 
                    alt="Bank-Grade Security" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    data-testid="security-image"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-cyan-500/10">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white">Bank-Grade Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6">
                  Military-grade encryption and multi-layered security infrastructure protecting your investments 24/7.
                </CardDescription>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                    <span>End-to-End Encryption</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                    <span>Multi-Factor Authentication</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                    <span>FSP Regulatory Compliance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Growth Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group" data-testid="growth-card">
              <CardHeader>
                <div className="w-full h-40 sm:h-48 mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <img 
                    src={growthImage} 
                    alt="Investment Growth" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    data-testid="growth-image"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white">AI-Powered Growth</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6">
                  Leverage artificial intelligence for superior investment insights and portfolio optimization.
                </CardDescription>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0" />
                    <span>Predictive Analytics</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0" />
                    <span>Real-Time Performance</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0" />
                    <span>Smart Portfolio Management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Network Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group sm:col-span-2 lg:col-span-1" data-testid="network-card">
              <CardHeader>
                <div className="w-full h-40 sm:h-48 mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                  <img 
                    src={networkImage} 
                    alt="Professional Network" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    data-testid="network-image"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-cyan-500/10">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white">Elite Network</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6">
                  Connect with industry leaders and innovative investors in our exclusive community.
                </CardDescription>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                    <span>Exclusive Events</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                    <span>Expert Fund Managers</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-slate-300">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                    <span>Collaborative Opportunities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 p-8 sm:p-12 md:p-16">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzIyZDNlZSIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
            <div className="relative text-center space-y-6 sm:space-y-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  Ready to Transform Your Financial Future?
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto px-2">
                Join the Ascendancy Project and gain access to exclusive investment opportunities in AI and emerging technologies.
              </p>
              <Button
                onClick={scrollToForm}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base sm:text-lg lg:text-xl px-8 sm:px-10 lg:px-12 py-6 sm:py-7 shadow-2xl shadow-cyan-500/30 border-0"
              >
                Request Access Now
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="access-form" className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-4 sm:mb-6">
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Secure Your Access
            </h3>
            <p className="text-base sm:text-lg text-slate-400 px-4">
              Complete the form below to join the Ascendancy Project
            </p>
          </div>

          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-cyan-500/20 backdrop-blur-xl" data-testid="access-form-card">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-cyan-400">Request Access</CardTitle>
              <CardDescription className="text-sm sm:text-base text-slate-400">
                Join the future of AI-driven financial innovation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm sm:text-base text-slate-300">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                      data-testid="input-firstName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm sm:text-base text-slate-300">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                      data-testid="input-lastName"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base text-slate-300">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base text-slate-300">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm sm:text-base text-slate-300">Company (Optional)</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                    data-testid="input-company"
                  />
                </div>

                {/* Address Section */}
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-lg font-semibold text-cyan-400 mb-4">Address Information</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="streetAddress" className="text-sm sm:text-base text-slate-300">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        name="streetAddress"
                        value={formData.streetAddress}
                        onChange={handleChange}
                        required
                        className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                        data-testid="input-streetAddress"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm sm:text-base text-slate-300">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                          data-testid="input-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province" className="text-sm sm:text-base text-slate-300">Province/State *</Label>
                        <Input
                          id="province"
                          name="province"
                          value={formData.province}
                          onChange={handleChange}
                          required
                          className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                          data-testid="input-province"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm sm:text-base text-slate-300">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          required
                          className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                          data-testid="input-postalCode"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm sm:text-base text-slate-300">Country *</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11"
                          data-testid="input-country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* FICA Documents Upload */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="space-y-2">
                    <Label htmlFor="ficaDocuments" className="text-sm sm:text-base text-slate-300">
                      FICA Documents (Optional)
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">Upload ID, proof of address, or other verification documents</p>
                    <div className="relative">
                      <Input
                        id="ficaDocuments"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20 h-10 sm:h-11 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                        data-testid="input-ficaDocuments"
                      />
                      <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                    {ficaFiles.length > 0 && (
                      <p className="text-xs text-cyan-400 mt-1">
                        {ficaFiles.length} file{ficaFiles.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms and Privacy Checkboxes */}
                <div className="pt-4 border-t border-slate-700 space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptedTerms"
                      checked={formData.acceptedTerms}
                      onCheckedChange={handleCheckboxChange("acceptedTerms")}
                      className="mt-1 border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="acceptedTerms" className="text-sm text-slate-300 cursor-pointer leading-relaxed">
                      I accept the <span className="text-cyan-400 underline">Terms & Conditions</span> *
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptedPrivacy"
                      checked={formData.acceptedPrivacy}
                      onCheckedChange={handleCheckboxChange("acceptedPrivacy")}
                      className="mt-1 border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      data-testid="checkbox-privacy"
                    />
                    <Label htmlFor="acceptedPrivacy" className="text-sm text-slate-300 cursor-pointer leading-relaxed">
                      I accept the <span className="text-cyan-400 underline">Privacy Policy</span> *
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-5 sm:py-6 text-base sm:text-lg shadow-lg shadow-cyan-500/20 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Submitting..." : "Request Access to Ascendancy Project"}
                  <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                </Button>
              </form>

              <p className="text-xs text-slate-500 mt-4 sm:mt-6 text-center px-2">
                By submitting this form, you agree to our terms and conditions. Your data is secured with bank-grade encryption.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
              <img 
                src={opianLogo} 
                alt="Opian Bank" 
                className="h-6 sm:h-8 w-auto object-contain opacity-70"
              />
              <div className="text-xs sm:text-sm text-slate-500">
                © 2024 Opian Bank. FSP Licensed & Regulatory Compliant.
              </div>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-slate-500">
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
