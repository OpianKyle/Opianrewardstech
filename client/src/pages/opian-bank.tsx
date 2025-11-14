import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Lock, Upload } from "lucide-react";
import { useTheme } from "@/contexts/theme-provider";
import { apiRequest } from "@/lib/queryClient";
import opianCapitalDark from "@assets/GetAttachmentThumbnail_1761219193395.png";
import opianCapitalLight from "@assets/GetAttachmentThumbnail_1761219213754.png";
import heroImage from "@assets/stock_images/sophisticated_modern_786a3bb0.jpg";

export default function OpianBank() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
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
      <nav className="fixed top-0 w-full z-50 border-b border-primary/20 bg-white shadow-sm dark:bg-zinc-900/95 dark:backdrop-blur-xl dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={theme === 'dark' ? opianCapitalLight : opianCapitalDark} 
                alt="Opian Capital" 
                className="h-10 sm:h-12 md:h-16 w-auto object-contain"
                data-testid="bank-logo"
              />
            </div>
          </div>
        </div>
      </nav>

      <section 
        id="access-form" 
        className="relative min-h-screen flex items-center py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 dark:from-black/80 dark:via-black/70 dark:to-black/80"></div>
        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/20 border border-primary/30 mb-4 sm:mb-6">
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-3 sm:mb-4 text-white dark:text-primary">
              Begin Your Investment Journey
            </h3>
            <p className="text-base sm:text-lg text-white/90 dark:text-muted-foreground px-4">
              Complete this form to schedule a confidential consultation with one of our senior investment advisors
            </p>
          </div>

          <Card className="bg-card/95 dark:bg-card/90 border-primary/30 backdrop-blur-xl shadow-2xl" data-testid="access-form-card">
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
                      className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                      className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                    className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                    className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                    className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                        className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                          className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12"
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
                        className="bg-input border-border text-card-foreground focus:border-primary focus:ring-primary/20 h-11 sm:h-12 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80"
                        data-testid="input-ficaDocuments"
                      />
                      <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {ficaFiles.length > 0 && (
                      <p className="text-xs text-primary mt-1">
                        {ficaFiles.length} file{ficaFiles.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3 sm:space-y-4">
                  <label htmlFor="acceptedTerms" className="flex items-center min-h-[44px] cursor-pointer group">
                    <Checkbox
                      id="acceptedTerms"
                      checked={formData.acceptedTerms}
                      onCheckedChange={handleCheckboxChange("acceptedTerms")}
                      className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      data-testid="checkbox-terms"
                    />
                    <span className="text-sm sm:text-base text-foreground leading-relaxed">
                      I accept the <span className="text-primary underline">Terms & Conditions</span> *
                    </span>
                  </label>

                  <label htmlFor="acceptedPrivacy" className="flex items-center min-h-[44px] cursor-pointer group">
                    <Checkbox
                      id="acceptedPrivacy"
                      checked={formData.acceptedPrivacy}
                      onCheckedChange={handleCheckboxChange("acceptedPrivacy")}
                      className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      data-testid="checkbox-privacy"
                    />
                    <span className="text-sm sm:text-base text-foreground leading-relaxed">
                      I accept the <span className="text-primary underline">Privacy Policy</span> *
                    </span>
                  </label>
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
    </div>
  );
}
