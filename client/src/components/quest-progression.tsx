import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ShaderBackground } from "./shader-background";

export function QuestProgression() {
  return (
    <section id="progression" className="py-20 relative overflow-hidden">
      <ShaderBackground className="opacity-30" starsOnly={true} />
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
            THE INNOVATOR QUEST LINE
          </h2>
          <p className="text-xl text-muted-foreground">
            Track your progression through the Ascendancy Project
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Level 1 */}
            <Card className="glass-morphism border-l-4 border-accent" data-testid="quest-level-1">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-accent-foreground">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-orbitron font-bold text-xl mb-2 text-accent">LEVEL 1 COMPLETE</h3>
                    <p className="text-sm text-muted-foreground mb-3">Month 36</p>
                    <h4 className="font-bold text-lg mb-3 text-foreground">
                      <i className="fas fa-trophy mr-2"></i>
                      ACHIEVEMENT UNLOCKED: CAPITAL RECLAIMED
                    </h4>
                    <p className="text-muted-foreground">
                      You receive a one-time payload of <span className="text-accent font-bold">R24,000</span>. 
                      Your initial capital is safely returned to your inventory.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 2 */}
            <Card className="glass-morphism border-l-4 border-primary" data-testid="quest-level-2">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary-foreground">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-orbitron font-bold text-xl mb-2 text-primary">LEVEL 2 UNLOCKED</h3>
                    <p className="text-sm text-muted-foreground mb-3">Years 4 - 13</p>
                    <h4 className="font-bold text-lg mb-3 text-foreground">
                      <i className="fas fa-medal mr-2"></i>
                      ACHIEVEMENT UNLOCKED: VICTORY LAP
                    </h4>
                    <p className="text-muted-foreground">
                      Annual dividend of <span className="text-primary font-bold">R10,800</span> for 10 years 
                      (45% annual return on original commitment).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Stats Display */}
            <Card className="glass-morphism text-center" data-testid="mission-stats">
              <CardContent className="p-8">
                <h3 className="font-orbitron font-bold text-2xl mb-6 text-primary">MISSION STATS</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-accent mb-2" data-testid="stat-total-collected">R132K</div>
                    <div className="text-sm text-muted-foreground">Total Collected</div>
                    <div className="text-xs text-muted-foreground">Complete return over investment period</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-total-invested">R24K</div>
                    <div className="text-sm text-muted-foreground">Total Invested</div>
                    <div className="text-xs text-muted-foreground">Your initial commitment</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-secondary mb-2" data-testid="stat-return">450%</div>
                    <div className="text-sm text-muted-foreground">Return on Belief</div>
                    <div className="text-xs text-muted-foreground">Total percentage return</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Visualization */}
            <Card className="glass-morphism" data-testid="quest-progress">
              <CardContent className="p-6">
                <h4 className="font-bold mb-4 text-foreground">Quest Progress</h4>
                
                <div className="space-y-4">
                  <ProgressBar
                    progress={100}
                    label="Development Phase"
                    status="completed"
                  />
                  
                  <ProgressBar
                    progress={75}
                    label="Dividend Phase"
                    status="active"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
