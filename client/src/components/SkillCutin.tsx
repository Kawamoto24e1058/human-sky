import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SkillCutinProps {
  skillName: string | null;
  duration?: number;
}

export function SkillCutin({ skillName, duration = 1500 }: SkillCutinProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (skillName) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [skillName, duration]);

  return (
    <AnimatePresence>
      {isVisible && skillName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* 背景の暗転 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* 光のフラッシュ */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 bg-gradient-radial from-neon-blue/30 to-transparent"
          />

          {/* 技名テキスト */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, x: -100 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 1.5, opacity: 0, x: 100 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 20,
              duration: 0.5 
            }}
            className="relative z-10"
          >
            {/* 背景のグロー効果 */}
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue opacity-50" />
            
            {/* メインテキスト */}
            <div className="relative">
              {/* 縁取り */}
              <h2 
                className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple"
                style={{
                  WebkitTextStroke: '3px rgba(74, 240, 255, 0.8)',
                  textShadow: `
                    0 0 20px rgba(74, 240, 255, 1),
                    0 0 40px rgba(192, 132, 252, 0.8),
                    0 0 60px rgba(74, 240, 255, 0.6),
                    0 5px 15px rgba(0, 0, 0, 0.5)
                  `
                }}
              >
                {skillName}
              </h2>
            </div>
          </motion.div>

          {/* 左右からスライドインする装飾ライン */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent transform -translate-y-20"
          />
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-purple to-transparent transform translate-y-20"
          />

          {/* 周囲に広がるパーティクル風エフェクト */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                x: Math.cos((i * Math.PI) / 4) * 300,
                y: Math.sin((i * Math.PI) / 4) * 300
              }}
              transition={{
                duration: 1,
                delay: 0.2 + i * 0.05,
                ease: 'easeOut'
              }}
              className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
              style={{ top: '50%', left: '50%' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
