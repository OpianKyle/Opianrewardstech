import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import returnsImage from "@assets/generated_images/Investment_returns_growth_chart_c39818d0.png";
import meetingImage from "@assets/generated_images/Investment_portfolio_review_meeting_75e693f5.png";

export function QuestProgression() {
  return (
    <section id="progression" className="py-20 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-black pointer-events-none z-10"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <div className="grid lg:grid-cols-12 gap-12">
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif font-bold text-4xl md:text-5xl mb-6 text-amber-400">
              Investment Timeline & Returns
            </h2>
            <p className="text-xl text-amber-200/80 mb-8 leading-relaxed">
              A clear breakdown of your investment journey and projected returns over the partnership period. Our structured approach ensures transparency and sustainable growth.
            </p>
            
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-amber-500/30 text-center mb-6" data-testid="investment-summary">
              <CardContent className="p-8">
                <h3 className="font-serif font-bold text-2xl mb-6 text-amber-400">Investment Summary</h3>
                
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="text-4xl font-bold text-amber-400 mb-2" data-testid="stat-total-return">R132,000</div>
                    <div className="text-sm text-amber-200/80 font-semibold mb-1">Total Returns</div>
                    <div className="text-xs text-amber-200/60">Over 13-year investment period</div>
                  </div>
                  
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="text-4xl font-bold text-amber-400 mb-2" data-testid="stat-initial-investment">R24,000</div>
                    <div className="text-sm text-amber-200/80 font-semibold mb-1">Initial Investment</div>
                    <div className="text-xs text-amber-200/60">Your partnership commitment</div>
                  </div>
                  
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="text-4xl font-bold text-amber-400 mb-2" data-testid="stat-total-gain">550%</div>
                    <div className="text-sm text-amber-200/80 font-semibold mb-1">Total Return</div>
                    <div className="text-xs text-amber-200/60">On original investment</div>
                  </div>
                </div>

                <div className="relative h-48 rounded-lg overflow-hidden border border-amber-500/20 mb-6">
                  <img 
                    src={returnsImage} 
                    alt="Investment Growth Chart" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-left space-y-3 text-sm text-amber-200/70 border-t border-amber-500/20 pt-6">
                  <p className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span>
                    <span>Investment period: 12 months</span>
                  </p>
                  <p className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span>
                    <span>Total return timeline: 13 years</span>
                  </p>
                  <p className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span>
                    <span>Certificate of Partnership issued upon completion</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            className="lg:col-span-7 space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-amber-500/30" data-testid="phase-capital-return">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-500/20 border-2 border-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-amber-400 text-xl">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-2xl mb-2 text-amber-400">Capital Return Phase</h3>
                    <p className="text-sm text-amber-200/60 mb-3">Month 36 (End of Year 3)</p>
                    <h4 className="font-semibold text-lg mb-3 text-amber-100">
                      Initial Investment Returned
                    </h4>
                    <p className="text-amber-200/80 leading-relaxed">
                      After 36 months of partnership, you receive a one-time return of <span className="text-amber-400 font-bold">R24,000</span> — your full initial capital investment returned to you while maintaining your partnership benefits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-amber-500/30" data-testid="phase-dividend-returns">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-500/20 border-2 border-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-amber-400 text-xl">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-2xl mb-2 text-amber-400">Dividend Distribution Phase</h3>
                    <p className="text-sm text-amber-200/60 mb-3">Years 4 - 13 (10 Year Period)</p>
                    <h4 className="font-semibold text-lg mb-3 text-amber-100">
                      Annual Partnership Dividends
                    </h4>
                    <p className="text-amber-200/80 leading-relaxed">
                      Annual dividend distribution of <span className="text-amber-400 font-bold">R10,800</span> for 10 consecutive years, representing a 45% annual return on your original investment commitment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="relative h-64 rounded-lg overflow-hidden border border-amber-500/20">
              <img 
                src={meetingImage} 
                alt="Investment Review Meeting" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                <p className="p-6 text-amber-100 text-sm italic">
                  "Your partnership includes quarterly portfolio reviews and direct access to senior investment advisors"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
