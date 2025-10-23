import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, Users, ArrowRight, Award, CheckCircle2, Lock, BarChart3, Upload, Briefcase, Target, DollarSign } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import opianLogo from "@assets/opian-rewards-logo-blue_1758534360427.png";
import opianBankLogo from "@assets/Opian bank_1760685427396.png";
import heroImage from "@assets/generated_images/Classic_investment_banking_office_91d0af6c.png";
import wealthImage from "@assets/generated_images/Gold_and_wealth_management_681ca419.png";
import growthImage from "@assets/generated_images/Traditional_financial_growth_chart_fb6470a0.png";
import partnershipImage from "@assets/generated_images/Professional_business_partnership_handshake_3923f7e6.png";

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
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4zIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PC9zdmc+')] opacity-40" />
      </div>

      <nav className="fixed top-0 w-full z-50 border-b border-primary/20 backdrop-blur-xl bg-background/80">
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
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                onClick={scrollToForm}
                className="hidden md:inline-flex bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold border-0 shadow-lg shadow-amber-500/30"
                data-testid="nav-request-access"
              >
                Begin Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center pt-16 sm:pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 z-10">
              <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/30">
                <Award className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm text-primary">Established Investment Excellence</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
                <span className="text-foreground">
                  Preserving Wealth,
                </span>
                <br />
                <span className="text-primary">
                  Building Legacies
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                For over a decade, Opian Bank has been the trusted partner for discerning investors seeking sustainable growth and comprehensive wealth management solutions in South Africa's dynamic investment landscape.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-2xl shadow-amber-500/40 border-0"
                  data-testid="hero-cta"
                >
                  Request Consultation
                  <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/50 bg-primary/5 hover:bg-primary/15 text-primary font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
                  onClick={scrollToForm}
                >
                  Learn More
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 border-t border-border">
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">R50M+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Assets Under Management</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">500+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Satisfied Clients</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">FSP</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Licensed & Regulated</p>
                </div>
              </div>
            </div>

            <div className="relative h-64 sm:h-80 lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/10 blur-3xl" />
              <img 
                src={heroImage} 
                alt="Classic Investment Banking" 
                className="relative w-full h-full object-cover rounded-lg shadow-2xl border border-border"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section 
        className="parallax-banner relative h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${wealthImage})`,
        }}
      >
        <div className="absolute inset-0 bg-white/80 dark:bg-black/70" />
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary mb-6">
            Excellence in Wealth Management
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed">
            "Your financial success is our legacy. We combine traditional values with modern strategies to deliver exceptional results for our investors."
          </p>
          <div className="mt-8 flex items-center justify-center space-x-4">
            <div className="h-1 w-12 bg-primary"></div>
            <span className="text-primary font-semibold">Since 2013</span>
            <div className="h-1 w-12 bg-primary"></div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 sm:mb-6 text-primary">
              Comprehensive Investment Services
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Tailored solutions designed to meet the unique needs of every investor, from wealth preservation to aggressive growth strategies
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="bg-card border-primary/30 hover:border-primary/60 transition-all duration-300 group" data-testid="wealth-card">
              <CardHeader>
                <div className="w-full h-40 sm:h-48 mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/10">
                  <img 
                    src={wealthImage} 
                    alt="Wealth Management" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    data-testid="wealth-image"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-primary/20">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-card-foreground">Wealth Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                  Personalized portfolio management strategies designed to preserve and grow your wealth across generations.
                </CardDescription>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Diversified Portfolio Management</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Tax Optimization Strategies</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Estate Planning Support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/30 hover:border-primary/60 transition-all duration-300 group" data-testid="growth-card">
              <CardHeader>
                <div className="w-full h-40 sm:h-48 mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/10">
                  <img 
                    src={growthImage} 
                    alt="Investment Growth" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    data-testid="growth-image"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-primary/20">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-card-foreground">Strategic Growth</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                  Carefully curated investment opportunities across diverse sectors including technology, property, and emerging markets.
                </CardDescription>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Alternative Investment Access</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Real Estate Opportunities</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Venture Capital Partnerships</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/30 hover:border-primary/60 transition-all duration-300 group sm:col-span-2 lg:col-span-1" data-testid="advisory-card">
              <CardHeader>
                <div className="w-full h-40 sm:h-48 mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/10">
                  <img 
                    src={partnershipImage} 
                    alt="Investment Advisory" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    data-testid="advisory-image"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-primary/20">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-card-foreground">Expert Advisory</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                  Dedicated financial advisors with decades of combined experience guiding your investment decisions.
                </CardDescription>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Personal Account Managers</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Quarterly Performance Reviews</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm sm:text-base text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span>Market Insights & Research</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 sm:mb-6 text-primary">
              Why Investors Choose Opian
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Our commitment to excellence, transparency, and results has made us a preferred partner for serious investors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">Regulatory Compliance</h3>
              <p className="text-muted-foreground text-sm">FSP licensed and fully compliant with South African financial regulations</p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">Proven Track Record</h3>
              <p className="text-muted-foreground text-sm">Consistent returns and portfolio growth over 10+ years of operation</p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">Tailored Solutions</h3>
              <p className="text-muted-foreground text-sm">Custom investment strategies aligned with your unique financial goals</p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border border-border">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">Client-First Approach</h3>
              <p className="text-muted-foreground text-sm">Dedicated support and transparent communication at every step</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20 border border-primary/30 p-8 sm:p-12 md:p-16">
            <div className="relative text-center space-y-6 sm:space-y-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold px-2">
                <span className="text-card-foreground">
                  Ready to Build Your Financial Future?
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-card-foreground max-w-3xl mx-auto px-2">
                Join the Ascendancy Project and gain exclusive access to premium investment opportunities, expert portfolio management, and a community of successful investors shaping South Africa's financial landscape.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">No minimum investment required to start</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">Flexible portfolio options</span>
                </div>
              </div>
              <Button
                onClick={scrollToForm}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-base sm:text-lg lg:text-xl px-8 sm:px-10 lg:px-12 py-6 sm:py-7 shadow-2xl shadow-amber-500/40 border-0"
              >
                Schedule Your Consultation
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="access-form" className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/20 border border-primary/30 mb-4 sm:mb-6">
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-3 sm:mb-4 text-primary">
              Begin Your Investment Journey
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              Complete this form to schedule a confidential consultation with one of our senior investment advisors
            </p>
          </div>

          <Card className="bg-card border-primary/30 backdrop-blur-xl" data-testid="access-form-card">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-primary">Consultation Request</CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground">
                Join hundreds of satisfied investors in the Ascendancy Project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm sm:text-base text-foreground">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                      data-testid="input-firstName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm sm:text-base text-foreground">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                      data-testid="input-lastName"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base text-foreground">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base text-foreground">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm sm:text-base text-foreground">Company (Optional)</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                    data-testid="input-company"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-lg font-semibold text-primary mb-4">Address Information</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="streetAddress" className="text-sm sm:text-base text-foreground">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        name="streetAddress"
                        value={formData.streetAddress}
                        onChange={handleChange}
                        required
                        className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                        data-testid="input-streetAddress"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm sm:text-base text-foreground">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                          data-testid="input-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province" className="text-sm sm:text-base text-foreground">Province/State *</Label>
                        <Input
                          id="province"
                          name="province"
                          value={formData.province}
                          onChange={handleChange}
                          required
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                          data-testid="input-province"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm sm:text-base text-foreground">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          required
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                          data-testid="input-postalCode"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm sm:text-base text-foreground">Country *</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11"
                          data-testid="input-country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label htmlFor="ficaDocuments" className="text-sm sm:text-base text-foreground">
                      FICA Documents (Optional)
                    </Label>
                    <p className="text-xs text-foreground/60 mb-2">Upload ID, proof of address, or other verification documents</p>
                    <div className="relative">
                      <Input
                        id="ficaDocuments"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-10 sm:h-11 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-amber-500/30"
                        data-testid="input-ficaDocuments"
                      />
                      <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/50 pointer-events-none" />
                    </div>
                    {ficaFiles.length > 0 && (
                      <p className="text-xs text-primary mt-1">
                        {ficaFiles.length} file{ficaFiles.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptedTerms"
                      checked={formData.acceptedTerms}
                      onCheckedChange={handleCheckboxChange("acceptedTerms")}
                      className="mt-1 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="acceptedTerms" className="text-sm text-foreground cursor-pointer leading-relaxed">
                      I accept the <span className="text-primary underline">Terms & Conditions</span> *
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptedPrivacy"
                      checked={formData.acceptedPrivacy}
                      onCheckedChange={handleCheckboxChange("acceptedPrivacy")}
                      className="mt-1 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      data-testid="checkbox-privacy"
                    />
                    <Label htmlFor="acceptedPrivacy" className="text-sm text-foreground cursor-pointer leading-relaxed">
                      I accept the <span className="text-primary underline">Privacy Policy</span> *
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold py-5 sm:py-6 text-base sm:text-lg shadow-lg shadow-amber-500/30 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Submitting..." : "Request Access to Ascendancy Project"}
                  <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                </Button>
              </form>

              <p className="text-xs text-foreground/60 mt-4 sm:mt-6 text-center px-2">
                By submitting this form, you agree to our terms and conditions. Your data is secured with industry-standard encryption. A senior advisor will contact you within 24-48 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="relative py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
              <img 
                src={opianLogo} 
                alt="Opian Bank" 
                className="h-6 sm:h-8 w-auto object-contain opacity-70"
              />
              <div className="text-xs sm:text-sm text-foreground/60">
                © 2024 Opian Bank. FSP Licensed & Regulatory Compliant. All Rights Reserved.
              </div>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-foreground/60">
              <span className="hover:text-primary cursor-pointer transition">Privacy Policy</span>
              <span className="hover:text-primary cursor-pointer transition">Terms of Service</span>
              <span className="hover:text-primary cursor-pointer transition">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
