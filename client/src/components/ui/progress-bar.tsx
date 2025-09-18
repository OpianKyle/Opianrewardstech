import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  label: string;
  status?: string;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({ 
  progress, 
  label, 
  status, 
  animated = true,
  className 
}: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span className={cn(
          "font-bold",
          status === "completed" && "text-accent",
          status === "active" && "text-primary",
          !status && "text-muted-foreground"
        )}>
          {status || `${progress}%`}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full relative",
            status === "completed" 
              ? "bg-gradient-to-r from-accent to-primary"
              : "bg-gradient-to-r from-primary to-secondary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {animated && (
            <div className="progress-bar absolute inset-0" />
          )}
        </motion.div>
      </div>
    </div>
  );
}
