import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: Date;
}

function getTimeLeft(target: Date) {
  const now = new Date().getTime();
  const diff = target.getTime() - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-primary flex items-center justify-center shadow-lg">
        <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs md:text-sm text-muted-foreground mt-2 font-medium">{label}</span>
    </div>
  );
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) return null;

  return (
    <motion.div
      className="flex gap-3 md:gap-4 justify-center direction-ltr"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      dir="ltr"
    >
      <TimeUnit value={timeLeft.days} label="ימים" />
      <div className="flex items-center text-2xl text-muted-foreground font-bold pb-6">:</div>
      <TimeUnit value={timeLeft.hours} label="שעות" />
      <div className="flex items-center text-2xl text-muted-foreground font-bold pb-6">:</div>
      <TimeUnit value={timeLeft.minutes} label="דקות" />
      <div className="flex items-center text-2xl text-muted-foreground font-bold pb-6">:</div>
      <TimeUnit value={timeLeft.seconds} label="שניות" />
    </motion.div>
  );
}
