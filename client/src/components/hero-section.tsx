import { motion } from "framer-motion";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ShaderBackground } from "./shader-background";

interface HeroSectionProps {
  onScrollToTiers: () => void;
}

export function HeroSection({ onScrollToTiers }: HeroSectionProps) {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <ShaderBackground className="opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/60 pointer-events-none z-10"></div>
      
      <div className="relative z-30 max-w-6xl mx-auto px-4 text-center">
        

        <motion.div 
          className="space-y-8"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div>
            <h1 className="font-orbitron font-black text-5xl md:text-7xl mb-6 neon-text text-primary leading-tight">
              THE ASCENDANCY<br />PROJECT
            </h1>
            <p className="text-xl md:text-2xl font-orbitron font-bold text-accent mb-4">
              Join the Mission. Build the Future. Claim Your Tier.
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This isn't an investment. It's an upgrade. Step into the game and become part of something transformative.
            </p>
          </div>

          <div className="space-y-4">
            <AnimatedButton
              onClick={onScrollToTiers}
              className="px-12 py-4 bg-primary text-primary-foreground font-orbitron font-bold text-xl rounded-lg"
              data-testid="button-press-start"
            >
              <span className="relative z-10">PRESS START</span>
            </AnimatedButton>
            
            <p className="text-sm text-muted-foreground">
              <i className="fas fa-shield-alt mr-2"></i>
              Licensed FSP • Regulatory Compliant • Future-Ready
            </p>
          </div>
        </motion.div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full"
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary rounded-full"
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
          className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-accent rounded-full"
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
