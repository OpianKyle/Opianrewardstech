import { useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { TierSelection } from "@/components/tier-selection";
import { QuestProgression } from "@/components/quest-progression";
import { RewardsSection } from "@/components/rewards-section";
import { RiskProtocol } from "@/components/risk-protocol";
import { PaymentSection } from "@/components/payment-section";
import { useToast } from "@/hooks/use-toast";
import robot3d from "@assets/generated_images/3D_robot_mascot_logo_24aada45.png";

export default function Landing() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
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
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-white/60 dark:bg-black/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/30 text-foreground" data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src={robot3d} 
                alt="OPIAN 3D Robot" 
                width={40} 
                height={40} 
                className="h-10 w-10 rounded-xl ring-1 ring-border/50 shadow-lg shadow-primary/20 object-contain bg-white/5 dark:bg-white/10 transition-transform hover:scale-105" 
                data-testid="img-logo-3drobot" 
              />
              <span className="font-orbitron font-bold text-xl neon-text text-foreground dark:text-white">
                OPIAN REWARDS
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
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
            </div>
            <button className="md:hidden text-primary" data-testid="nav-mobile-menu">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </nav>

      <div id="hero">
        <HeroSection onScrollToTiers={scrollToTiers} />
      </div>

      <TierSelection onTierSelect={handleTierSelect} />

      <QuestProgression />

      <RewardsSection />

      <RiskProtocol />

      <PaymentSection />

      {/* Footer */}
      <footer className="py-12 bg-gradient-to-b from-background to-black/50" data-testid="footer">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={robot3d} 
                  alt="OPIAN 3D Robot" 
                  width={32} 
                  height={32} 
                  className="h-8 w-8 rounded-lg ring-1 ring-border/50 shadow-lg shadow-primary/20 object-contain bg-white/5 dark:bg-white/10" 
                  data-testid="img-footer-logo-3drobot" 
                />
                <span className="font-orbitron font-bold text-xl text-primary">OPIAN REWARDS</span>
              </div>
              <p className="text-muted-foreground mb-4">
                The future of AI and financial technology. Join the mission.
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

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © 2024 The Ascendancy Project. All rights reserved. 
              <span className="text-primary ml-1">Licensed FSP</span> • 
              <span className="text-accent ml-1">Future Ready</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
