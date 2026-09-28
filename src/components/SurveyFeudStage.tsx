import React, { useState } from 'react';
import { FeudQuestion } from '../types/game';
import { soundFX } from '../utils/soundEffects';
import { GameTimer } from './GameTimer';
import {
  Eye,
  RotateCcw,
  XOctagon,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface SurveyFeudStageProps {
  questions: FeudQuestion[];
  currentIndex: number;
  strikes: number;
  onSelectQuestion: (index: number) => void;
  onRevealAnswer: (questionId: string, answerId: string) => void;
  onRevealAllAnswers: (questionId: string) => void;
  onResetBoard: (questionId: string) => void;
  onTriggerStrike: () => void;
  onNextStage: () => void;
}

export const SurveyFeudStage: React.FC<SurveyFeudStageProps> = ({
  questions,
  currentIndex,
  strikes,
  onSelectQuestion,
  onRevealAnswer,
  onRevealAllAnswers,
  onResetBoard,
  onTriggerStrike,
  onNextStage,
}) => {
  const [showStrikeFlash, setShowStrikeFlash] = useState<boolean>(false);
  const [guessInput, setGuessInput] = useState<string>('');
  const [guessFeedback, setGuessFeedback] = useState<{
    type: 'match' | 'miss';
    text: string;
  } | null>(null);
  const [showBoardHint, setShowBoardHint] = useState<boolean>(false);
  const [revealedSlotHints, setRevealedSlotHints] = useState<Set<string>>(
    new Set()
  );
  const [timerResetCount, setTimerResetCount] = useState<number>(0);

  const safeIndex =
    questions.length > 0 ? Math.min(currentIndex, questions.length - 1) : 0;
  const currentQuestion = questions[safeIndex] || questions[0];

  if (!currentQuestion) {
    return null;
  }

  const revealedCount = currentQuestion.answers.filter((a) => a.revealed).length;
  const allRevealed = revealedCount === currentQuestion.answers.length;

  const handleFlipSlot = (answerId: string) => {
    soundFX.playRevealChime();
    onRevealAnswer(currentQuestion.id, answerId);
  };

  const handleToggleSlotHint = (e: React.MouseEvent, answerId: string) => {
    e.stopPropagation();
    soundFX.playHintChime();
    setRevealedSlotHints((prev) => {
      const next = new Set(prev);
      if (next.has(answerId)) {
        next.delete(answerId);
      } else {
        next.add(answerId);
      }
      return next;
    });
  };

  const handleSoundStrike = () => {
    soundFX.playStrikeBuzzer();
    onTriggerStrike();
    setShowStrikeFlash(true);
    window.setTimeout(() => {
      setShowStrikeFlash(false);
    }, 1000);
  };

  const handleCheckGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = guessInput.trim().toLowerCase();
    if (!cleaned) return;

    const words = cleaned.split(/\s+/).filter((w) => w.length >= 3);
    const searchTerms = words.length > 0 ? words : [cleaned];

    const matchedAnswer = currentQuestion.answers.find((ans) => {
      if (ans.revealed) return false;
      const ansLower = ans.text.toLowerCase();
      return (
        ansLower.includes(cleaned) ||
        searchTerms.some((term) => ansLower.includes(term))
      );
    });

    if (matchedAnswer) {
      handleFlipSlot(matchedAnswer.id);
      setGuessFeedback({
        type: 'match',
        text: `Survey Says: "${matchedAnswer.text}" (${matchedAnswer.points} pts)!`,
      });
      setGuessInput('');
    } else {
      handleSoundStrike();
      setGuessFeedback({
        type: 'miss',
        text: `"${guessInput.trim()}" is not on the survey board — Strike!`,
      });
      setGuessInput('');
    }
  };

  const handleToggleAllHints = () => {
    soundFX.playHintChime();
    const nextState = !showBoardHint;
    setShowBoardHint(nextState);
    if (nextState) {
      setRevealedSlotHints(
        new Set(currentQuestion.answers.map((a) => a.id))
      );
    } else {
      setRevealedSlotHints(new Set());
    }
  };

  const handleRevealNextUnrevealed = () => {
    const nextSlot = currentQuestion.answers.find((a) => !a.revealed);
    if (nextSlot) {
      handleFlipSlot(nextSlot.id);
    }
  };

  const handleSwitchBoard = (newIdx: number) => {
    soundFX.playSelect();
    setShowBoardHint(false);
    setRevealedSlotHints(new Set());
    setGuessFeedback(null);
    setGuessInput('');
    onSelectQuestion(newIdx);
  };

  return (
    <div className="relative space-y-5">
      {/* Strike Flash Broadcast Overlay */}
      {showStrikeFlash && (
        <div
          role="alert"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none"
        >
          <div className="bg-[#131B2E] border-2 border-red-500 rounded-2xl px-10 py-8 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-3">
              {Array.from({ length: Math.max(1, strikes) }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-400 font-display text-4xl sm:text-5xl font-bold"
                >
                  X
                </div>
              ))}
            </div>
            <p className="font-mono tabular-nums text-base sm:text-lg font-semibold text-red-300">
              Survey Strike {Math.max(1, strikes)} of 3 · Not on the Board!
            </p>
          </div>
        </div>
      )}

      {/* Board Number Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1">
            Select Survey Board:
          </span>
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => handleSwitchBoard(idx)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                idx === safeIndex
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-[#131B2E] hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              Board {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleSwitchBoard(
                (safeIndex - 1 + questions.length) % questions.length
              )
            }
            className="px-3.5 py-2 rounded-lg bg-[#131B2E] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchBoard((safeIndex + 1) % questions.length)}
            className="px-3.5 py-2 rounded-lg bg-[#131B2E] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Prompt & Active Strikes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">
              03. Workplace Survey Feud
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Board {safeIndex + 1} of {questions.length}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentQuestion.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-emerald-400 font-semibold">
              {revealedCount} / {currentQuestion.answers.length} Revealed
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
            “{currentQuestion.prompt}”
          </h2>
          <p className="text-xs text-slate-300">
            <strong>Google Meet Chat:</strong> Type your survey guesses in the chat! Click any card below to reveal a hint or flip the answer.
          </p>
        </div>

        {/* Strikes Counter */}
        <div className="flex items-center gap-4 bg-[#131B2E] border border-white/10 rounded-xl px-4 py-3 shrink-0 self-start lg:self-auto">
          <div>
            <div className="text-xs text-slate-400">Wrong Guess Strikes</div>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={handleSoundStrike}
                  title="Click to sound Strike Buzzer"
                  className={`font-mono text-xs font-bold px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    strikes >= num
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : 'bg-white/5 hover:bg-red-500/20 text-slate-400'
                  }`}
                >
                  X{num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Countdown Timer for Survey Feud */}
      <GameTimer
        defaultSeconds={45}
        resetKey={`feud-${safeIndex}-${currentQuestion.id}-${timerResetCount}`}
        isCompleted={allRevealed}
        label="Survey Board Timer"
        accentColor="amber"
      />

      {/* General Board Hint Banner */}
      {showBoardHint && (
        <div className="bg-amber-500/15 border border-amber-400/50 rounded-xl p-4 flex items-center gap-3 text-amber-100">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            <strong>Board Clue:</strong> {currentQuestion.generalHint}
          </p>
        </div>
      )}

      {/* Optional Quick Guess Checker for HR */}
      <form
        onSubmit={handleCheckGuess}
        className="bg-[#131B2E] border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Optional: Type a keyword from Google Meet chat (e.g. 'mute', 'screen', 'salary') & press Enter..."
            className="w-full bg-[#090D16] text-white text-xs sm:text-sm rounded-lg pl-10 pr-4 py-2.5 border border-white/10 focus:outline-none focus:border-amber-400"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap cursor-pointer"
        >
          Check Chat Guess
        </button>
      </form>

      {/* Feedback Banner if Guess Checked */}
      {guessFeedback && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            guessFeedback.type === 'match'
              ? 'bg-emerald-950/70 text-emerald-200 border-emerald-500/40'
              : 'bg-red-950/70 text-red-200 border-red-500/40'
          }`}
        >
          <span>{guessFeedback.text}</span>
          <button
            type="button"
            onClick={() => setGuessFeedback(null)}
            className="text-slate-300 hover:text-white ml-4 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 6-Slot Survey Flip Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.answers.map((ans, index) => {
          const isHintShown = showBoardHint || revealedSlotHints.has(ans.id);
          return (
            <div
              key={ans.id}
              onClick={() => {
                if (!ans.revealed) {
                  handleFlipSlot(ans.id);
                }
              }}
              className={`group relative w-full text-left rounded-xl p-4 sm:p-5 transition-colors border ${
                ans.revealed
                  ? 'bg-[#F8FAFC] text-[#090D16] border-2 border-amber-400'
                  : 'bg-[#131B2E] hover:bg-[#1B2945] text-white border-white/10 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-mono tabular-nums text-base font-bold flex items-center justify-center shrink-0 transition-colors ${
                      ans.revealed
                        ? 'bg-[#090D16] text-amber-400'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  {ans.revealed ? (
                    <span className="font-display text-base sm:text-lg font-bold text-slate-900">
                      {ans.text}
                    </span>
                  ) : (
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-200 block">
                        Top Survey Answer #{index + 1}
                      </span>
                      <span
                        className={`text-xs block ${
                          isHintShown
                            ? 'text-amber-300 font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        {isHintShown
                          ? `Hint: ${ans.hint}`
                          : `Click card to reveal answer (${ans.points} pts)`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!ans.revealed && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleSlotHint(e, ans.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      {isHintShown ? 'Hide Hint' : 'Hint'}
                    </button>
                  )}

                  <div
                    className={`px-3 py-1.5 rounded-lg font-mono tabular-nums text-xs sm:text-sm font-bold ${
                      ans.revealed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {ans.points}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prominent Host Controls */}
      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleAllHints}
            className="px-4 py-2.5 rounded-xl bg-[#131B2E] hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>
              {showBoardHint ? 'Hide All Hints' : '1. Show Hints for All 6 Answers'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRevealNextUnrevealed}
            disabled={allRevealed}
            className="px-4 py-2.5 rounded-xl bg-[#131B2E] hover:bg-slate-800 disabled:opacity-40 text-white border border-white/15 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>2. Reveal Next Slot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playRevealChime();
              onRevealAllAnswers(currentQuestion.id);
            }}
            disabled={allRevealed}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-emerald-600/30 disabled:text-emerald-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            <span>
              {allRevealed ? 'All 6 Answers Revealed' : 'Reveal All 6 Answers'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSoundStrike}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <XOctagon className="w-4 h-4" />
            <span>Strike Buzzer (X)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playSelect();
              setShowBoardHint(false);
              setRevealedSlotHints(new Set());
              setGuessFeedback(null);
              setTimerResetCount((c) => c + 1);
              onResetBoard(currentQuestion.id);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-[#131B2E] hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFX.playSelect();
            onNextStage();
          }}
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <span>Next Game: Emoji Decoder</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
