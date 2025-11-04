import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";

export function RewardsSection() {
  const benefits = [
    {
      title: "Partnership Certification",
      Icon: Award,
      description: "Official partnership certificate issued in both digital and physical formats, documenting your investment commitment and partnership status with Opian Investment Partners.",
      feature: "Founding Partner Recognition"
    },
    {
      title: "Future Opportunities",
      Icon: TrendingUp, 
      description: "Priority consideration for upcoming investment opportunities and new partnership programs. Your established relationship grants preferential access to exclusive offerings.",
      feature: "Preferred Partner Status"
    }
  ];

  return (
    <section id="rewards" className="py-20 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif font-bold text-4xl md:text-5xl mb-6 text-primary">
            Partnership Benefits & Recognition
          </h2>
          <p className="text-xl text-foreground/80 mb-8 leading-relaxed max-w-3xl mx-auto">
            More than an investment—a prestigious partnership that acknowledges your commitment to excellence and shared financial success.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.Icon;
            
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-card border border-primary/30 hover:border-primary/50 transition-all duration-300 h-full"
                      data-testid={`reward-${benefit.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-8 text-center flex flex-col h-full">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    
                    <h3 className="font-serif font-bold text-xl mb-4 text-primary">
                      {benefit.title}
                    </h3>
                    
                    <p className="text-foreground/70 mb-6 leading-relaxed flex-grow">
                      {benefit.description}
                    </p>
                    
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 mt-auto">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {benefit.feature}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
            <h4 className="font-semibold text-primary mb-2">Comprehensive Documentation</h4>
            <p className="text-sm text-foreground/70">
              Official partnership certificates in both digital and physical formats, providing tangible proof of your investment commitment.
            </p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
            <h4 className="font-semibold text-primary mb-2">Dedicated Support</h4>
            <p className="text-sm text-foreground/70">
              Direct access to your personal investment advisor with quarterly portfolio reviews and real-time performance tracking.
            </p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
            <h4 className="font-semibold text-primary mb-2">Exclusive Opportunities</h4>
            <p className="text-sm text-foreground/70">
              Priority access to future investment opportunities and new partnership programs as they become available.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
