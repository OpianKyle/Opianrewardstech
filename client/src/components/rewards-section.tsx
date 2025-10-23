import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Shield, TrendingUp } from "lucide-react";

export function RewardsSection() {
  const benefits = [
    {
      title: "Partnership Certification",
      Icon: Award,
      description: "Official partnership certificate issued in both digital and physical formats, documenting your investment commitment and partnership status with Opian Investment Partners.",
      feature: "Founding Partner Recognition"
    },
    {
      title: "Investor Portal Access", 
      Icon: Shield,
      description: "Exclusive access to your secure investor dashboard with real-time portfolio tracking, quarterly reports, and direct communication with your dedicated investment advisor.",
      feature: "24/7 Portfolio Management"
    },
    {
      title: "Future Opportunities",
      Icon: TrendingUp, 
      description: "Priority consideration for upcoming investment opportunities and new partnership programs. Your established relationship grants preferential access to exclusive offerings.",
      feature: "Preferred Partner Status"
    }
  ];

  return (
    <section id="rewards" className="py-20 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-black pointer-events-none z-10"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <div className="grid lg:grid-cols-12 gap-12">
          <motion.div 
            className="lg:col-span-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
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
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 h-full"
                      data-testid={`reward-${benefit.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-8 text-center flex flex-col h-full">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-amber-400" />
                    </div>
                    
                    <h3 className="font-serif font-bold text-xl mb-4 text-amber-400">
                      {benefit.title}
                    </h3>
                    
                    <p className="text-amber-200/70 mb-6 leading-relaxed flex-grow">
                      {benefit.description}
                    </p>
                    
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 mt-auto">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-amber-400" />
                      </div>
                      <p className="text-sm font-semibold text-amber-300">
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
            className="lg:col-span-4"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif font-bold text-4xl md:text-5xl mb-6 text-amber-400">
              Partnership Benefits & Recognition
            </h2>
            <p className="text-xl text-amber-200/80 mb-8 leading-relaxed">
              More than an investment—a prestigious partnership that acknowledges your commitment to excellence and shared financial success.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <h4 className="font-semibold text-amber-300 mb-2">Comprehensive Documentation</h4>
                <p className="text-sm text-amber-200/70">
                  Official partnership certificates in both digital and physical formats, providing tangible proof of your investment commitment.
                </p>
              </div>
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <h4 className="font-semibold text-amber-300 mb-2">Dedicated Support</h4>
                <p className="text-sm text-amber-200/70">
                  Direct access to your personal investment advisor with quarterly portfolio reviews and real-time performance tracking.
                </p>
              </div>
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <h4 className="font-semibold text-amber-300 mb-2">Exclusive Opportunities</h4>
                <p className="text-sm text-amber-200/70">
                  Priority access to future investment opportunities and new partnership programs as they become available.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
