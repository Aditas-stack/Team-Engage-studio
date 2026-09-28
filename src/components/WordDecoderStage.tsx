import React, { useState, useEffect } from 'react';
import { DecoderPuzzle } from '../types/game';
import { soundFX } from '../utils/soundEffects';
import { GameTimer } from './GameTimer';
import {
  Sparkles,
  Eye,
  Lightbulb,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Send,
  ArrowRight,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface WordDecoderStageProps {
  puzzles: DecoderPuzzle[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onNextStage: () => void;
}

export const WordDecoderStage: React.FC<WordDecoderStageProps> = ({
  puzzles,
  currentIndex,
  onSelectIndex,
  onNextStage,
}) => {
  const currentPuzzle = puzzles[currentIndex] || puzzles[0];
  const normalizedAnswer = currentPuzzle.answer.toUpperCase();

  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [showClueNote, setShowClueNote] = useState(false);
  const [phraseGuess, setPhraseGuess] = useState('');
  const [guessFeedback, setGuessFeedback] = useState<{
    type: 'match' | 'miss';
    text: string;
  } | null>(null);
  const [timerResetCount, setTimerResetCount] = useState<number>(0);

  useEffect(() => {
    setRevealedIndices(new Set());
    setShowClueNote(false);
    setPhraseGuess('');
    setGuessFeedback(null);
  }, [currentIndex, currentPuzzle?.id]);

  // Check if all alphabetic characters are revealed
  const isFullySolved = normalizedAnswer.split('').every((char, idx) => {
    if (!/[A-Z0-9]/.test(char)) return true;
    return revealedIndices.has(idx);
  });

  const handleToggleMeaningHint = () => {
    if (!showClueNote) {
      soundFX.playHintReveal();
    } else {
      soundFX.playSelect();
    }
    setShowClueNote(!showClueNote);
  };

  const handleRevealRandomLetter = () => {
    const hiddenIndices: number[] = [];
    normalizedAnswer.split('').forEach((char, idx) => {
      if (/[A-Z0-9]/.test(char) && !revealedIndices.has(idx)) {
        hiddenIndices.push(idx);
      }
    });

    if (hiddenIndices.length === 0) return;
    const randomIdx =
      hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    const targetChar = normalizedAnswer[randomIdx];

    // Reveal all occurrences of that letter for fairness & clarity
    const nextSet = new Set(revealedIndices);
    normalizedAnswer.split('').forEach((char, idx) => {
      if (char === targetChar) {
        nextSet.add(idx);
      }
    });

    soundFX.playReveal();
    setRevealedIndices(nextSet);
  };

  const handleRevealSingleIndex = (idx: number) => {
    if (revealedIndices.has(idx)) return;
    const nextSet = new Set(revealedIndices);
    nextSet.add(idx);
    soundFX.playSelect();
    setRevealedIndices(nextSet);
  };

  const handleSolveAll = () => {
    const allIndices = new Set<number>();
    normalizedAnswer.split('').forEach((_, idx) => allIndices.add(idx));
    soundFX.playFanfare();
    setRevealedIndices(allIndices);
    setShowClueNote(true);
  };

  const handleResetPuzzle = () => {
    soundFX.playSelect();
    setRevealedIndices(new Set());
    setShowClueNote(false);
    setGuessFeedback(null);
    setTimerResetCount((c) => c + 1);
  };

  const handleVerifyGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedGuess = phraseGuess
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '');
    const cleanedAnswer = normalizedAnswer.replace(/[^A-Z0-9 ]/g, '');
    if (!cleanedGuess) return;

    if (cleanedGuess === cleanedAnswer) {
      handleSolveAll();
      setGuessFeedback({
        type: 'match',
        text: `CORRECT! "${currentPuzzle.answer}"`,
      });
      setPhraseGuess('');
    } else {
      soundFX.playStrike();
      setGuessFeedback({
        type: 'miss',
        text: `"${phraseGuess.toUpperCase()}" is not quite right — keep watching the Google Meet chat!`,
      });
    }
  };

  // Group into words so wrapping never breaks a word mid-line
  const words = normalizedAnswer.split(' ');
  let globalCharIndex = 0;

  return (
    <div className="flex flex-col h-full justify-between gap-4 select-none">
      {/* Top Bar: Puzzle Selector Tabs + Google Meet Chat Instruction */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono uppercase tracking-widest text-[#FF4F8B] font-semibold mr-1">
            EMOJI DECODER:
          </span>
          {puzzles.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                soundFX.playSelect();
                onSelectIndex(idx);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'bg-[#FF4F8B] text-white shadow-[0_0_16px_rgba(255,79,139,0.4)]'
                  : 'bg-white/5 text-[#A9B4D0] hover:bg-white/15 hover:text-white border border-white/10'
              }`}
            >
              Puzzle #{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-300">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Google Meet Chat:</strong> Type the decoded phrase in the chat!
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundFX.playSelect();
                onSelectIndex(Math.max(0, currentIndex - 1));
              }}
              disabled={currentIndex === 0}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 border border-white/10 transition-colors cursor-pointer"
              title="Previous Puzzle"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundFX.playSelect();
                onSelectIndex(Math.min(puzzles.length - 1, currentIndex + 1));
              }}
              disabled={currentIndex === puzzles.length - 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 border border-white/10 transition-colors cursor-pointer"
              title="Next Puzzle"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Countdown Timer for Emoji Decoder */}
      <GameTimer
        defaultSeconds={30}
        resetKey={`decoder-${currentIndex}-${currentPuzzle?.id}-${timerResetCount}`}
        isCompleted={isFullySolved}
        label="Emoji Decode Timer"
        accentColor="pink"
      />

      {/* Clue Showcase Hero */}
      <div className="studio-glass rounded-2xl p-6 border border-[#FF4F8B]/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#FF4F8B] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentPuzzle.category}</span>
        </div>

        <div className="text-5xl md:text-6xl tracking-widest my-2 py-2 select-all">
          {currentPuzzle.clues}
        </div>

        {/* Dedicated Meaning Hint Banner */}
        {showClueNote ? (
          <div className="mt-3 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFD166] text-sm md:text-base font-medium animate-in fade-in duration-200">
            <Lightbulb className="w-5 h-5 text-[#FFB800] shrink-0" />
            <span>
              <strong>Hint:</strong> {currentPuzzle.clueNote}
            </span>
          </div>
        ) : (
          <p className="text-xs text-[#A9B4D0] mt-2">
            Need help? HR can click <strong>&ldquo;1. Show Meaning Hint&rdquo;</strong> or{' '}
            <strong>&ldquo;2. Reveal 1 Letter Hint&rdquo;</strong> below!
          </p>
        )}
      </div>

      {/* Letter Tile Board */}
      <div className="studio-glass rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center min-h-[165px]">
        <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 max-w-4xl">
          {words.map((word, wIdx) => {
            const wordChars = word.split('');
            const wordElement = (
              <div key={wIdx} className="flex items-center gap-1.5">
                {wordChars.map((char) => {
                  const charIndex = globalCharIndex++;
                  const isAlphaNum = /[A-Z0-9]/.test(char);
                  const isRevealed = revealedIndices.has(charIndex) || !isAlphaNum;

                  return (
                    <button
                      key={charIndex}
                      onClick={() => handleRevealSingleIndex(charIndex)}
                      title={
                        isRevealed
                          ? char
                          : 'Click any tile to reveal this specific letter'
                      }
                      className={`w-10 h-12 md:w-12 md:h-14 rounded-xl font-mono text-xl md:text-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isRevealed
                          ? isFullySolved
                            ? 'bg-emerald-500/25 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105'
                            : 'bg-[#FFB800]/20 border-2 border-[#FFB800] text-[#FFF8E7] shadow-[0_0_15px_rgba(255,184,0,0.2)]'
                          : 'bg-[#0F172A]/90 border-2 border-white/20 text-transparent hover:border-[#FF4F8B]/60 hover:bg-white/5'
                      }`}
                    >
                      {isRevealed ? char : '?'}
                    </button>
                  );
                })}
              </div>
            );
            // Increment for the space between words
            globalCharIndex++;
            return wordElement;
          })}
        </div>

        <div className="mt-4 text-xs text-[#A9B4D0] font-mono">
          {isFullySolved ? (
            <span className="text-emerald-400 font-bold uppercase tracking-wider">
              ★ PUZZLE SOLVED: {currentPuzzle.answer} ★
            </span>
          ) : (
            <span>
              HR Tip: Click any tile above to reveal a single letter, or use the Hint &amp; Answer buttons below.
            </span>
          )}
        </div>
      </div>

      {/* HR Hint & Answer Controls + Optional Chat Verifier */}
      <div className="flex flex-col gap-3">
        {/* Optional Chat Phrase Checker */}
        <form onSubmit={handleVerifyGuess} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={phraseGuess}
              onChange={(e) => {
                setPhraseGuess(e.target.value);
                if (guessFeedback) setGuessFeedback(null);
              }}
              placeholder="Optional: Type a guess from Google Meet chat here to test if it's right..."
              className="w-full bg-[#090D16]/90 border border-white/15 focus:border-[#FF4F8B] rounded-xl pl-4 pr-4 py-2.5 text-sm text-white placeholder-[#A9B4D0]/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4 text-[#FF4F8B]" />
            <span>Check Answer</span>
          </button>
        </form>

        {guessFeedback && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-mono flex items-center justify-between ${
              guessFeedback.type === 'match'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{guessFeedback.text}</span>
            <button
              onClick={() => setGuessFeedback(null)}
              className="text-xs underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bottom HR Host Bar: Step-by-Step Hints & Answer Reveal */}
        <div className="studio-glass rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleToggleMeaningHint}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
                showClueNote
                  ? 'bg-[#FFB800]/25 border-[#FFB800] text-[#FFD166]'
                  : 'bg-[#FFB800]/10 hover:bg-[#FFB800]/20 border-[#FFB800]/40 text-[#FFB800]'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>
                {showClueNote ? 'Hide Meaning Hint' : '1. Show Meaning Hint'}
              </span>
            </button>

            <button
              onClick={handleRevealRandomLetter}
              disabled={isFullySolved}
              className="px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 disabled:opacity-40 border border-purple-400/40 text-purple-200 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-purple-300" />
              <span>2. Reveal 1 Letter Hint</span>
            </button>

            <button
              onClick={handleSolveAll}
              disabled={isFullySolved}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Eye className="w-4 h-4" />
              <span>Reveal Full Answer</span>
            </button>

            <button
              onClick={handleResetPuzzle}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#A9B4D0] hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Next Puzzle / Next Game */}
          <div className="flex items-center gap-2">
            {currentIndex < puzzles.length - 1 ? (
              <button
                onClick={() => {
                  soundFX.playSelect();
                  onSelectIndex(currentIndex + 1);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#FF4F8B] hover:bg-[#FF4F8B]/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Next Puzzle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFX.playSelect();
                  onNextStage();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF4F8B] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Go to Lucky Winner Draw</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
