import { useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
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
import wealthImage from "@assets/generated_images/Gold_and_wealth_management_681ca419.png";

export default function Landing() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
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
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#hero" className="hover:text-primary transition-colors" data-testid="nav-mission">
                Mission
              </a>
              <a href="#tiers" className="hover:text-primary transition-colors" data-testid="nav-tiers">
                Tiers
              </a>
              <a href="#rewards" className="hover:text-primary transition-colors" data-testid="nav-rewards">
                Rewards
              </a>
              <a href="#briefing" className="hover:text-primary transition-colors" data-testid="nav-protocol">
                Protocol
              </a>
              <ThemeToggle />
              <a href="/login" className="px-4 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-colors shadow-lg shadow-amber-500/20" data-testid="nav-login">
                Investor Login
              </a>
            </div>
            <button 
              className="md:hidden text-primary" 
              onClick={toggleMobileMenu}
              data-testid="nav-mobile-menu"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden bg-background/95 backdrop-blur-sm border-t border-primary/20`}>
          <div className="px-4 py-6 space-y-4">
            <a 
              href="#hero" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={closeMobileMenu}
              data-testid="mobile-nav-mission"
            >
              Mission
            </a>
            <a 
              href="#tiers" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={closeMobileMenu}
              data-testid="mobile-nav-tiers"
            >
              Tiers
            </a>
            <a 
              href="#rewards" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={closeMobileMenu}
              data-testid="mobile-nav-rewards"
            >
              Rewards
            </a>
            <a 
              href="#briefing" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={closeMobileMenu}
              data-testid="mobile-nav-protocol"
            >
              Protocol
            </a>
            <div className="py-2">
              <ThemeToggle />
            </div>
            <a 
              href="/login" 
              className="block px-4 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold transition-colors text-center shadow-lg shadow-amber-500/20"
              onClick={closeMobileMenu}
              data-testid="mobile-nav-login"
            >
              Investor Login
            </a>
          </div>
        </div>
      </nav>

      <div id="hero">
        <HeroSection onScrollToTiers={scrollToTiers} />
      </div>

      <section 
        className="parallax-banner relative h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${wealthImage})`,
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-amber-400 mb-6">
            Strategic Investment Excellence
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-amber-100/90 leading-relaxed">
            "Building generational wealth through disciplined investment strategies and proven partnership models. Your success is our commitment."
          </p>
          <div className="mt-8 flex items-center justify-center space-x-4">
            <div className="h-1 w-12 bg-amber-400"></div>
            <span className="text-amber-400 font-semibold">Trusted Since 2013</span>
            <div className="h-1 w-12 bg-amber-400"></div>
          </div>
        </div>
      </section>

      <TierSelection onTierSelect={handleTierSelect} />

      <QuestProgression />

      <RewardsSection />

      <RiskProtocol />

      <PaymentSection 
        selectedTier={selectedTier}
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
      />

      {/* Footer */}
      <footer className="py-12 relative overflow-hidden bg-gradient-to-b from-black to-zinc-950" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 relative z-20">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src={theme === 'dark' ? opianCapitalLight : opianCapitalDark} 
                  alt="Opian Capital" 
                  className="h-14 w-auto object-contain"
                  data-testid="footer-logo-image"
                />
              </div>
              <p className="text-amber-200/70 mb-6 leading-relaxed">
                Building generational wealth through disciplined investment strategies and proven partnership models. The Ascendancy Project represents a unique opportunity for discerning investors committed to long-term financial excellence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors" data-testid="social-linkedin">
                  <i className="fab fa-linkedin text-xl"></i>
                </a>
                <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors" data-testid="social-twitter">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold text-lg mb-4 text-amber-400">Investment</h4>
              <div className="space-y-2 text-amber-200/70">
                <a href="#tiers" className="block hover:text-amber-300 transition-colors">Partnership Tiers</a>
                <a href="#rewards" className="block hover:text-amber-300 transition-colors">Benefits & Returns</a>
                <a href="#progression" className="block hover:text-amber-300 transition-colors">Investment Timeline</a>
                <a href="#briefing" className="block hover:text-amber-300 transition-colors">Risk Disclosure</a>
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold text-lg mb-4 text-amber-400">Compliance & Legal</h4>
              <div className="space-y-2 text-amber-200/70 text-sm">
                <p className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span>Licensed Financial Services Provider</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span>FSP Regulatory Compliant</span>
                </p>
                <p className="flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  <span>Secure Payment Processing</span>
                </p>
                <a href="#" className="block hover:text-amber-300 transition-colors mt-3">Terms & Conditions</a>
                <a href="#" className="block hover:text-amber-300 transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="border-t border-amber-500/30 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-amber-200/60 text-sm text-center md:text-left">
                © 2024 The Ascendancy Project by Opian Investment Partners. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-amber-200/60">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  FSP Licensed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  Regulatory Compliant
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
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
