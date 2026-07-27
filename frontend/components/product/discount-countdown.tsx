"use client";

import { useState, useEffect, useRef } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(endAt: string): TimeLeft {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function formatTimeLeft(t: TimeLeft): string {
  const parts: string[] = [];
  if (t.days > 0) parts.push(`${t.days}d`);
  if (t.hours > 0 || t.days > 0) parts.push(`${t.hours}h`);
  parts.push(`${t.minutes}m`);
  if (t.total < 60 * 60 * 1000) parts.push(`${t.seconds}s`);
  return parts.join(" ");
}

interface Props {
  discountEndAt: string | null;
  onExpire?: () => void;
}

export function DiscountCountdown({ discountEndAt, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);
  const onExpireRef = useRef(onExpire);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasUnderOneHourRef = useRef(false);

  onExpireRef.current = onExpire;

  useEffect(() => {
    setMounted(true);
    if (!discountEndAt) return;

    const update = () => {
      const t = calcTimeLeft(discountEndAt);
      setTimeLeft(t);

      if (t.total <= 0) {
        onExpireRef.current?.();
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const isUnderOneHour = t.total < 60 * 60 * 1000;
      if (isUnderOneHour !== wasUnderOneHourRef.current) {
        wasUnderOneHourRef.current = isUnderOneHour;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(update, isUnderOneHour ? 1000 : 60000);
      }
    };

    update();
    const initialTime = calcTimeLeft(discountEndAt);
    const isUnderOneHour = initialTime.total < 60 * 60 * 1000;
    wasUnderOneHourRef.current = isUnderOneHour;
    intervalRef.current = setInterval(update, isUnderOneHour ? 1000 : 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [discountEndAt]);

  if (!mounted || !discountEndAt || !timeLeft || timeLeft.total <= 0) return null;

  return (
    <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
      <span className="text-orange-500">&#9200;</span>
      {formatTimeLeft(timeLeft)}
    </span>
  );
}
