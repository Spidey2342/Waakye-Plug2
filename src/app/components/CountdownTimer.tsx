import { useEffect, useState } from 'react';
import { formatCountdown } from '@/app/utils/timeUtils';

interface CountdownTimerProps {
  milliseconds: number;
  onComplete?: () => void;
}

export function CountdownTimer({ milliseconds, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(milliseconds);

  // Reset timer if milliseconds prop changes
  useEffect(() => {
    setTimeLeft(milliseconds);
  }, [milliseconds]);
useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      const next = prev - 1000;

      if (next <= 0) {
        clearInterval(timer);
        onComplete?.();
        return 0;
      }

      return next;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [onComplete]);

  return (
    <div className="font-mono text-2xl font-bold text-[#7a1d1d] tabular-nums">
      {formatCountdown(timeLeft)}
    </div>
  );
}