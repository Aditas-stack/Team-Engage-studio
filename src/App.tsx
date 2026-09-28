import React, { useState, useEffect } from 'react';
import {
  GameState,
  NaijaSongQuestion,
  FeudQuestion,
  TriviaQuestion,
  DecoderPuzzle,
  PrizeItem,
} from './types/game';
import {
  DEFAULT_NAIJA_SONGS,
  DEFAULT_FEUD_QUESTIONS,
  DEFAULT_TRIVIA_QUESTIONS,
  DEFAULT_DECODER_PUZZLES,
  DEFAULT_PRIZES,
} from './data/defaultTownhallData';
import { NaijaSongStage } from './components/NaijaSongStage';
import { SpeedTriviaStage } from './components/SpeedTriviaStage';
import { SurveyFeudStage } from './components/SurveyFeudStage';
import { WordDecoderStage } from './components/WordDecoderStage';
import { WinnerDrawStage } from './components/WinnerDrawStage';
import { HostStudioModal } from './components/HostStudioModal';
import { soundFX } from './utils/soundEffects';

import trophyImgUrl from './assets/images/townhall_trophy_emblem_1790586684300.jpg';
import backdropImgUrl from './assets/images/stage_velvet_backdrop_1790586698888.jpg';
import ticketImgUrl from './assets/images/golden_raffle_ticket_1790586709644.jpg';

import {
  Music,
  HelpCircle,
  LayoutGrid,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Settings,
  Play,
  Lightbulb,
  Eye,
  PartyPopper,
  XOctagon,
} from 'lucide-react';

const STORAGE_KEY = 'team_engage_studio_v5';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [muted, setMuted] = useState<boolean>(false);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [setupInitialTab, setSetupInitialTab] = useState<
    'SONGS' | 'TRIVIA' | 'DECODER' | 'PRIZES' | 'GITHUB'
  >('SONGS');

  // Game Content State
  const [naijaSongs, setNaijaSongs] =
    useState<NaijaSongQuestion[]>(DEFAULT_NAIJA_SONGS);
  const [feudQuestions, setFeudQuestions] = useState<FeudQuestion[]>(
    DEFAULT_FEUD_QUESTIONS
  );
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>(
    DEFAULT_TRIVIA_QUESTIONS
  );
  const [decoderPuzzles, setDecoderPuzzles] = useState<DecoderPuzzle[]>(
    DEFAULT_DECODER_PUZZLES
  );
  const [prizes, setPrizes] = useState<PrizeItem[]>(DEFAULT_PRIZES);

  // Active indices per game mode
  const [currentSongIdx, setCurrentSongIdx] = useState<number>(0);
  const [currentTriviaIdx, setCurrentTriviaIdx] = useState<number>(0);
  const [currentFeudIdx, setCurrentFeudIdx] = useState<number>(0);
  const [currentDecoderIdx, setCurrentDecoderIdx] = useState<number>(0);
  const [feudStrikes, setFeudStrikes] = useState<number>(0);

  // Load saved custom items from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.naijaSongs) && parsed.naijaSongs.length > 0) {
          const defaultAudioMap = new Map(
            DEFAULT_NAIJA_SONGS.map((s) => [s.id, s.audioUrl])
          );
          setNaijaSongs(
            parsed.naijaSongs.map((song: NaijaSongQuestion) =>
              defaultAudioMap.has(song.id)
                ? { ...song, audioUrl: defaultAudioMap.get(song.id) }
                : song
            )
          );
        }
        if (
          Array.isArray(parsed.feudQuestions) &&
          parsed.feudQuestions.length > 0
        ) {
          setFeudQuestions(parsed.feudQuestions);
        }
        if (
          Array.isArray(parsed.triviaQuestions) &&
          parsed.triviaQuestions.length > 0
        ) {
          setTriviaQuestions(parsed.triviaQuestions);
        }
        if (
          Array.isArray(parsed.decoderPuzzles) &&
          parsed.decoderPuzzles.length > 0
        ) {
          setDecoderPuzzles(parsed.decoderPuzzles);
        }
        if (Array.isArray(parsed.prizes) && parsed.prizes.length > 0) {
          setPrizes(parsed.prizes);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          naijaSongs,
          feudQuestions,
          triviaQuestions,
          decoderPuzzles,
          prizes,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [naijaSongs, feudQuestions, triviaQuestions, decoderPuzzles, prizes]);

  // Stop any playing beat when switching game stages
  const handleSwitchStage = (nextState: GameState) => {
    soundFX.stopAfrobeatLoop();
    soundFX.playSelect();
    setGameState(nextState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    soundFX.muted = nextMuted;
    if (nextMuted) {
      soundFX.stopAfrobeatLoop();
    }
  };

  // Survey Feud Handlers
  const handleRevealFeudAnswer = (questionId: string, answerId: string) => {
    setFeudQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          answers: q.answers.map((a) =>
            a.id === answerId ? { ...a, revealed: true } : a
          ),
        };
      })
    );
  };

  const handleRevealAllFeudAnswers = (questionId: string) => {
    setFeudQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          answers: q.answers.map((a) => ({ ...a, revealed: true })),
        };
      })
    );
  };

  const handleResetFeudBoard = (questionId: string) => {
    setFeudStrikes(0);
    setFeudQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          answers: q.answers.map((a) => ({ ...a, revealed: false })),
        };
      })
    );
  };

  const handleTriggerStrike = () => {
    setFeudStrikes((prev) => (prev < 3 ? prev + 1 : 1));
  };

  // Prize Handlers
  const handleAssignPrizeResult = (prizeId: string, winningResult: string) => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setPrizes((prev) =>
      prev.map((p) =>
        p.id === prizeId ? { ...p, winningResult, drawnAt: timeStr } : p
      )
    );
  };

  const handleResetPrizeResult = (prizeId: string) => {
    setPrizes((prev) =>
      prev.map((p) =>
        p.id === prizeId
          ? { ...p, winningResult: undefined, drawnAt: undefined }
          : p
      )
    );
  };

  const handleResetAllDefaults = () => {
    soundFX.stopAfrobeatLoop();
    setNaijaSongs(DEFAULT_NAIJA_SONGS);
    setFeudQuestions(DEFAULT_FEUD_QUESTIONS);
    setTriviaQuestions(DEFAULT_TRIVIA_QUESTIONS);
    setDecoderPuzzles(DEFAULT_DECODER_PUZZLES);
    setPrizes(DEFAULT_PRIZES);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#090D16] text-[#F8FAFC] flex flex-col">
      {/* Studio Backdrop Image + Spotlight Gradient */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-15 pointer-events-none"
        style={{ backgroundImage: `url(${backdropImgUrl})` }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 15%, rgba(124, 58, 237, 0.22) 0%, rgba(9, 13, 22, 0.96) 75%)',
        }}
      />

      {/* TOP NAVIGATION BAR (Strict 3-Zone Contract + Responsive Mobile Stage Bar) */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090D16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Single Text Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleSwitchStage('TITLE_MENU')}
            className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white hover:text-amber-400 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            Team Engage Studio
          </button>

          {/* Zone 2: Desktop Navigation Links (5 clean stage links) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => handleSwitchStage('NAIJA_SONGS')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                gameState === 'NAIJA_SONGS'
                  ? 'text-white border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              1. Naija Songs
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('SPEED_TRIVIA')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                gameState === 'SPEED_TRIVIA'
                  ? 'text-white border-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              2. Speed Trivia
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('SURVEY_FEUD')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                gameState === 'SURVEY_FEUD'
                  ? 'text-white border-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              3. Survey Feud
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('WORD_DECODER')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                gameState === 'WORD_DECODER'
                  ? 'text-white border-pink-400 font-semibold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              4. Emoji Decoder
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('WINNER_DRAW')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                gameState === 'WINNER_DRAW'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              5. Lucky Draw
            </button>
          </nav>

          {/* Zone 3: Primary Actions (Deploy on GitHub + Customize Games + Audio Mute) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFX.playSelect();
                setSetupInitialTab('GITHUB');
                setIsSetupOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              <span>Deploy on GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playSelect();
                setSetupInitialTab('SONGS');
                setIsSetupOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Customize Games</span>
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                muted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
              }`}
              title={muted ? 'Unmute Studio Audio' : 'Mute Studio Audio'}
              aria-label={muted ? 'Unmute Studio Audio' : 'Mute Studio Audio'}
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Sub-Bar for Mobile/Tablet Stage Switching + Quick HR Soundboard */}
      <div className="relative z-20 border-b border-white/10 bg-[#0D1322]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
          {/* Compact Stage Switcher (Always accessible on Mobile, Tablet & Split-Screen) */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => handleSwitchStage('TITLE_MENU')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                gameState === 'TITLE_MENU'
                  ? 'bg-white text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              All Games
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('NAIJA_SONGS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                gameState === 'NAIJA_SONGS'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              1. Naija Songs
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('SPEED_TRIVIA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                gameState === 'SPEED_TRIVIA'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              2. Speed Trivia
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('SURVEY_FEUD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                gameState === 'SURVEY_FEUD'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              3. Survey Feud
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('WORD_DECODER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                gameState === 'WORD_DECODER'
                  ? 'bg-pink-500 text-white font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              4. Emoji Decoder
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStage('WINNER_DRAW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                gameState === 'WINNER_DRAW'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-white/5 text-amber-300 hover:bg-white/10'
              }`}
            >
              5. Lucky Draw
            </button>
          </div>

          {/* Instant HR Sound Effects for Google Meet Chat Reactions */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Meet Chat SoundFX:
            </span>
            <button
              type="button"
              onClick={() => soundFX.playWinnerFanfare()}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Cheer Winner</span>
            </button>
            <button
              type="button"
              onClick={() => soundFX.playStrikeBuzzer()}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <XOctagon className="w-3.5 h-3.5" />
              <span>Wrong Buzzer</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN FULL-WIDTH RESPONSIVE STAGE CANVAS */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {gameState === 'TITLE_MENU' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="studio-glass rounded-3xl p-6 sm:p-8 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <span>One-Way HR Screen Share</span>
                  <span aria-hidden="true">·</span>
                  <span>Employees Type Answers in Google Meet Chat</span>
                  <span aria-hidden="true">·</span>
                  <span>Zero Name Entry Required</span>
                </div>

                <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-tight">
                  Team Engagement Game Show Studio
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Share this window on Google Meet with{' '}
                  <strong className="text-white">“Share tab audio”</strong>{' '}
                  enabled. Every game includes step-by-step{' '}
                  <strong className="text-amber-400">Hints</strong> and{' '}
                  <strong className="text-emerald-400">Reveal Answer</strong>{' '}
                  controls while teammates race to answer in the Google Meet chat.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchStage('NAIJA_SONGS')}
                    className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Game 1: Naija Song Quiz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchStage('WINNER_DRAW')}
                    className="px-5 py-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-display font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Open 1–20 Lucky Number &amp; Prize Wheel</span>
                  </button>
                </div>
              </div>

              <div className="shrink-0 hidden sm:flex flex-col items-center">
                <img
                  src={trophyImgUrl}
                  alt="Team Engagement Trophy"
                  referrerPolicy="no-referrer"
                  className="w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover border border-amber-400/40"
                />
              </div>
            </div>

            {/* 5 Interactive Townhall Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Naija Hit Songs */}
              <button
                type="button"
                onClick={() => handleSwitchStage('NAIJA_SONGS')}
                className="studio-glass rounded-2xl p-5 border border-white/10 hover:border-emerald-400 text-left flex flex-col justify-between gap-4 group cursor-pointer transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span>01 · {naijaSongs.length} Songs</span>
                    <Music className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-emerald-300">
                    Naija Song Quiz
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Play Afrobeats rhythm or MP3 clips &amp; famous lyrics — team
                    guesses the Nigerian singer in chat!
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 pt-2 border-t border-white/10">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Timer + 3 Hints + Singer</span>
                </div>
              </button>

              {/* Card 2: Speed Trivia */}
              <button
                type="button"
                onClick={() => handleSwitchStage('SPEED_TRIVIA')}
                className="studio-glass rounded-2xl p-5 border border-white/10 hover:border-amber-400 text-left flex flex-col justify-between gap-4 group cursor-pointer transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                    <span>02 · {triviaQuestions.length} Questions</span>
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-amber-300">
                    Speed Trivia
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A/B/C/D multiple choice with countdown timer, Naija &amp;
                    workplace trivia.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 pt-2 border-t border-white/10">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Timer + 50/50 + Answer</span>
                </div>
              </button>

              {/* Card 3: Survey Feud */}
              <button
                type="button"
                onClick={() => handleSwitchStage('SURVEY_FEUD')}
                className="studio-glass rounded-2xl p-5 border border-white/10 hover:border-amber-400 text-left flex flex-col justify-between gap-4 group cursor-pointer transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                    <span>03 · {feudQuestions.length} Boards</span>
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-amber-300">
                    Workplace Feud
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Guess the top 6 survey answers! Includes countdown timer,
                    per-card hints, and red Strike X buzzer.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 pt-2 border-t border-white/10">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Timer + Hints + Reveal All</span>
                </div>
              </button>

              {/* Card 4: Emoji Decoder */}
              <button
                type="button"
                onClick={() => handleSwitchStage('WORD_DECODER')}
                className="studio-glass rounded-2xl p-5 border border-white/10 hover:border-pink-400 text-left flex flex-col justify-between gap-4 group cursor-pointer transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-pink-400 font-semibold">
                    <span>04 · {decoderPuzzles.length} Puzzles</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-pink-300">
                    Emoji Decoder
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Decode popular Nigerian &amp; work phrases from emojis with
                    countdown timer and letter-reveal hints.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-pink-400 pt-2 border-t border-white/10">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Timer + Meaning + Letters</span>
                </div>
              </button>

              {/* Card 5: Lucky Draw */}
              <button
                type="button"
                onClick={() => handleSwitchStage('WINNER_DRAW')}
                className="studio-glass rounded-2xl p-5 border border-white/10 hover:border-amber-400 text-left flex flex-col justify-between gap-4 group cursor-pointer transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                    <span>05 · Finale</span>
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-amber-300">
                    Lucky Winner Draw (1–20)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Spin a Lucky Number from 1 to 20 or spin the Mystery Prize
                    Wheel with a chat entry countdown timer!
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300 pt-2 border-t border-white/10">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Timer + 1–20 &amp; Prize Wheel</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {gameState === 'NAIJA_SONGS' && (
          <NaijaSongStage
            songs={naijaSongs}
            currentIndex={currentSongIdx}
            onSelectIndex={setCurrentSongIdx}
            onNextStage={() => handleSwitchStage('SPEED_TRIVIA')}
          />
        )}

        {gameState === 'SPEED_TRIVIA' && (
          <SpeedTriviaStage
            questions={triviaQuestions}
            currentIndex={currentTriviaIdx}
            onSelectIndex={setCurrentTriviaIdx}
            onNextStage={() => handleSwitchStage('SURVEY_FEUD')}
          />
        )}

        {gameState === 'SURVEY_FEUD' && (
          <SurveyFeudStage
            questions={feudQuestions}
            currentIndex={currentFeudIdx}
            strikes={feudStrikes}
            onSelectQuestion={(idx) => {
              setFeudStrikes(0);
              setCurrentFeudIdx(idx);
            }}
            onRevealAnswer={handleRevealFeudAnswer}
            onRevealAllAnswers={handleRevealAllFeudAnswers}
            onResetBoard={handleResetFeudBoard}
            onTriggerStrike={handleTriggerStrike}
            onNextStage={() => handleSwitchStage('WORD_DECODER')}
          />
        )}

        {gameState === 'WORD_DECODER' && (
          <WordDecoderStage
            puzzles={decoderPuzzles}
            currentIndex={currentDecoderIdx}
            onSelectIndex={setCurrentDecoderIdx}
            onNextStage={() => handleSwitchStage('WINNER_DRAW')}
          />
        )}

        {gameState === 'WINNER_DRAW' && (
          <WinnerDrawStage
            prizes={prizes}
            onAssignPrizeResult={handleAssignPrizeResult}
            onResetPrizeResult={handleResetPrizeResult}
            trophyImgUrl={trophyImgUrl}
            ticketImgUrl={ticketImgUrl}
          />
        )}
      </main>

      {/* HR Customizer Modal */}
      <HostStudioModal
        isOpen={isSetupOpen}
        initialTab={setupInitialTab}
        onClose={() => setIsSetupOpen(false)}
        naijaSongs={naijaSongs}
        onAddNaijaSong={(song) => setNaijaSongs((prev) => [...prev, song])}
        onDeleteNaijaSong={(id) =>
          setNaijaSongs((prev) => prev.filter((s) => s.id !== id))
        }
        triviaQuestions={triviaQuestions}
        onAddTrivia={(q) => setTriviaQuestions((prev) => [...prev, q])}
        onDeleteTrivia={(id) =>
          setTriviaQuestions((prev) => prev.filter((q) => q.id !== id))
        }
        decoderPuzzles={decoderPuzzles}
        onAddDecoder={(p) => setDecoderPuzzles((prev) => [...prev, p])}
        onDeleteDecoder={(id) =>
          setDecoderPuzzles((prev) => prev.filter((p) => p.id !== id))
        }
        prizes={prizes}
        onUpdatePrizes={setPrizes}
        onResetAllDefaults={handleResetAllDefaults}
      />
    </div>
  );
}
