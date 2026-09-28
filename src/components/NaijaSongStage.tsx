import React, { useState, useEffect, useRef } from 'react';
import { NaijaSongQuestion } from '../types/game';
import { soundFX } from '../utils/soundEffects';
import { GameTimer } from './GameTimer';
import {
  Music,
  Play,
  Pause,
  Square,
  Lightbulb,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Upload,
  EyeOff,
  Volume2,
} from 'lucide-react';

interface NaijaSongStageProps {
  songs: NaijaSongQuestion[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onNextStage: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function pickBestItunesPreview(
  results: Array<{
    artistName?: string;
    trackName?: string;
    previewUrl?: string;
  }>,
  artistAnswer: string
): string {
  if (!Array.isArray(results) || results.length === 0) return '';
  const primaryArtist = artistAnswer
    .replace(/\(.*?\)/g, '')
    .split(/[,&]/)[0]
    .trim()
    .toLowerCase();

  // Prefer original vocal track by the primary artist (avoiding instrumentals/karaoke/remixes)
  const exactOriginal = results.find(
    (r) =>
      r.previewUrl &&
      r.artistName?.toLowerCase().includes(primaryArtist) &&
      !/instrumental|karaoke|8-bit|emulation|remix|sped up/i.test(
        r.trackName || ''
      )
  );
  if (exactOriginal?.previewUrl) return exactOriginal.previewUrl;

  const anyByArtist = results.find(
    (r) =>
      r.previewUrl &&
      r.artistName?.toLowerCase().includes(primaryArtist) &&
      !/instrumental|karaoke/i.test(r.trackName || '')
  );
  if (anyByArtist?.previewUrl) return anyByArtist.previewUrl;

  return results[0]?.previewUrl || '';
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const NaijaSongStage: React.FC<NaijaSongStageProps> = ({
  songs,
  currentIndex,
  onSelectIndex,
  onNextStage,
}) => {
  // hintLevel: 0 = none, 1 = Vibe & Year Hint, 2 = Artist Nickname Clue, 3 = 4 Multiple Choice Singers
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [hideSongTitleMode, setHideSongTitleMode] = useState<boolean>(false);
  const [timerResetCount, setTimerResetCount] = useState<number>(0);

  // Real Song Audio Player State
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(30);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string>('');
  const [audioError, setAudioError] = useState<string | null>(null);

  // Optional Custom Uploaded File or Studio Synth Beat
  const [isPlayingSynthBeat, setIsPlayingSynthBeat] = useState<boolean>(false);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');

  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  const safeIndex =
    songs.length > 0 ? Math.min(currentIndex, songs.length - 1) : 0;
  const currentSong = songs[safeIndex] || songs[0];

  // Resolve audio URL for the current song (uses built-in audioUrl, custom uploaded file, or live iTunes search fallback)
  useEffect(() => {
    soundFX.stopAfrobeatLoop();
    setIsPlayingSynthBeat(false);
    setIsPlayingSong(false);
    setAudioCurrentTime(0);
    setAudioDuration(30);
    setAudioError(null);
    setHintLevel(0);
    setIsAnswerRevealed(false);
    setSelectedChoiceIdx(null);

    if (songAudioRef.current) {
      songAudioRef.current.pause();
      songAudioRef.current.currentTime = 0;
    }

    if (!currentSong) return;

    if (customAudioUrl) {
      setResolvedAudioUrl(customAudioUrl);
      return;
    }

    if (currentSong.audioUrl) {
      setResolvedAudioUrl(currentSong.audioUrl);
      return;
    }

    // Fallback: dynamically fetch official preview from iTunes Search API if custom song has no audioUrl
    let cancelled = false;
    setIsLoadingAudio(true);
    const query = `${currentSong.singerAnswer.replace(/\(.*?\)/g, '')} ${currentSong.songTitle}`;
    fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=NG&entity=song&limit=10`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const preview = pickBestItunesPreview(
          data?.results,
          currentSong.singerAnswer
        );
        if (preview) {
          setResolvedAudioUrl(preview);
        } else {
          setResolvedAudioUrl('');
        }
      })
      .catch(() => {
        if (!cancelled) setResolvedAudioUrl('');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAudio(false);
      });

    return () => {
      cancelled = true;
    };
  }, [safeIndex, currentSong?.id, currentSong?.audioUrl, customAudioUrl]);

  useEffect(() => {
    return () => {
      soundFX.stopAfrobeatLoop();
      if (songAudioRef.current) {
        songAudioRef.current.pause();
      }
    };
  }, []);

  if (!currentSong) return null;

  const handleTogglePlaySong = async () => {
    const audioEl = songAudioRef.current;
    if (!audioEl) return;

    // Stop synth beat if playing
    if (isPlayingSynthBeat) {
      soundFX.stopAfrobeatLoop();
      setIsPlayingSynthBeat(false);
    }

    if (isPlayingSong) {
      audioEl.pause();
      setIsPlayingSong(false);
      return;
    }

    setAudioError(null);
    try {
      await audioEl.play();
      setIsPlayingSong(true);
    } catch {
      // Fallback: try re-fetching fresh stream URL from iTunes API if link expired
      try {
        setIsLoadingAudio(true);
        const query = `${currentSong.singerAnswer.replace(/\(.*?\)/g, '')} ${currentSong.songTitle}`;
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=NG&entity=song&limit=10`
        );
        const data = await res.json();
        const freshUrl = pickBestItunesPreview(
          data?.results,
          currentSong.singerAnswer
        );
        if (freshUrl && audioEl) {
          setResolvedAudioUrl(freshUrl);
          audioEl.src = freshUrl;
          await audioEl.play();
          setIsPlayingSong(true);
          setIsLoadingAudio(false);
          return;
        }
      } catch {
        // ignore fallback error
      }
      setIsLoadingAudio(false);
      setAudioError(
        'Could not stream song audio. Using Studio Afrobeats Groove instead!'
      );
      soundFX.startAfrobeatLoop(currentSong.bpm || 112, safeIndex);
      setIsPlayingSynthBeat(true);
    }
  };

  const handleReplaySongFromStart = async () => {
    const audioEl = songAudioRef.current;
    if (!audioEl) return;
    if (isPlayingSynthBeat) {
      soundFX.stopAfrobeatLoop();
      setIsPlayingSynthBeat(false);
    }
    audioEl.currentTime = 0;
    setAudioCurrentTime(0);
    try {
      await audioEl.play();
      setIsPlayingSong(true);
    } catch {
      // ignore
    }
  };

  const handleSeekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = parseFloat(e.target.value);
    setAudioCurrentTime(nextTime);
    if (songAudioRef.current) {
      songAudioRef.current.currentTime = nextTime;
    }
  };

  const handleToggleSynthBeat = () => {
    if (isPlayingSong && songAudioRef.current) {
      songAudioRef.current.pause();
      setIsPlayingSong(false);
    }
    if (isPlayingSynthBeat) {
      soundFX.stopAfrobeatLoop();
      setIsPlayingSynthBeat(false);
    } else {
      soundFX.startAfrobeatLoop(currentSong.bpm || 112, safeIndex);
      setIsPlayingSynthBeat(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customAudioUrl) {
      URL.revokeObjectURL(customAudioUrl);
    }
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioName(file.name);
    setResolvedAudioUrl(url);
  };

  const handleShowNextHint = () => {
    if (hintLevel < 3) {
      soundFX.playHintChime();
      setHintLevel((prev) => prev + 1);
    }
  };

  const handleRevealSinger = () => {
    soundFX.stopAfrobeatLoop();
    setIsPlayingSynthBeat(false);
    if (songAudioRef.current && isPlayingSong) {
      songAudioRef.current.pause();
      setIsPlayingSong(false);
    }
    soundFX.playWinnerFanfare();
    setIsAnswerRevealed(true);
    setHintLevel(3);
  };

  const handleResetRound = () => {
    soundFX.stopAfrobeatLoop();
    soundFX.playSelect();
    setIsPlayingSynthBeat(false);
    if (songAudioRef.current) {
      songAudioRef.current.pause();
      songAudioRef.current.currentTime = 0;
    }
    setIsPlayingSong(false);
    setAudioCurrentTime(0);
    setHintLevel(0);
    setIsAnswerRevealed(false);
    setSelectedChoiceIdx(null);
    setTimerResetCount((c) => c + 1);
  };

  return (
    <div className="space-y-5">
      {/* Hidden/Synced HTML5 Audio Element for the Current Song */}
      <audio
        ref={songAudioRef}
        src={resolvedAudioUrl || undefined}
        preload="auto"
        onTimeUpdate={() => {
          if (songAudioRef.current) {
            setAudioCurrentTime(songAudioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (
            songAudioRef.current &&
            Number.isFinite(songAudioRef.current.duration) &&
            songAudioRef.current.duration > 0
          ) {
            setAudioDuration(songAudioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlayingSong(false);
          setAudioCurrentTime(0);
        }}
        onPause={() => setIsPlayingSong(false)}
        onPlay={() => setIsPlayingSong(true)}
      />

      {/* Top Song Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1">
            Select Naija Track:
          </span>
          {songs.map((song, idx) => (
            <button
              key={song.id}
              type="button"
              onClick={() => {
                soundFX.playSelect();
                onSelectIndex(idx);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                idx === safeIndex
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-[#131B2E] hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              {idx + 1}. {song.songTitle}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundFX.playSelect();
              onSelectIndex((safeIndex - 1 + songs.length) % songs.length);
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
              onSelectIndex((safeIndex + 1) % songs.length);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#131B2E] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stage Header & Title Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">
              01. Naija Hit Song Quiz (With Official Song Audio)
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Track {safeIndex + 1} of {songs.length}
            </span>
            <span aria-hidden="true">·</span>
            <span>Employees type the singer in Google Meet Chat</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Who Sang This Nigerian Hit Song?
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFX.playSelect();
            setHideSongTitleMode((h) => !h);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#131B2E] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-2 self-start lg:self-auto cursor-pointer whitespace-nowrap"
        >
          {hideSongTitleMode ? (
            <>
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Show Song Title on Screen</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span>Hide Song Title (Audio &amp; Lyrics Only)</span>
            </>
          )}
        </button>
      </div>

      {/* Live Countdown Timer for Naija Song Quiz */}
      <GameTimer
        defaultSeconds={30}
        resetKey={`naija-${safeIndex}-${currentSong.id}-${timerResetCount}`}
        isCompleted={isAnswerRevealed}
        label="Song Guess Countdown"
        accentColor="emerald"
      />

      {/* Main Song & Lyric Showcase Card */}
      <div className="bg-[#131B2E] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-6">
        {/* Top Row: Song Title + Primary Play Song Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="space-y-1">
            <div className="text-xs text-slate-400">
              Featured Nigerian Hit Track #{safeIndex + 1}
            </div>
            {hideSongTitleMode && !isAnswerRevealed ? (
              <div className="font-display text-xl sm:text-2xl font-bold text-amber-400">
                Mystery Track Hidden — Listen to the Song &amp; Guess the Singer!
              </div>
            ) : (
              <div className="font-display text-2xl sm:text-3xl font-bold text-amber-400">
                “{currentSong.songTitle}”
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* PRIMARY PLAY SONG BUTTON */}
            <button
              type="button"
              onClick={handleTogglePlaySong}
              disabled={isLoadingAudio}
              className={`px-5 py-3 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg ${
                isPlayingSong
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isPlayingSong ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Song Audio</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isLoadingAudio
                      ? 'Loading Song...'
                      : `Play Song: “${
                          hideSongTitleMode && !isAnswerRevealed
                            ? `Track #${safeIndex + 1}`
                            : currentSong.songTitle
                        }”`}
                  </span>
                </>
              )}
            </button>

            {/* Replay from 0:00 */}
            <button
              type="button"
              onClick={handleReplaySongFromStart}
              className="px-3.5 py-3 rounded-xl bg-[#090D16] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Restart Song Audio from 0:00"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Replay Clip</span>
            </button>

            {/* Optional Synth Beat Fallback */}
            <button
              type="button"
              onClick={handleToggleSynthBeat}
              className={`px-3.5 py-3 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border ${
                isPlayingSynthBeat
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                  : 'bg-[#090D16] hover:bg-slate-800 text-slate-300 border-white/10'
              }`}
            >
              {isPlayingSynthBeat ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Synth Beat</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Studio Drum Beat</span>
                </>
              )}
            </button>

            {/* Upload Custom MP3 */}
            <label className="px-3.5 py-3 rounded-xl bg-[#090D16] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload MP3</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Interactive Song Audio Deck & Scrub Bar */}
        <div className="bg-[#090D16] border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTogglePlaySong}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                isPlayingSong
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
              aria-label={isPlayingSong ? 'Pause Song' : 'Play Song'}
            >
              {isPlayingSong ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {isPlayingSong ? 'Now Playing Song Audio' : 'Official Song Audio Ready'}
                </span>
                {customAudioName && (
                  <span className="text-[11px] text-amber-300 truncate">
                    ({customAudioName})
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {hideSongTitleMode && !isAnswerRevealed
                  ? `Mystery Nigerian Hit #${safeIndex + 1}`
                  : `“${currentSong.songTitle}” · ${currentSong.releaseYear}`}
              </div>
            </div>
          </div>

          {/* Seek Bar + Time Display */}
          <div className="flex items-center gap-3 w-full sm:flex-1 max-w-md">
            <span className="font-mono text-xs text-emerald-300 tabular-nums w-10 text-right">
              {formatSeconds(audioCurrentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={audioDuration || 30}
              step={0.1}
              value={audioCurrentTime}
              onChange={handleSeekAudio}
              className="flex-1 accent-emerald-400 h-2 bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-xs text-slate-400 tabular-nums w-10">
              {formatSeconds(audioDuration)}
            </span>
          </div>
        </div>

        {audioError && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3.5 py-2">
            {audioError}
          </div>
        )}

        {/* Famous Lyric Hook Teleprompter */}
        <div className="bg-[#090D16] border border-white/10 rounded-xl p-5 sm:p-7 text-center space-y-2">
          <div className="text-xs text-slate-400 font-medium">
            Famous Lyric Line / Chorus Hook
          </div>
          <p className="font-display text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-relaxed max-w-3xl mx-auto">
            {currentSong.lyricSnippet}
          </p>
        </div>

        {/* Progressive 3-Step Hints */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Step-by-Step Hints ({hintLevel} of 3 Revealed) — Click any hint card or use the buttons below
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Hint 1 */}
            <div
              onClick={() => {
                if (hintLevel < 1) {
                  soundFX.playHintChime();
                  setHintLevel(1);
                }
              }}
              className={`rounded-xl p-4 border transition-colors ${
                hintLevel >= 1
                  ? 'bg-amber-500/10 border-amber-400/50 text-amber-100'
                  : 'bg-[#090D16]/70 hover:bg-[#090D16] border-white/10 text-slate-400 cursor-pointer'
              }`}
            >
              <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center justify-between gap-2">
                <span>Hint 1 · Release Year &amp; Song Vibe</span>
                {hintLevel < 1 && (
                  <span className="text-xs underline text-amber-300">
                    Click to Reveal
                  </span>
                )}
              </div>
              {hintLevel >= 1 ? (
                <p className="text-xs sm:text-sm text-white font-medium">
                  <strong>{currentSong.releaseYear}:</strong>{' '}
                  {currentSong.hint1GenreOrVibe}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Reveals the release year, album, and vibe of this hit song.
                </p>
              )}
            </div>

            {/* Hint 2 */}
            <div
              onClick={() => {
                if (hintLevel < 2) {
                  soundFX.playHintChime();
                  setHintLevel(2);
                }
              }}
              className={`rounded-xl p-4 border transition-colors ${
                hintLevel >= 2
                  ? 'bg-amber-500/10 border-amber-400/50 text-amber-100'
                  : 'bg-[#090D16]/70 hover:bg-[#090D16] border-white/10 text-slate-400 cursor-pointer'
              }`}
            >
              <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center justify-between gap-2">
                <span>Hint 2 · Singer Nickname &amp; Bio Clue</span>
                {hintLevel < 2 && (
                  <span className="text-xs underline text-amber-300">
                    Click to Reveal
                  </span>
                )}
              </div>
              {hintLevel >= 2 ? (
                <p className="text-xs sm:text-sm text-white font-medium">
                  {currentSong.hint2ArtistClue}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Reveals the Nigerian artist’s famous stage nickname.
                </p>
              )}
            </div>
          </div>

          {/* Hint 3: 4 Multiple-Choice Singers */}
          {hintLevel >= 3 ? (
            <div className="pt-2 space-y-2">
              <div className="text-xs font-semibold text-amber-400">
                Hint 3 · 4 Multiple-Choice Singers (Employees can type A, B, C, or D in Meet Chat):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentSong.multipleChoiceOptions.map((artist, idx) => {
                  const isCorrectSinger =
                    artist.trim().toLowerCase() ===
                    currentSong.singerAnswer.trim().toLowerCase();
                  const isChosen = selectedChoiceIdx === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        soundFX.playSelect();
                        setSelectedChoiceIdx(idx);
                      }}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        isAnswerRevealed && isCorrectSinger
                          ? 'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-100'
                          : isChosen
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-[#090D16] hover:bg-slate-900 border-white/15 text-white'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg font-mono text-sm font-bold flex items-center justify-center shrink-0 ${
                          isAnswerRevealed && isCorrectSinger
                            ? 'bg-emerald-500 text-slate-950'
                            : isChosen
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {OPTION_LETTERS[idx]}
                      </span>
                      <span className="text-sm font-bold truncate">
                        {artist}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundFX.playHintChime();
                setHintLevel(3);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#090D16]/70 hover:bg-[#090D16] border border-white/10 text-xs text-amber-300 font-medium text-center cursor-pointer transition-colors"
            >
              Need Multiple Choice? Click here for Hint 3 (Show 4 Nigerian Singers A / B / C / D)
            </button>
          )}
        </div>

        {/* Official Answer Banner */}
        {isAnswerRevealed && (
          <div className="bg-emerald-950/80 border-2 border-emerald-400 rounded-2xl p-5 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Music className="w-4 h-4" />
              <span>
                Official Answer · Singer of “{currentSong.songTitle}”
              </span>
            </div>
            <div className="font-display text-2xl sm:text-4xl font-bold text-white">
              {currentSong.singerAnswer}
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-2 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{currentSong.funFact}</span>
            </p>
          </div>
        )}

        {/* Bottom Host Action Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleShowNextHint}
              disabled={hintLevel >= 3}
              className="px-4 py-2.5 rounded-xl bg-[#090D16] hover:bg-slate-800 disabled:opacity-40 text-amber-300 border border-amber-500/40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>
                {hintLevel === 0 && '1. Show Hint 1 (Vibe & Year)'}
                {hintLevel === 1 && '2. Show Hint 2 (Artist Clue)'}
                {hintLevel === 2 && '3. Show Hint 3 (4 Singers A–D)'}
                {hintLevel >= 3 && 'All 3 Hints Shown'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleRevealSinger}
              disabled={isAnswerRevealed}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-emerald-600/30 disabled:text-emerald-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-4 h-4" />
              <span>
                {isAnswerRevealed
                  ? `Singer: ${currentSong.singerAnswer}`
                  : 'Reveal Singer & Answer'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetRound}
              className="px-3.5 py-2.5 rounded-xl bg-[#090D16] hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {safeIndex < songs.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  soundFX.playSelect();
                  onSelectIndex(safeIndex + 1);
                }}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Next Song (#{safeIndex + 2})</span>
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
                <span>Next Game: Speed Trivia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
