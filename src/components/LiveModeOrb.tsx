import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LiveModeOrbProps {
  audioLevel: number;
  isLiveActive: boolean;
  isSpeaking: boolean;
}

export const LiveModeOrb = ({ audioLevel, isLiveActive, isSpeaking }: LiveModeOrbProps) => {
  // Generate a grid of dots to form a face
  const dots = Array.from({ length: 49 }); // 7x7 grid

  return (
    <div className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64">
      {/* Outer Glow */}
      <motion.div
        animate={{
          scale: isLiveActive ? [1, 1.2, 1] : 1,
          opacity: isLiveActive ? [0.3, 0.6, 0.3] : 0.1,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
      />
      
      {/* Dot Face */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 p-2 md:p-4">
        {dots.map((_, i) => {
          const facePattern = [
            0, 1, 0, 0, 0, 1, 0,
            0, 0, 0, 0, 0, 0, 0,
            0, 1, 0, 0, 0, 1, 0,
            0, 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0, 1,
            0, 1, 1, 1, 1, 1, 0,
            0, 0, 0, 0, 0, 0, 0
          ];

          const isFaceDot = facePattern[i] === 1;

          return (
            <motion.div
              key={i}
              animate={{
                scale: isSpeaking ? [1, 1.5, 1] : 1,
                opacity: isFaceDot ? (isSpeaking ? [0.5, 1, 0.5] : 0.8) : 0.1,
                backgroundColor: isSpeaking ? "#3b82f6" : "#475569"
              }}
              transition={{ 
                duration: isSpeaking ? 0.3 : 1, 
                repeat: isSpeaking ? Infinity : 0,
                delay: i * 0.02
              }}
              className={cn(
                "w-2 h-2 md:w-3 md:h-3 rounded-full",
                isFaceDot ? "bg-slate-600" : "bg-slate-800"
              )}
            />
          );
        })}
      </div>
    </div>
  );
};
