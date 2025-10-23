import { useState } from "react";
import { motion } from "framer-motion";
import { TierCard } from "@/components/ui/tier-card";
import { useQuery } from "@tanstack/react-query";
import { StarsBackground } from "./stars-background";

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
      <section className="py-20 relative bg-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section id="tiers" className="py-20 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-black pointer-events-none z-10"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif font-bold text-4xl md:text-5xl mb-4 text-amber-400">
            Investment Partnership Tiers
          </h2>
          <p className="text-xl text-amber-200/80 max-w-3xl mx-auto">
            Choose the partnership level that aligns with your investment goals and commitment to our shared success
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
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

        <motion.div 
          className="text-center mt-12 bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-lg text-amber-300 flex items-center justify-center gap-2">
            <i className="fas fa-info-circle"></i>
            <span className="font-semibold">Important:</span> Your commitment period is 12 months. Upon completion, you receive a Certificate of Partnership representing your total contribution and future investment returns.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
