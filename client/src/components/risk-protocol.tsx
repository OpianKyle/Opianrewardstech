import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Scale } from "lucide-react";

export function RiskProtocol() {
  const disclosures = [
    {
      title: "Investment Risk Disclosure",
      icon: AlertTriangle,
      color: "amber",
      description: "All investments carry inherent risks. Our investment strategies involve market exposure and technology development, which contain uncertainties. There are no guaranteed returns or outcomes in this partnership."
    },
    {
      title: "Past Performance Disclaimer", 
      icon: TrendingDown,
      color: "amber",
      description: "This partnership represents a strategic investment opportunity, not a traditional deposit or guaranteed investment vehicle. Historical performance does not guarantee future results. Your investment commitment supports a shared vision for growth."
    },
    {
      title: "Regulatory Compliance & Oversight",
      icon: Scale,
      color: "amber", 
      description: "We operate under full regulatory compliance as a licensed Financial Services Provider (FSP). All operations adhere to South African financial regulations and are subject to ongoing regulatory oversight and compliance audits."
    }
  ];

  return (
    <section id="briefing" className="py-20 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-black pointer-events-none z-10"></div>
      <div className="max-w-5xl mx-auto px-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-amber-500/40 relative overflow-hidden" data-testid="risk-disclosure">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>
            
            <CardContent className="p-8 sm:p-12">
              <motion.div 
                className="text-center mb-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mb-3">
                  Important Investment Disclosure
                </h2>
                <p className="text-amber-200/70 max-w-2xl mx-auto">
                  Please carefully review the following information before proceeding with your investment decision
                </p>
              </motion.div>

              <div className="space-y-6 mb-8">
                {disclosures.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      className="flex gap-4 p-6 bg-amber-500/5 border border-amber-500/20 rounded-lg hover:bg-amber-500/10 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      data-testid={`disclosure-${index + 1}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 text-amber-300">
                          {item.title}
                        </h3>
                        <p className="text-amber-200/70 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div 
                className="border-t border-amber-500/30 pt-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
                  <p className="text-sm text-amber-200/80 leading-relaxed text-center">
                    <span className="font-semibold text-amber-400">Important Notice:</span> By proceeding with this investment, you acknowledge that you have read, understood, and accept these disclosures. We recommend consulting with an independent financial advisor before making any investment decisions. All investments are subject to the terms and conditions outlined in the Partnership Agreement.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <p className="text-xs text-amber-200/60">
                  Licensed Financial Services Provider • FSP Registered • Regulatory Compliant
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
