import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedButton } from "./animated-button";
import { cn } from "@/lib/utils";

interface TierCardProps {
  tier: {
    name: string;
    subtitle: string;
    icon: string;
    popular?: boolean;
    pricing: {
      lump_sum: number;
      deposit: number | null;
      monthly_12: { amount: number; months: number } | null;
    };
    description: string;
  };
  isSelected?: boolean;
  onSelect: () => void;
  colorScheme: "muted" | "primary" | "secondary";
}

export function TierCard({ tier, isSelected, onSelect, colorScheme }: TierCardProps) {
  const getColorClasses = () => {
    switch (colorScheme) {
      case "primary":
        return {
          border: "border-primary",
          icon: "bg-primary text-primary-foreground",
          title: "text-primary neon-text",
          button: "bg-primary text-primary-foreground hover:animate-glow",
          popularBg: "bg-accent text-accent-foreground"
        };
      case "secondary": 
        return {
          border: "border-secondary hover:border-accent",
          icon: "bg-secondary text-secondary-foreground", 
          title: "text-secondary",
          button: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
          popularBg: "bg-accent text-accent-foreground"
        };
      default:
        return {
          border: "border-muted hover:border-primary",
          icon: "bg-muted text-muted-foreground",
          title: "text-muted-foreground",
          button: "border-2 border-muted text-muted-foreground hover:border-primary hover:text-primary",
          popularBg: "bg-accent text-accent-foreground"
        };
    }
  };

  const colors = getColorClasses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-lg">
            MOST POPULAR
          </span>
        </div>
      )}

      <Card className={cn(
        "tier-card glass-morphism p-4 sm:p-6 md:p-8 border-2 group cursor-pointer transition-all duration-300",
        colors.border,
        isSelected && "ring-2 ring-primary"
      )} onClick={onSelect}>
        <CardContent className="text-center p-0">
          <div className={cn("w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center transition-all", colors.icon)}>
            <i className={cn(`fas fa-${tier.icon} text-2xl sm:text-3xl`)} />
          </div>
          
          <h3 className={cn("font-orbitron font-bold text-xl sm:text-2xl mb-2", colors.title)}>
            {tier.name}
          </h3>
          
          <p className="text-accent font-bold text-base sm:text-lg mb-4 sm:mb-6">{tier.subtitle}</p>
          
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <div className={cn(
              "rounded p-2 sm:p-3",
              colorScheme === "primary" ? "border-2 border-primary bg-primary/10" : "border border-border"
            )}>
              <p className="font-bold text-base sm:text-lg">
                One-off: <span className={cn(colorScheme === "primary" ? "text-primary" : "text-foreground")}>
                  R{tier.pricing.lump_sum.toLocaleString()}
                </span>
              </p>
            </div>
            
            {tier.pricing.deposit !== null && tier.pricing.monthly_12 !== null && (
              <div className={cn("border rounded p-2 sm:p-3", colorScheme === "primary" ? "border-primary" : "border-border")}>
                <p className="font-semibold mb-1 text-sm sm:text-base">OR</p>
                <p className="text-sm sm:text-base">R{tier.pricing.deposit.toLocaleString()} deposit</p>
                <p className="text-xs sm:text-sm">+ R{tier.pricing.monthly_12.amount.toLocaleString()}/mo × {tier.pricing.monthly_12.months} months</p>
              </div>
            )}
            
            {tier.pricing.deposit === null && tier.pricing.monthly_12 === null && (
              <div className={cn("border rounded p-2 sm:p-3", colorScheme === "primary" ? "border-primary" : "border-border")}>
                <p className="text-xs sm:text-sm font-semibold">Single lump sum payment</p>
                <p className="text-xs mt-1">Any amount over R{tier.pricing.lump_sum.toLocaleString()}</p>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-1">
            {tier.description}
          </p>

          <AnimatedButton
            className={cn("w-full min-h-[44px] py-3 sm:py-3.5 text-sm sm:text-base font-bold rounded-lg transition-all duration-300 transform hover:scale-105", colors.button)}
            variant={colorScheme === "primary" ? "default" : "outline"}
          >
            SELECT {tier.name.split(" ")[1].toUpperCase()}
          </AnimatedButton>
        </CardContent>
      </Card>
    </motion.div>
  );
}
