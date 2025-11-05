import { useState, useEffect } from "react";
import { TierSelection } from "@/components/tier-selection";
import { ShaderBackground } from "@/components/shader-background";
import { QuestProgression } from "@/components/quest-progression";
import { RewardsSection } from "@/components/rewards-section";
import { RiskProtocol } from "@/components/risk-protocol";
import { PaymentSection } from "@/components/payment-section";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/contexts/theme-provider";
import { useToast } from "@/hooks/use-toast";
import opianCapitalDark from "@assets/GetAttachmentThumbnail_1761219193395.png";
import opianCapitalLight from "@assets/GetAttachmentThumbnail_1761219213754.png";

export default function Landing() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle payment return from Adumo
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');

    if (paymentStatus) {
      switch (paymentStatus) {
        case 'success':
          toast({
            title: "Payment Successful! 🎉",
            description: `Your investment has been processed successfully. Reference: ${reference}. Welcome to the Ascendancy Project!`,
          });
          break;
        case 'failed':
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again or contact support.",
            variant: "destructive",
          });
          break;
        case 'error':
          toast({
            title: "Payment Error",
            description: "An error occurred during payment processing. Please contact support.",
            variant: "destructive",
          });
          break;
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const scrollToTiers = () => {
    const tiersSection = document.getElementById('tiers');
    if (tiersSection) {
      tiersSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleTierSelect = (tier: string) => {
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism" data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img 
                src={theme === 'dark' ? opianCapitalLight : opianCapitalDark} 
                alt="Opian Capital" 
                className="h-14 w-auto object-contain"
                data-testid="logo-image"
              />
            </div>
            <div className="hidden md:flex space-x-4 items-center">
              <ThemeToggle />
              <a href="/login" className="px-4 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-colors shadow-lg shadow-amber-500/20" data-testid="nav-login">
                Investor Login
              </a>
            </div>
            <div className="md:hidden flex space-x-4 items-center">
              <ThemeToggle />
              <a href="/login" className="px-4 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-colors shadow-lg shadow-amber-500/20" data-testid="nav-login">
                Investor Login
              </a>
            </div>
          </div>
        </div>
        
      </nav>

      <div className="pt-20">
        <TierSelection onTierSelect={handleTierSelect} />
      </div>

      <QuestProgression />

      <RewardsSection />

      <RiskProtocol />

      <PaymentSection 
        selectedTier={selectedTier}
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
      />

      {/* Footer */}
      <footer className="py-12 relative overflow-hidden bg-card border-t border-border" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 relative z-20">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src={theme === 'dark' ? opianCapitalLight : opianCapitalDark} 
                  alt="Opian Capital" 
                  className="h-24 w-auto object-contain"
                  data-testid="footer-logo-image"
                />
              </div>
              <p className="text-foreground/70 mb-6 leading-relaxed">
                Building generational wealth through disciplined investment strategies and proven partnership models. The Ascendancy Project represents a unique opportunity for discerning investors committed to long-term financial excellence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-primary hover:text-primary/80 transition-colors" data-testid="social-linkedin">
                  <i className="fab fa-linkedin text-xl"></i>
                </a>
                <a href="#" className="text-primary hover:text-primary/80 transition-colors" data-testid="social-twitter">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold text-lg mb-4 text-primary">Investment</h4>
              <div className="space-y-2 text-foreground/70">
                <a href="#tiers" className="block hover:text-primary transition-colors">Partnership Tiers</a>
                <a href="#rewards" className="block hover:text-primary transition-colors">Benefits & Returns</a>
                <a href="#progression" className="block hover:text-primary transition-colors">Investment Timeline</a>
                <a href="#briefing" className="block hover:text-primary transition-colors">Risk Disclosure</a>
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold text-lg mb-4 text-primary">Compliance & Legal</h4>
              <div className="space-y-2 text-foreground/70 text-sm">
                <p className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Licensed Financial Services Provider</span>
                </p>
                <p className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>FSP Regulatory Compliant</span>
                </p>
                <p className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Secure Payment Processing</span>
                </p>
                <a href="#" className="block hover:text-primary transition-colors mt-3">Terms & Conditions</a>
                <a href="#" className="block hover:text-primary transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-foreground/60 text-sm text-center md:text-left">
                © 2024 The Ascendancy Project by Opian Investment Partners. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-foreground/60">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  FSP Licensed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Regulatory Compliant
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Established 2013
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
