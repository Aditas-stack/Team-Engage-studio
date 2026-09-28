import React, { useState, useEffect } from 'react';
import { TriviaQuestion } from '../types/game';
import { soundFX } from '../utils/soundEffects';
import { GameTimer } from './GameTimer';
import {
  Eye,
  RotateCcw,
  Scissors,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface SpeedTriviaStageProps {
  questions: TriviaQuestion[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onNextStage: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const SpeedTriviaStage: React.FC<SpeedTriviaStageProps> = ({
  questions,
  currentIndex,
  onSelectIndex,
  onNextStage,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showTextHint, setShowTextHint] = useState(false);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [timerResetCount, setTimerResetCount] = useState<number>(0);

  const safeIndex =
    questions.length > 0 ? Math.min(currentIndex, questions.length - 1) : 0;
  const currentQ = questions[safeIndex] || questions[0];

  useEffect(() => {
    if (currentQ) {
      setSelectedOption(null);
      setIsRevealed(false);
      setShowTextHint(false);
      setEliminatedIndices([]);
    }
  }, [safeIndex, currentQ?.id]);

  if (!currentQ) return null;

  const handleShowTextHint = () => {
    soundFX.playHintChime();
    setShowTextHint((prev) => !prev);
  };

  const handleUseFiftyFifty = () => {
    if (eliminatedIndices.length > 0 || isRevealed) return;
    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIndex);
    const toEliminate = wrongIndices.slice(0, 2);
    setEliminatedIndices(toEliminate);
    soundFX.playHintChime();
  };

  const handleRevealAnswer = () => {
    setIsRevealed(true);
    soundFX.playRevealChime();
  };

  const handleResetQuestion = () => {
    soundFX.playSelect();
    setIsRevealed(false);
    setShowTextHint(false);
    setEliminatedIndices([]);
    setSelectedOption(null);
    setTimerResetCount((c) => c + 1);
  };

  const isLastQuestion = safeIndex === questions.length - 1;

  return (
    <div className="space-y-5">
      {/* Question Number Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1">
            Select Question:
          </span>
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                soundFX.playSelect();
                onSelectIndex(idx);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                idx === safeIndex
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-[#131B2E] hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              Q{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundFX.playSelect();
              onSelectIndex((safeIndex - 1 + questions.length) % questions.length);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#131B2E] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playSelect();
              onSelectIndex((safeIndex + 1) % questions.length);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#131B2E] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="text-amber-400 font-semibold">
            02. Speed Trivia
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Question {safeIndex + 1} of {questions.length}
          </span>
          <span aria-hidden="true">·</span>
          <span>{currentQ.category}</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
          {currentQ.question}
        </h2>
        <p className="text-xs text-slate-300">
          <strong>Google Meet Chat:</strong> Type{' '}
          <strong className="font-mono text-amber-300">A</strong>,{' '}
          <strong className="font-mono text-amber-300">B</strong>,{' '}
          <strong className="font-mono text-amber-300">C</strong>, or{' '}
          <strong className="font-mono text-amber-300">D</strong> in the chat!
        </p>
      </div>

      {/* Live Countdown Timer for Speed Trivia */}
      <GameTimer
        defaultSeconds={currentQ.timeLimitSec || 20}
        resetKey={`trivia-${safeIndex}-${currentQ.id}-${timerResetCount}`}
        isCompleted={isRevealed}
        label="Trivia Question Timer"
        accentColor="amber"
      />

      {/* Hint Banner (When Hint 1 Clicked) */}
      {showTextHint && (
        <div className="bg-amber-500/15 border border-amber-400/50 rounded-xl p-4 flex items-center gap-3 text-amber-100">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{currentQ.hintText}</p>
        </div>
      )}

      {/* 4 Multiple Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQ.options.map((opt, idx) => {
          const isEliminated = eliminatedIndices.includes(idx);
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQ.correctIndex;

          let cardStyle =
            'bg-[#131B2E] hover:bg-[#1B2945] text-white border-white/10';
          let badgeStyle = 'bg-white/10 text-amber-300';
          let statusLabel = '';

          if (isEliminated && !isRevealed) {
            cardStyle =
              'bg-[#090D16] text-slate-600 border-white/5 opacity-40 cursor-not-allowed';
            badgeStyle = 'bg-white/5 text-slate-600';
            statusLabel = 'ELIMINATED (50/50)';
          } else if (isRevealed) {
            if (isCorrect) {
              cardStyle =
                'bg-emerald-950/85 text-emerald-100 border-2 border-emerald-400';
              badgeStyle = 'bg-emerald-500 text-slate-950';
              statusLabel = 'CORRECT';
            } else if (isSelected) {
              cardStyle = 'bg-red-950/60 text-red-200 border-red-500/60';
              badgeStyle = 'bg-red-500 text-white';
              statusLabel = 'INCORRECT';
            } else {
              cardStyle = 'bg-[#131B2E]/50 text-slate-400 border-white/5';
            }
          } else if (isSelected) {
            cardStyle = 'bg-amber-500/15 text-amber-100 border-amber-400';
            badgeStyle = 'bg-amber-400 text-slate-950';
            statusLabel = 'SELECTED';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isEliminated && !isRevealed}
              onClick={() => {
                if (!isRevealed) {
                  soundFX.playSelect();
                  setSelectedOption(idx);
                }
              }}
              className={`w-full text-left rounded-xl p-4 sm:p-5 border transition-colors cursor-pointer flex items-center justify-between gap-4 ${cardStyle}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`w-11 h-11 rounded-xl font-mono text-lg font-bold flex items-center justify-center shrink-0 ${badgeStyle}`}
                >
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="text-base sm:text-lg font-semibold leading-snug">
                  {opt}
                </span>
              </div>

              {statusLabel && (
                <span className="font-mono tabular-nums text-xs font-bold shrink-0">
                  {statusLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Official Answer & Fun Fact Callout on Reveal */}
      {isRevealed && (
        <div className="bg-emerald-950/85 border-2 border-emerald-400 rounded-2xl p-5 sm:p-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Official Answer Revealed</span>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white">
            Option {OPTION_LETTERS[currentQ.correctIndex]} —{' '}
            {currentQ.options[currentQ.correctIndex]}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
            {currentQ.funFact}
          </p>
        </div>
      )}

      {/* Prominent Host Controls: HINT 1 + HINT 2 (50/50) + REVEAL ANSWER + NEXT */}
      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleShowTextHint}
            className="px-4 py-2.5 rounded-xl bg-[#131B2E] hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>
              {showTextHint ? 'Hide Clue Hint' : '1. Show Hint 1 (Clue)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleUseFiftyFifty}
            disabled={eliminatedIndices.length > 0 || isRevealed}
            className="px-4 py-2.5 rounded-xl bg-[#131B2E] hover:bg-slate-800 disabled:opacity-40 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>
              {eliminatedIndices.length > 0
                ? '50/50 Hint Active'
                : '2. 50/50 Hint (Remove 2 Wrong)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRevealAnswer}
            disabled={isRevealed}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-emerald-600/30 disabled:text-emerald-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            <span>
              {isRevealed
                ? `Answer: Option ${OPTION_LETTERS[currentQ.correctIndex]}`
                : 'Reveal Answer'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetQuestion}
            className="px-3.5 py-2.5 rounded-xl bg-[#131B2E] hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isLastQuestion ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playSelect();
                onSelectIndex(safeIndex + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Next Question (Q{safeIndex + 2})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundFX.playSelect();
                onNextStage();
              }}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Next Game: Survey Feud</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
