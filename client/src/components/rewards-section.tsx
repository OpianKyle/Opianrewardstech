import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StarsBackground } from "./stars-background";

export function RewardsSection() {
  const rewards = [
    {
      title: "Ascendancy Certificate",
      icon: "certificate",
      color: "accent",
      description: "Your official player card, available in both digital and physical formats, verifying your tier and total contribution to the mission.",
      feature: "Founding Partnership Status",
      featureIcon: "id-card"
    },
    {
      title: "Exclusive Partner Badge", 
      icon: "badge",
      color: "primary",
      description: "Digital credentials showcasing your early belief and commitment. Display across professional networks as proof of visionary investment.",
      feature: "Professional Network Ready",
      featureIcon: "linkedin"
    },
    {
      title: "Priority Access",
      icon: "star", 
      color: "secondary",
      description: "Be first in line for future projects and beta tests. Your partnership status grants exclusive early access to next-generation innovations.",
      feature: "Innovation First Access",
      featureIcon: "rocket"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "accent":
        return {
          border: "hover:border-accent",
          icon: "bg-accent text-accent-foreground",
          title: "text-accent",
          feature: "text-accent",
          featureBorder: "border-accent/30"
        };
      case "primary":
        return {
          border: "hover:border-primary", 
          icon: "bg-primary text-primary-foreground",
          title: "text-primary",
          feature: "text-primary",
          featureBorder: "border-primary/30"
        };
      case "secondary":
        return {
          border: "hover:border-secondary",
          icon: "bg-secondary text-secondary-foreground", 
          title: "text-secondary",
          feature: "text-secondary",
          featureBorder: "border-secondary/30"
        };
      default:
        return {
          border: "hover:border-primary",
          icon: "bg-muted text-muted-foreground",
          title: "text-foreground", 
          feature: "text-primary",
          featureBorder: "border-border"
        };
    }
  };

  return (
    <section id="rewards" className="py-20 relative overflow-hidden">
      <StarsBackground className="opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/90 pointer-events-none z-10"></div>
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-10"></div>
      <div className="max-w-6xl mx-auto px-4 relative z-20">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-orbitron font-bold text-4xl md:text-5xl mb-4 neon-text text-primary">
            EARN YOUR STATUS
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            This is more than a transaction; it's a partnership that recognizes your early belief in our mission.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {rewards.map((reward, index) => {
            const colors = getColorClasses(reward.color);
            
            return (
              <motion.div
                key={reward.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`glass-morphism border border-border transition-all duration-300 group ${colors.border}`}
                      data-testid={`reward-${reward.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${colors.icon}`}>
                      <i className={`fas fa-${reward.icon} text-2xl`} />
                    </div>
                    
                    <h3 className={`font-orbitron font-bold text-xl mb-4 ${colors.title}`}>
                      {reward.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6">
                      {reward.description}
                    </p>
                    
                    <div className={`p-4 bg-muted/20 rounded border-2 border-dashed ${colors.featureBorder}`}>
                      <i className={`fas fa-${reward.featureIcon} text-3xl mb-2 ${colors.feature}`} />
                      <p className={`text-sm font-bold ${colors.feature}`}>
                        {reward.feature}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
