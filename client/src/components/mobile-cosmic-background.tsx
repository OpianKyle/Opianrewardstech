import { useEffect, useState } from 'react';

interface MobileCosmicBackgroundProps {
  className?: string;
}

export function MobileCosmicBackground({ className }: MobileCosmicBackgroundProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add animation styles to document head
    if (!document.getElementById('mobile-cosmic-styles')) {
      const style = document.createElement('style');
      style.id = 'mobile-cosmic-styles';
      style.textContent = `
        @keyframes cosmic-drift {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.8; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.8; }
        }
        
        @keyframes cosmic-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
        }
        
        @keyframes cosmic-float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-15px) translateX(10px); }
          75% { transform: translateY(15px) translateX(-10px); }
        }
        
        @keyframes nebula-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        .cosmic-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        
        .cosmic-particle-1 {
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, #00bfff, transparent);
          animation: cosmic-drift 6s infinite ease-in-out;
        }
        
        .cosmic-particle-2 {
          width: 3px;
          height: 3px;
          background: radial-gradient(circle, #ff6b9d, transparent);
          animation: cosmic-pulse 4s infinite ease-in-out;
        }
        
        .cosmic-particle-3 {
          width: 2px;
          height: 2px;
          background: radial-gradient(circle, #ffffff, transparent);
          animation: star-twinkle 3s infinite ease-in-out;
        }
        
        .cosmic-particle-4 {
          width: 5px;
          height: 5px;
          background: radial-gradient(circle, #9b59b6, transparent);
          animation: cosmic-float 8s infinite ease-in-out;
        }
        
        .cosmic-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(0, 191, 255, 0.3), rgba(155, 89, 182, 0.1), transparent);
          animation: cosmic-pulse 10s infinite ease-in-out;
          pointer-events: none;
        }
        
        .cosmic-orb-1 {
          width: 80px;
          height: 80px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }
        
        .cosmic-orb-2 {
          width: 60px;
          height: 60px;
          top: 60%;
          right: 15%;
          animation-delay: 3s;
        }
        
        .cosmic-orb-3 {
          width: 100px;
          height: 100px;
          bottom: 25%;
          left: 20%;
          animation-delay: 6s;
        }
      `;
      document.head.appendChild(style);
    }

    setIsVisible(true);
    
    return () => {
      const style = document.getElementById('mobile-cosmic-styles');
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Generate particle positions
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    type: Math.floor(Math.random() * 4) + 1,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 5,
  }));

  return (
    <div 
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
      data-testid="mobile-cosmic-background"
    >
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse at 25% 25%, rgba(138, 43, 226, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 25%, rgba(0, 191, 255, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 25% 75%, rgba(255, 107, 157, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 75%, rgba(155, 89, 182, 0.4) 0%, transparent 50%),
            linear-gradient(135deg, 
              rgba(13, 13, 35, 0.9) 0%, 
              rgba(25, 25, 60, 0.8) 25%, 
              rgba(35, 35, 80, 0.7) 50%, 
              rgba(25, 25, 60, 0.8) 75%, 
              rgba(13, 13, 35, 0.9) 100%
            )
          `,
          backgroundSize: '200% 200%',
          animation: isVisible ? 'nebula-shift 20s ease-in-out infinite' : 'none'
        }}
      />

      {/* Cosmic orbs */}
      {isVisible && (
        <>
          <div className="cosmic-orb cosmic-orb-1" />
          <div className="cosmic-orb cosmic-orb-2" />
          <div className="cosmic-orb cosmic-orb-3" />
        </>
      )}

      {/* Floating particles */}
      {isVisible && particles.map((particle) => (
        <div
          key={particle.id}
          className={`cosmic-particle cosmic-particle-${particle.type}`}
          style={{
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Starfield overlay */}
      <div 
        className="absolute inset-0 w-full h-full opacity-60"
        style={{
          background: `
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 40% 70%, white, transparent),
            radial-gradient(1px 1px at 90% 40%, white, transparent),
            radial-gradient(1px 1px at 130% 80%, white, transparent),
            radial-gradient(1px 1px at 160% 30%, white, transparent),
            radial-gradient(2px 2px at 25% 15%, #00bfff, transparent),
            radial-gradient(1px 1px at 75% 35%, #ff6b9d, transparent),
            radial-gradient(1px 1px at 45% 65%, white, transparent),
            radial-gradient(2px 2px at 85% 80%, #9b59b6, transparent),
            radial-gradient(1px 1px at 15% 90%, white, transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px, 180px 120px, 200px 160px, 220px 140px, 190px 110px, 250px 180px, 170px 130px, 210px 150px, 180px 120px, 160px 100px',
          animation: isVisible ? 'cosmic-drift 30s linear infinite' : 'none'
        }}
      />

      {/* Gradient overlay for better text readability */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0.6) 100%)
          `
        }}
      />
    </div>
  );
}