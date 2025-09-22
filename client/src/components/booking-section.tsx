import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShaderBackground } from "./shader-background";

// Declare Calendly as a global to avoid TypeScript errors
declare global {
  interface Window {
    Calendly: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: Record<string, any>;
        utm?: Record<string, any>;
      }) => void;
    };
  }
}

export function BookingSection() {
  const [selectedMeetingType, setSelectedMeetingType] = useState<'onsite' | 'teams' | null>(null);
  const [showCalendly, setShowCalendly] = useState(false);
  const [calendlyLoading, setCalendlyLoading] = useState(false);
  const calendlyContainerRef = useRef<HTMLDivElement>(null);

  // IMPORTANT: Replace these with your actual Calendly URLs
  // Create separate event types in your Calendly account for each meeting type
  // or use a single URL with prefilled location data
  const CALENDLY_ONSITE_URL = "https://calendly.com/your-link/onsite-meeting"; // Replace with your actual Calendly URL
  const CALENDLY_TEAMS_URL = "https://calendly.com/your-link/teams-meeting"; // Replace with your actual Calendly URL

  const handleMeetingTypeSelect = (type: 'onsite' | 'teams') => {
    setSelectedMeetingType(type);
    setShowCalendly(true);
    setCalendlyLoading(true);
  };

  const resetSelection = () => {
    setSelectedMeetingType(null);
    setShowCalendly(false);
    setCalendlyLoading(false);
  };

  // Initialize Calendly widget when component shows
  useEffect(() => {
    if (showCalendly && selectedMeetingType && calendlyContainerRef.current) {
      const initCalendly = () => {
        if (window.Calendly && calendlyContainerRef.current) {
          setCalendlyLoading(false);
          
          const calendlyUrl = selectedMeetingType === 'onsite' ? CALENDLY_ONSITE_URL : CALENDLY_TEAMS_URL;
          
          // Clear any existing content
          calendlyContainerRef.current.innerHTML = '';
          
          window.Calendly.initInlineWidget({
            url: calendlyUrl,
            parentElement: calendlyContainerRef.current,
            prefill: {
              // Pre-fill location for on-site meetings
              ...(selectedMeetingType === 'onsite' && {
                location: '260 Uys Krige Drive, Loevenstein, Cape Town'
              })
            },
            utm: {
              utmSource: 'ascendancy-project',
              utmCampaign: 'consultation-booking'
            }
          });
          
          // Focus on the Calendly container for accessibility
          calendlyContainerRef.current.focus();
        } else {
          // Retry initialization after a short delay if Calendly isn't loaded yet
          setTimeout(initCalendly, 500);
        }
      };
      
      initCalendly();
    }
  }, [showCalendly, selectedMeetingType, CALENDLY_ONSITE_URL, CALENDLY_TEAMS_URL]);

  return (
    <section id="booking" className="py-20 relative overflow-hidden">
      <ShaderBackground className="opacity-30" starsOnly={true} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background/95 pointer-events-none z-10"></div>
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-10"></div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-20">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-orbitron font-bold text-4xl md:text-5xl mb-4 neon-text text-primary">
            SCHEDULE A CONSULTATION
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ready to learn more? Book a personalized consultation to discover how the Ascendancy Project can accelerate your financial future.
          </p>
        </motion.div>

        {!showCalendly ? (
          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* On-site Meeting Option */}
            <Card 
              className="glass-morphism border border-primary/30 hover:border-primary transition-all duration-300 cursor-pointer group"
              onClick={() => handleMeetingTypeSelect('onsite')}
              data-testid="booking-onsite-option"
            >
              <CardContent className="p-8 text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <i className="fas fa-building text-3xl text-primary" />
                  </div>
                  
                  <h3 className="font-orbitron font-bold text-2xl mb-4 text-primary">
                    On-Site Meeting
                  </h3>
                  
                  <p className="text-muted-foreground mb-6">
                    Meet face-to-face at our Cape Town office for an in-depth consultation about your investment opportunity.
                  </p>
                  
                  <div className="bg-muted/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-map-marker-alt text-primary mt-1" />
                      <div className="text-left">
                        <p className="font-bold text-primary mb-1">Location:</p>
                        <p className="text-sm text-muted-foreground">
                          260 Uys Krige Drive<br />
                          Loevenstein, Cape Town
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-orbitron font-bold"
                    data-testid="button-book-onsite"
                  >
                    <i className="fas fa-calendar-plus mr-2" />
                    Book On-Site Meeting
                  </Button>
                </motion.div>
              </CardContent>
            </Card>

            {/* Teams Call Option */}
            <Card 
              className="glass-morphism border border-secondary/30 hover:border-secondary transition-all duration-300 cursor-pointer group"
              onClick={() => handleMeetingTypeSelect('teams')}
              data-testid="booking-teams-option"
            >
              <CardContent className="p-8 text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-secondary/20 rounded-full flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                    <i className="fas fa-video text-3xl text-secondary" />
                  </div>
                  
                  <h3 className="font-orbitron font-bold text-2xl mb-4 text-secondary">
                    Teams Call
                  </h3>
                  
                  <p className="text-muted-foreground mb-6">
                    Join us for a convenient video call consultation from the comfort of your home or office.
                  </p>
                  
                  <div className="bg-muted/20 rounded-lg p-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-3">
                        <i className="fas fa-laptop text-secondary" />
                        <span className="text-sm text-muted-foreground">High-quality video call</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3">
                        <i className="fas fa-shield-alt text-secondary" />
                        <span className="text-sm text-muted-foreground">Secure & professional</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3">
                        <i className="fas fa-clock text-secondary" />
                        <span className="text-sm text-muted-foreground">Flexible scheduling</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-orbitron font-bold"
                    data-testid="button-book-teams"
                  >
                    <i className="fas fa-video mr-2" />
                    Book Teams Call
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-morphism border border-primary/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <i className={`fas ${selectedMeetingType === 'onsite' ? 'fa-building text-primary' : 'fa-video text-secondary'} text-2xl`} />
                    <h3 className="font-orbitron font-bold text-xl">
                      Book Your {selectedMeetingType === 'onsite' ? 'On-Site Meeting' : 'Teams Call'}
                    </h3>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={resetSelection}
                    data-testid="button-back-to-options"
                  >
                    <i className="fas fa-arrow-left mr-2" />
                    Back to Options
                  </Button>
                </div>

                {selectedMeetingType === 'onsite' && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-map-marker-alt text-primary mt-1" />
                      <div>
                        <p className="font-bold text-primary mb-1">Meeting Location:</p>
                        <p className="text-sm text-muted-foreground">
                          260 Uys Krige Drive, Loevenstein, Cape Town
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendly Embed */}
                <div className="calendly-container">
                  {calendlyLoading && (
                    <div className="flex items-center justify-center py-20" data-testid="calendly-loading">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading booking calendar...</p>
                      </div>
                    </div>
                  )}
                  
                  <div 
                    ref={calendlyContainerRef}
                    className="calendly-inline-widget"
                    style={{ minWidth: '320px', height: calendlyLoading ? '0px' : '700px', transition: 'height 0.3s ease' }}
                    data-testid="calendly-embed"
                    tabIndex={-1}
                  ></div>
                  
                  {/* Fallback message if Calendly doesn't load */}
                  <noscript>
                    <div className="p-8 text-center border border-border rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        JavaScript is required to use our booking system.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please enable JavaScript or contact us directly to schedule your consultation.
                      </p>
                    </div>
                  </noscript>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clock text-accent"></i>
              <span>Flexible scheduling</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-shield-alt text-accent"></i>
              <span>Confidential consultation</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-user-tie text-accent"></i>
              <span>Expert guidance</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}