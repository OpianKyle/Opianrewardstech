import { useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { TierSelection } from "@/components/tier-selection";
import { ShaderBackground } from "@/components/shader-background";
import { QuestProgression } from "@/components/quest-progression";
import { RewardsSection } from "@/components/rewards-section";
import { RiskProtocol } from "@/components/risk-protocol";
import { PaymentSection } from "@/components/payment-section";
import { useToast } from "@/hooks/use-toast";
import opianLogo from "@assets/opian-rewards-logo-blue_1758534360427.png";
import wealthImage from "@assets/generated_images/Gold_and_wealth_management_681ca419.png";

export default function Landing() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

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
                src={opianLogo} 
                alt="Opian Rewards" 
                className="h-10 w-auto object-contain"
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
      <footer className="py-12 relative overflow-hidden" data-testid="footer">
        <ShaderBackground className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-black/80 pointer-events-none z-10"></div>
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-10"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src={opianLogo} 
                  alt="Opian Rewards" 
                  className="h-10 w-auto object-contain"
                  data-testid="footer-logo-image"
                />
              </div>
              <p className="text-amber-200/70 mb-4">
                Building legacies through strategic investment partnerships and proven wealth management excellence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-twitter">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-linkedin">
                  <i className="fab fa-linkedin text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-telegram">
                  <i className="fab fa-telegram text-xl"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-orbitron font-bold text-lg mb-4 text-foreground">Mission Control</h4>
              <div className="space-y-2 text-muted-foreground">
                <a href="#tiers" className="block hover:text-primary transition-colors">Player Tiers</a>
                <a href="#rewards" className="block hover:text-primary transition-colors">Rewards System</a>
                <a href="#briefing" className="block hover:text-primary transition-colors">Risk Protocol</a>
                <a href="#" className="block hover:text-primary transition-colors">Mission Brief</a>
              </div>
            </div>

            <div>
              <h4 className="font-orbitron font-bold text-lg mb-4 text-foreground">Legal & Compliance</h4>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>Licensed Financial Services Provider</p>
                <p>Regulatory Compliant Operations</p>
                <p>Secure Adumo Payment Processing</p>
                <a href="#" className="block hover:text-primary transition-colors">Terms & Conditions</a>
                <a href="#" className="block hover:text-primary transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="border-t border-amber-500/30 mt-8 pt-8 text-center">
            <p className="text-amber-200/60 text-sm">
              © 2024 The Ascendancy Project. All rights reserved. 
              <span className="text-amber-400 ml-1">Licensed FSP</span> • 
              <span className="text-amber-300 ml-1">Regulatory Compliant</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
