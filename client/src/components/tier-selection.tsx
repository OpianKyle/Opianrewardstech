import { useState } from "react";
import { motion } from "framer-motion";
import { TierCard } from "@/components/ui/tier-card";
import { useQuery } from "@tanstack/react-query";

type TierData = {
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

type TiersResponse = {
  builder: TierData;
  innovator: TierData;
  visionary: TierData;
  cornerstone: TierData;
};

interface TierSelectionProps {
  onTierSelect: (tier: string) => void;
}

export function TierSelection({ onTierSelect }: TierSelectionProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const { data: tiers, isLoading } = useQuery<TiersResponse>({
    queryKey: ["/api/tiers"],
  });

  const handleTierSelect = (tierKey: string) => {
    setSelectedTier(tierKey);
    onTierSelect(tierKey);
  };

  if (isLoading) {
    return (
      <section className="py-20 relative bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section id="tiers" className="py-12 sm:py-16 md:py-20 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <motion.div 
          className="text-center mb-8 sm:mb-10 md:mb-12"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl mb-4 sm:mb-6 text-primary px-2">
            Investment Partnership Tiers
          </h2>
          <p className="text-base sm:text-lg text-foreground/80 mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto px-4">
            Choose the partnership level that aligns with your investment goals and commitment to our shared success. Each tier offers distinct benefits and return structures tailored to your investment horizon.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-shield-alt text-primary mt-1 text-lg sm:text-base"></i>
              <div className="text-left">
                <h4 className="font-semibold text-primary mb-1 text-sm sm:text-base">Licensed & Regulated</h4>
                <p className="text-xs sm:text-sm text-foreground/70">FSP compliant with full regulatory oversight</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-chart-line text-primary mt-1 text-lg sm:text-base"></i>
              <div className="text-left">
                <h4 className="font-semibold text-primary mb-1 text-sm sm:text-base">Proven Returns</h4>
                <p className="text-xs sm:text-sm text-foreground/70">Track record of sustainable growth since 2013</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-handshake text-primary mt-1 text-lg sm:text-base"></i>
              <div className="text-left">
                <h4 className="font-semibold text-primary mb-1 text-sm sm:text-base">Partnership Model</h4>
                <p className="text-xs sm:text-sm text-foreground/70">Shared success through aligned interests</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {tiers && (
              <>
                <TierCard
                  tier={tiers.builder}
                  isSelected={selectedTier === "builder"}
                  onSelect={() => handleTierSelect("builder")}
                  colorScheme="muted"
                />
                
                <TierCard
                  tier={tiers.innovator}
                  isSelected={selectedTier === "innovator"}
                  onSelect={() => handleTierSelect("innovator")}
                  colorScheme="primary"
                />
                
                <TierCard
                  tier={tiers.visionary}
                  isSelected={selectedTier === "visionary"}
                  onSelect={() => handleTierSelect("visionary")}
                  colorScheme="secondary"
                />
                
                <TierCard
                  tier={tiers.cornerstone}
                  isSelected={selectedTier === "cornerstone"}
                  onSelect={() => handleTierSelect("cornerstone")}
                  colorScheme="primary"
                />
              </>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="bg-primary/10 border border-primary/30 rounded-lg p-6 mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-lg text-primary flex items-start gap-3 justify-center">
            <i className="fas fa-info-circle mt-1"></i>
            <span><span className="font-semibold">Investment Period:</span> Your commitment period is 12 months. Upon completion, you receive a Certificate of Partnership representing your total contribution and future investment returns.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
