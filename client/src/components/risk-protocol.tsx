import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StarsBackground } from "./stars-background";

export function RiskProtocol() {
  const riskFactors = [
    {
      title: "Every quest has risks. No guarantees.",
      icon: "shield-alt",
      color: "destructive",
      description: "Our trading algorithm is in testing phase and all technology development carries inherent uncertainties. There is no guaranteed outcome in this partnership."
    },
    {
      title: "Past performance ≠ future performance", 
      icon: "chart-line",
      color: "accent",
      description: "This is a strategic partnership, not a traditional bank deposit or guaranteed investment vehicle. Your belief and commitment are your capital contributions to a shared vision."
    },
    {
      title: "Regulatory Compliance",
      icon: "balance-scale",
      color: "primary", 
      description: "We operate under full regulatory compliance through our licensed FSP structure, but innovation always involves navigating uncharted territory."
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "destructive":
        return {
          bg: "bg-destructive/10",
          border: "border-destructive", 
          title: "text-destructive-foreground"
        };
      case "accent":
        return {
          bg: "bg-accent/10",
          border: "border-accent",
          title: "text-accent-foreground"
        };
      case "primary":
        return {
          bg: "bg-primary/10", 
          border: "border-primary",
          title: "text-primary-foreground"
        };
      default:
        return {
          bg: "bg-muted/10",
          border: "border-border",
          title: "text-foreground"
        };
    }
  };

  return (
    <section id="briefing" className="py-20 relative overflow-hidden">
      <StarsBackground className="opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background/95 pointer-events-none z-10"></div>
      <div className="absolute inset-0 bg-black/30 pointer-events-none z-10"></div>
      <div className="max-w-4xl mx-auto px-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="glass-morphism border-2 border-destructive relative overflow-hidden" data-testid="risk-protocol">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-accent to-destructive"></div>
            
            <CardContent className="p-8">
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center space-x-3 mb-4">
                  <motion.i 
                    className="fas fa-exclamation-triangle text-3xl text-destructive"
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  <h2 className="font-orbitron font-bold text-3xl text-destructive">
                    MISSION BRIEFING: RISK PROTOCOL
                  </h2>
                  <motion.i 
                    className="fas fa-exclamation-triangle text-3xl text-destructive"
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 1
                    }}
                  />
                </div>
                <p className="text-xl font-bold text-destructive-foreground">Critical Mission Parameters</p>
              </motion.div>

              <div className="space-y-6">
                {riskFactors.map((factor, index) => {
                  const colors = getColorClasses(factor.color);
                  
                  return (
                    <motion.div
                      key={factor.title}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className={`rounded-lg p-6 ${colors.bg} ${colors.border} border`}
                      data-testid={`risk-factor-${index + 1}`}
                    >
                      <p className={`text-lg font-bold mb-3 ${colors.title}`}>
                        <i className={`fas fa-${factor.icon} mr-2`}></i>
                        {factor.title}
                      </p>
                      <p className="text-muted-foreground">
                        {factor.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div 
                className="text-center mt-8 p-6 bg-muted/20 rounded-lg border border-border"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                data-testid="risk-acknowledgment"
              >
                <p className="text-lg font-bold text-foreground mb-2">
                  By joining this mission, you're choosing to build the future rather than waiting for someone else to create it.
                </p>
                <p className="text-muted-foreground">
                  Your participation acknowledges both the potential rewards and inherent risks of pioneering technology development.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
