import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Award, Shield } from "lucide-react";
import heroImage from "@assets/generated_images/Classic_investment_banking_office_91d0af6c.png";

interface HeroSectionProps {
  onScrollToTiers: () => void;
}

export function HeroSection({ onScrollToTiers }: HeroSectionProps) {
  const scrollToContact = () => {
    window.location.href = '/opian-bank#access-form';
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-primary/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>
      
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-8 text-center lg:text-left"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Exclusive Investment Partnership</span>
            </div>

            <div>
              <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-foreground leading-tight">
                THE ASCENDANCY<br />
                <span className="text-primary">PROJECT</span>
              </h1>
              <p className="text-xl sm:text-2xl font-semibold text-primary mb-4">
                Build Wealth. Secure Legacy. Claim Your Position.
              </p>
              <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto lg:mx-0">
                Join an exclusive circle of discerning investors committed to sustainable growth through strategic partnerships in South Africa's most promising ventures.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={onScrollToTiers}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-lg px-10 py-6 shadow-2xl shadow-amber-500/40"
                data-testid="button-press-start"
              >
                EXPLORE TIERS
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                <Shield className="h-4 w-4" />
                <span>FSP Licensed • Regulatory Compliant</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-primary/30">
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-primary">R50M+</p>
                <p className="text-xs text-foreground/70">Portfolio Value</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-primary">500+</p>
                <p className="text-xs text-foreground/70">Partners</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-primary">10Y</p>
                <p className="text-xs text-foreground/70">Track Record</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative h-96 lg:h-[600px] hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="relative w-full h-full group">
              <img 
                src={heroImage} 
                alt="Investment Excellence" 
                className="w-full h-full object-cover rounded-lg shadow-2xl border border-primary/20"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg flex items-end justify-center pb-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  onClick={scrollToContact}
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-lg px-10 py-6 shadow-2xl shadow-amber-500/60"
                  data-testid="button-contact-from-hero"
                >
                  Request Consultation
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full"
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute top-3/4 right-1/4 w-1 h-1 bg-primary rounded-full"
          animate={{ 
            opacity: [0.5, 1, 0.5],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 4,
            delay: 1,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-primary rounded-full"
          animate={{ 
            opacity: [0.4, 1, 0.4],
            x: [0, 15, 0]
          }}
          transition={{ 
            duration: 5,
            delay: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
    </section>
  );
}
