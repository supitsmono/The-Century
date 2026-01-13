
import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, body }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className="relative flex flex-col p-12 bg-[#f0ede8]/30 border border-[#d1cdc7]/30 hover:border-[#2a2a2a]/20 transition-colors duration-500 group cursor-default"
    >
      <div style={{ transform: "translateZ(50px)" }} className="space-y-6 flex flex-col items-center md:items-start">
        <div className="flex items-center gap-4">
          <Icon size={16} className="text-[#8a837b] opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[#8a837b] group-hover:text-[#2a2a2a] transition-colors duration-700">{title}</p>
        </div>
        <p className="text-xl font-light text-[#4a4a4a] leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity duration-700">
          {body}
        </p>
      </div>
      
      {/* Subtle bottom accent line */}
      <motion.div 
        className="absolute bottom-0 left-0 h-[2px] bg-[#2a2a2a] w-0 group-hover:w-full transition-all duration-700 ease-out"
      />
    </motion.div>
  );
};
