import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  glowColor?: string;
  children: React.ReactNode;
}

export function AnimatedButton({ 
  variant = "default", 
  size = "default",
  glowColor = "var(--primary)",
  className,
  children,
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
    >
      <Button
        variant={variant}
        size={size}
        className={cn(
          "relative font-orbitron font-bold transition-all duration-300",
          "hover:animate-glow",
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300"
          style={{ 
            background: glowColor,
          }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />
      </Button>
    </motion.div>
  );
}
