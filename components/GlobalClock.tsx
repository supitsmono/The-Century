import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TARGET_DATE } from '../constants';

interface GlobalClockProps {
  timeLeft?: null; // Keep for compatibility, but we'll calculate internally
}

// Exact Framer Countdown logic adapted for our project
const unitNames = ["years", "months", "days", "hours", "minutes", "seconds"];
const unitSizes = [365, 12, 30, 24, 60, 60];
const finishedIndex = 6;

// Configuration matching our design (same units as old GlobalClock)
const units = {
  years: true,
  months: false, // Don't show months, match old design
  days: true,
  hours: true,
  minutes: true,
  seconds: true,
  zeroUnits: false
};

function getDateWithTime(date: Date, hour: number, minute: number, second: number, ampm: string) {
  const newDate = new Date(date);
  newDate.setHours(hour + (ampm === "PM" && hour !== 12 ? 12 : 0));
  newDate.setMinutes(minute);
  newDate.setSeconds(second);
  return newDate;
}

// Calculate target date outside component to avoid recreating it
const targetDate = getDateWithTime(TARGET_DATE, 12, 0, 0, "AM");

export const GlobalClock: React.FC<GlobalClockProps> = () => {

  // Exact Framer calculateTimeLeft logic
  const calculateTimeLeft = useCallback((): Array<number | boolean | null> => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    const timeLeftValue: Array<number | boolean | null> = Array(7).fill(null);

    if (difference > 0) {
      timeLeftValue[0] = Math.floor(difference / (1000 * 60 * 60 * 24 * 365)); // years
      timeLeftValue[1] = Math.floor((difference / (1000 * 60 * 60 * 24 * 30)) % 12); // months
      timeLeftValue[2] = Math.floor((difference / (1000 * 60 * 60 * 24)) % 30); // days
      timeLeftValue[3] = Math.floor((difference / (1000 * 60 * 60)) % 24); // hours
      timeLeftValue[4] = Math.floor((difference / 1000 / 60) % 60); // minutes
      timeLeftValue[5] = Math.floor((difference / 1000) % 60); // seconds
      timeLeftValue[6] = true; // still counting

      // Handle unit dependencies (exact Framer logic)
      for (let i = 0; i < unitNames.length - 1; i++) {
        const unitKey = unitNames[i] as keyof typeof units;
        if (!units[unitKey]) {
          timeLeftValue[i + 1] = (timeLeftValue[i + 1] as number) + (timeLeftValue[i] as number) * unitSizes[i + 1];
          timeLeftValue[i] = null;
        }
      }

      if (!units.seconds) timeLeftValue[5] = null;
      if (!units.zeroUnits) {
        for (let i = 0; i < unitNames.length; i++) {
          if ((timeLeftValue[i] as number) <= 0) {
            timeLeftValue[i] = null;
          } else {
            break;
          }
        }
      }
    } else {
      timeLeftValue[finishedIndex] = false;
    }

    return timeLeftValue;
  }, []);

  const [timeLeft, setTimeLeft] = useState<Array<number | boolean | null>>(calculateTimeLeft());

  useEffect(() => {
    // Update every second consistently
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // If countdown is finished
  if (!timeLeft[finishedIndex]) {
    return (
    <div className="flex items-center justify-center p-32 text-center">
        <span className="font-serif italic text-4xl text-[#64748b] opacity-60">
          The vault is open. The century has passed.
        </span>
    </div>
  );
  }

  // Filter valid units (same as Framer logic)
  const validUnits = unitNames
    .map((unit, index) => ({ unit, value: timeLeft[index] }))
    .filter(item => item.value != null);

  // Build segments matching our design style
  const segments: React.ReactElement[] = [];

  validUnits.forEach((item) => {
    const paddedValue = String(item.value).padStart(2, "0");
    
    // Map to our label format (matching old GlobalClock)
    const labelMap: { [key: string]: string } = {
      years: "Years",
      months: "Months",
      days: "Days",
      hours: "Hours",
      minutes: "Minutes",
      seconds: "Seconds"
    };

    segments.push(
      <TimeUnit
        key={item.unit}
        value={paddedValue}
        label={labelMap[item.unit] || item.unit}
        isSeconds={item.unit === "seconds"}
      />
    );
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-16 md:gap-8 w-full text-[#1e293b] max-w-5xl relative z-50" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
      {segments}
    </div>
  );
};

const TimeUnit: React.FC<{ value: string; label: string; isSeconds?: boolean }> = ({ value, label, isSeconds }) => (
  <motion.div 
    className={`flex flex-col items-center justify-center relative z-50 ${isSeconds ? 'col-span-2 md:col-span-1' : ''}`}
  >
    <div className="relative group">
      <span 
        className="font-serif text-6xl md:text-8xl tabular-nums tracking-tighter leading-none block text-[#1e293b] transition-opacity duration-1000 group-hover:opacity-100 relative z-50"
        style={{ 
          opacity: 1,
          textShadow: '0 0 30px rgba(245, 243, 241, 0.9), 0 0 60px rgba(245, 243, 241, 0.6), 0 2px 8px rgba(30, 41, 59, 0.1)',
          filter: 'drop-shadow(0 2px 4px rgba(245, 243, 241, 0.8))',
        }}
      >
        {value}
      </span>
      {isSeconds && (
        <motion.div 
          className="absolute inset-0 bg-[#1e293b]/3 blur-[80px] rounded-full pointer-events-none"
          animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
    <span 
      className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] mt-8 text-[#1e293b] font-black relative z-50"
      style={{
        opacity: 0.85,
        color: '#1e293b',
        textShadow: '0 0 20px rgba(245, 243, 241, 1), 0 0 40px rgba(245, 243, 241, 0.9), 0 2px 6px rgba(245, 243, 241, 1), 1px 1px 2px rgba(30, 41, 59, 0.2)',
        filter: 'drop-shadow(0 1px 3px rgba(245, 243, 241, 1)) drop-shadow(0 0 10px rgba(245, 243, 241, 0.8))',
        fontWeight: 900,
        letterSpacing: '0.4em',
      }}
    >
      {label}
    </span>
    <div 
      className="h-[1px] w-8 mt-4 relative z-50"
      style={{
        backgroundColor: '#1e293b',
        opacity: 0.4,
        boxShadow: '0 0 10px rgba(245, 243, 241, 0.9), 0 1px 2px rgba(245, 243, 241, 0.8)',
      }}
    />
  </motion.div>
);
