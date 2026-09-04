"use client";

import { useState, useEffect } from "react";
import { MISSION_CONFIG, MissionPhase } from "@/config/mission";

export function useMissionStatus() {
  const [currentPhase, setCurrentPhase] = useState<MissionPhase | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const calculateStatus = () => {
      const now = new Date();
      let activePhase: MissionPhase | null = null;
      let targetDate: Date | null = null;

      for (const phase of MISSION_CONFIG.phases) {
        const start = new Date(phase.startDate);
        const end = new Date(phase.endDate);
        
        if (now >= start && now <= end) {
          activePhase = phase;
          targetDate = end;
          break;
        } else if (now < start && !activePhase) {
          // If we haven't started yet, countdown to first phase
          activePhase = phase;
          targetDate = start;
          break;
        }
      }

      if (!activePhase) {
        setIsCompleted(true);
        setCurrentPhase({
          id: "completed",
          name: "Completed",
          startDate: "",
          endDate: ""
        });
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCurrentPhase(activePhase);

      if (targetDate) {
        const difference = targetDate.getTime() - now.getTime();
        
        if (difference > 0) {
          setCountdown({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
        }
      }
    };

    calculateStatus();
    const timer = setInterval(calculateStatus, 1000);

    return () => clearInterval(timer);
  }, []);

  return { currentPhase, countdown, isCompleted };
}
