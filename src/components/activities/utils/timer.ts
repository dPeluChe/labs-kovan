import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Formatear segundos a formato MM:SS
 * @param seconds - Segundos a formatear
 * @returns String en formato MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Hook para manejar un countdown timer
 * @param initialSeconds - Segundos iniciales
 * @param onTick - Callback cada segundo
 * @param onComplete - Callback al terminar
 * @param autoStart - Iniciar automáticamente (default: false)
 * @returns Objeto con estado y controles del timer
 */
export function useCountdown(
  initialSeconds: number,
  onTick?: (secondsLeft: number) => void,
  onComplete?: () => void,
  autoStart: boolean = false
) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    pause();
    const seconds = newSeconds ?? initialSeconds;
    setSecondsLeft(seconds);
  }, [initialSeconds, pause]);

  const addTime = useCallback((seconds: number) => {
    setSecondsLeft((prev) => prev + seconds);
  }, []);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          const newSeconds = prev - 1;
          onTick?.(newSeconds);

          if (newSeconds <= 0) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }

          return newSeconds;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsLeft, onTick, onComplete]);

  return {
    secondsLeft,
    isRunning,
    start,
    pause,
    reset,
    addTime,
    percentage: (secondsLeft / initialSeconds) * 100,
  };
}

/**
 * Hook para manejar un stopwatch (cronómetro hacia adelante)
 * @param onTick - Callback cada segundo
 * @returns Objeto con estado y controles del stopwatch
 */
export function useStopwatch(onTick?: (seconds: number) => void) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setSeconds(0);
  }, [pause]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          onTick?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTick]);

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatTime(seconds),
  };
}
