'use client';

import { useState, useEffect } from 'react';

interface CrowdGaugeProps {
  value: number;
  label?: string;
  size?: number;
}

export default function CrowdGauge({ value, label, size = 120 }: CrowdGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const getColor = (val: number) => {
    if (val <= 30) return '#10b981'; // green
    if (val <= 60) return '#f59e0b'; // yellow
    if (val <= 80) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const color = getColor(animatedValue);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          {/* Animated circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{animatedValue}%</span>
        </div>
      </div>
      {label && (
        <p className="mt-2 text-sm font-medium text-gray-600">{label}</p>
      )}
    </div>
  );
}
