import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Plus, AlertTriangle } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface GameTimerProps {
  defaultSeconds?: number;
  resetKey?: string | number;
  isCompleted?: boolean;
  label?: string;
  accentColor?: 'emerald' | 'amber' | 'pink';
  onTimeUp?: () => void;
}

const PRESET_DURATIONS = [15, 20, 30, 45, 60];

export const GameTimer: React.FC<GameTimerProps> = ({
  defaultSeconds = 30,
  resetKey,
  isCompleted = false,
  label = 'Round Timer',
  accentColor = 'amber',
  onTimeUp,
}) => {
  const [duration, setDuration] = useState<number>(defaultSeconds);
  const [timeLeft, setTimeLeft] = useState<number>(defaultSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Sync default duration when question/stage changes
  useEffect(() => {
    setDuration(defaultSeconds);
    setTimeLeft(defaultSeconds);
    setIsRunning(false);
    setIsTimeUp(false);
  }, [defaultSeconds, resetKey]);

  // Stop timer automatically when round/question is completed or revealed
  useEffect(() => {
    if (isCompleted && isRunning) {
      setIsRunning(false);
    }
  }, [isCompleted, isRunning]);

  // Countdown interval
  useEffect(() => {
    if (!isRunning || isCompleted) return;

    if (timeLeft <= 0) {
      setIsRunning(false);
      setIsTimeUp(true);
      soundFX.playStrikeBuzzer();
      if (onTimeUp) {
        onTimeUp();
      }
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next > 0) {
          soundFX.playTimerTick(next <= 5);
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isRunning, timeLeft, isCompleted, onTimeUp]);

  const handleToggleStartPause = () => {
    soundFX.playSelect();
    if (timeLeft <= 0) {
      setTimeLeft(duration);
      setIsTimeUp(false);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    soundFX.playSelect();
    setIsRunning(false);
    setIsTimeUp(false);
    setTimeLeft(duration);
  };

  const handleSelectPreset = (sec: number) => {
    soundFX.playSelect();
    setIsRunning(false);
    setIsTimeUp(false);
    setDuration(sec);
    setTimeLeft(sec);
  };

  const handleAddTenSeconds = () => {
    soundFX.playSelect();
    setIsTimeUp(false);
    setTimeLeft((prev) => prev + 10);
    setDuration((prev) => Math.max(prev, timeLeft + 10));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (timeLeft / duration) * 100)) : 0;

  const isUrgent = timeLeft > 0 && timeLeft <= 5;
  const isWarning = timeLeft > 5 && timeLeft <= 10;

  const primaryBtnStyles = {
    emerald: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    pink: 'bg-[#FF4F8B] hover:bg-[#FF4F8B]/90 text-white',
  }[accentColor];

  const activePresetStyles = {
    emerald: 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-bold',
    amber: 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold',
    pink: 'bg-[#FF4F8B]/25 border-[#FF4F8B] text-pink-200 font-bold',
  }[accentColor];

  const barColor =
    timeLeft === 0
      ? 'bg-rose-500'
      : isUrgent
      ? 'bg-rose-500'
      : isWarning
      ? 'bg-amber-400'
      : accentColor === 'emerald'
      ? 'bg-emerald-400'
      : accentColor === 'pink'
      ? 'bg-[#FF4F8B]'
      : 'bg-amber-400';

  return (
    <div
      className={`rounded-2xl border transition-all p-3.5 sm:p-4 bg-[#131B2E]/95 ${
        isTimeUp
          ? 'border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
          : isUrgent && isRunning
          ? 'border-rose-500/60'
          : 'border-white/10'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Digital Clock & Label */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isTimeUp
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-bounce'
                : isUrgent && isRunning
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-white/5 border-white/10 text-amber-400'
            }`}
          >
            {isTimeUp ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                {label}
              </span>
              {isTimeUp && (
                <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  Time’s Up!
                </span>
              )}
              {isRunning && !isTimeUp && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold uppercase">
                  Live
                </span>
              )}
            </div>

            <div
              className={`font-mono tabular-nums text-2xl sm:text-3xl font-extrabold leading-tight ${
                isTimeUp
                  ? 'text-rose-400'
                  : isUrgent
                  ? 'text-rose-400'
                  : isWarning
                  ? 'text-amber-300'
                  : 'text-white'
              }`}
            >
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Center: Quick Duration Presets */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1 hidden xl:inline">
            Set:
          </span>
          {PRESET_DURATIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleSelectPreset(sec)}
              className={`px-2 py-1 rounded-lg font-mono text-xs border transition-colors cursor-pointer ${
                duration === sec && timeLeft === sec && !isRunning
                  ? activePresetStyles
                  : 'bg-[#090D16]/80 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
              title={`Set timer to ${sec} seconds`}
            >
              {sec}s
            </button>
          ))}
          <button
            type="button"
            onClick={handleAddTenSeconds}
            className="px-2 py-1 rounded-lg font-mono text-xs bg-[#090D16]/80 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 cursor-pointer transition-colors"
            title="Add 10 seconds"
          >
            <Plus className="w-3 h-3" />
            <span>10s</span>
          </button>
        </div>

        {/* Right: Start / Pause / Reset Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleStartPause}
            disabled={isCompleted}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 ${
              isRunning
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : primaryBtnStyles
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{timeLeft === 0 ? 'Restart Timer' : 'Start Timer'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset timer"
            title="Reset Timer"
            className="p-2 rounded-xl bg-[#090D16] hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 w-full h-1.5 bg-[#090D16] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
