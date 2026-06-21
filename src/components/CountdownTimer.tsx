import { useEffect, useState } from "react";

interface CountdownTimerProps {
  hours?: number;
  minutes?: number;
}

const CountdownTimer = ({ hours = 4, minutes = 30 }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours,
    minutes,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="bg-background/20 backdrop-blur-sm border border-white/20 rounded-xl w-16 h-16 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {formatTime(timeLeft.hours)}
          </span>
        </div>
        <span className="text-xs text-white/80 mt-1">Hours</span>
      </div>
      <div className="flex items-center">
        <span className="text-2xl font-bold text-white">:</span>
      </div>
      <div className="flex flex-col items-center">
        <div className="bg-background/20 backdrop-blur-sm border border-white/20 rounded-xl w-16 h-16 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {formatTime(timeLeft.minutes)}
          </span>
        </div>
        <span className="text-xs text-white/80 mt-1">Minutes</span>
      </div>
      <div className="flex items-center">
        <span className="text-2xl font-bold text-white">:</span>
      </div>
      <div className="flex flex-col items-center">
        <div className="bg-background/20 backdrop-blur-sm border border-white/20 rounded-xl w-16 h-16 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {formatTime(timeLeft.seconds)}
          </span>
        </div>
        <span className="text-xs text-white/80 mt-1">Seconds</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
