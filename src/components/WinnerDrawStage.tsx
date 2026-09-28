import React, { useState, useRef, useEffect } from 'react';
import { PrizeItem } from '../types/game';
import { soundFX } from '../utils/soundEffects';
import { GameTimer } from './GameTimer';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Hash,
  Disc,
  Copy,
  Check,
  Gift,
  Plus,
  Trash2,
} from 'lucide-react';

interface WinnerDrawStageProps {
  prizes: PrizeItem[];
  onAssignPrizeResult: (prizeId: string, winningResult: string) => void;
  onResetPrizeResult: (prizeId: string) => void;
  trophyImgUrl: string;
  ticketImgUrl: string;
}

const DEFAULT_WHEEL_SLICES = [
  '₦20,000 Gift Voucher',
  'Friday 2PM Early Log-Off',
  '10GB Data / Airtime Bundle',
  'VIP Lunch on the Company',
  'Mystery Cash Envelope',
  'Half-Day Off Pass',
  'Executive Merch Box',
  'Double Team Bonus Points',
];

const WHEEL_COLORS = [
  '#FF4F8B',
  '#7C3AED',
  '#FFB800',
  '#10B981',
  '#3B82F6',
  '#EC4899',
  '#F59E0B',
  '#8B5CF6',
];

export const WinnerDrawStage: React.FC<WinnerDrawStageProps> = ({
  prizes,
  onAssignPrizeResult,
  onResetPrizeResult,
  trophyImgUrl,
  ticketImgUrl,
}) => {
  const [drawMode, setDrawMode] = useState<'LUCKY_NUMBER' | 'MYSTERY_WHEEL'>(
    'LUCKY_NUMBER'
  );

  // Lucky Number Generator State — Default 1 to 20
  const [minNumber, setMinNumber] = useState<number>(1);
  const [maxNumber, setMaxNumber] = useState<number>(20);
  const [excludeDrawnNumbers, setExcludeDrawnNumbers] = useState<boolean>(true);
  const [drawnNumbersHistory, setDrawnNumbersHistory] = useState<number[]>([]);
  const [isSpinningNumber, setIsSpinningNumber] = useState<boolean>(false);
  const [rollingDisplayNum, setRollingDisplayNum] = useState<number | null>(
    null
  );
  const [winningNumber, setWinningNumber] = useState<number | null>(null);

  // Mystery Prize Wheel State
  const [wheelSlices, setWheelSlices] = useState<string[]>(DEFAULT_WHEEL_SLICES);
  const [newSliceInput, setNewSliceInput] = useState<string>('');
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinningWheel, setIsSpinningWheel] = useState<boolean>(false);
  const [winningSliceText, setWinningSliceText] = useState<string | null>(null);

  // Selected Prize Tier
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(
    prizes.find((p) => !p.winningResult)?.id || prizes[0]?.id || ''
  );
  const [copiedSummary, setCopiedSummary] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedPrize =
    prizes.find((p) => p.id === selectedPrizeId) || prizes[0];

  // Draw the Mystery Wheel on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || drawMode !== 'MYSTERY_WHEEL') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;
    ctx.clearRect(0, 0, size, size);

    const total = Math.max(1, wheelSlices.length);
    const arc = (2 * Math.PI) / total;

    wheelSlices.forEach((label, i) => {
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#090D16';
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      const truncated =
        label.length > 22 ? label.substring(0, 20) + '…' : label;
      ctx.fillText(truncated, radius - 18, 5);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#090D16';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFB800';
    ctx.stroke();
  }, [wheelSlices, drawMode]);

  // Trigger Lucky Number Spin (1 to 20 by default)
  const handleSpinLuckyNumber = () => {
    if (isSpinningNumber) return;
    const low = Math.min(minNumber, maxNumber);
    const high = Math.max(minNumber, maxNumber);

    const availablePool: number[] = [];
    for (let n = low; n <= high; n++) {
      if (!excludeDrawnNumbers || !drawnNumbersHistory.includes(n)) {
        availablePool.push(n);
      }
    }

    if (availablePool.length === 0) {
      setDrawnNumbersHistory([]);
      for (let n = low; n <= high; n++) availablePool.push(n);
    }

    const chosen =
      availablePool[Math.floor(Math.random() * availablePool.length)];

    setIsSpinningNumber(true);
    setWinningNumber(null);

    let ticks = 0;
    const totalTicks = 26;
    const interval = window.setInterval(() => {
      ticks++;
      const randomPreview =
        Math.floor(Math.random() * (high - low + 1)) + low;
      setRollingDisplayNum(randomPreview);
      soundFX.playWheelTick(ticks / totalTicks);

      if (ticks >= totalTicks) {
        clearInterval(interval);
        setRollingDisplayNum(chosen);
        setWinningNumber(chosen);
        setDrawnNumbersHistory((prev) => [chosen, ...prev]);
        setIsSpinningNumber(false);
        soundFX.playFanfare();

        if (selectedPrize) {
          onAssignPrizeResult(selectedPrize.id, `Lucky Number #${chosen}`);
        }
      }
    }, 80);
  };

  // Trigger Mystery Wheel Spin
  const handleSpinMysteryWheel = () => {
    if (isSpinningWheel || wheelSlices.length === 0) return;
    setIsSpinningWheel(true);
    setWinningSliceText(null);

    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const randomAngle = Math.floor(Math.random() * 360);
    const targetRotation = wheelRotation + extraSpins * 360 + randomAngle;

    setWheelRotation(targetRotation);

    let tickCount = 0;
    const tickTimer = window.setInterval(() => {
      tickCount++;
      soundFX.playWheelTick(tickCount / 22);
      if (tickCount >= 22) clearInterval(tickTimer);
    }, 150);

    window.setTimeout(() => {
      clearInterval(tickTimer);
      setIsSpinningWheel(false);

      const normalizedDeg = ((targetRotation % 360) + 360) % 360;
      const pointerDeg = (270 - normalizedDeg + 360) % 360;
      const sliceAngle = 360 / wheelSlices.length;
      const winningIdx =
        Math.floor(pointerDeg / sliceAngle) % wheelSlices.length;
      const wonSlice = wheelSlices[winningIdx];

      setWinningSliceText(wonSlice);
      soundFX.playFanfare();

      if (selectedPrize) {
        onAssignPrizeResult(selectedPrize.id, wonSlice);
      }
    }, 3600);
  };

  const handleAddSlice = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSliceInput.trim();
    if (!trimmed) return;
    setWheelSlices((prev) => [...prev, trimmed]);
    setNewSliceInput('');
    soundFX.playSelect();
  };

  const handleRemoveSlice = (idx: number) => {
    if (wheelSlices.length <= 2) return;
    setWheelSlices((prev) => prev.filter((_, i) => i !== idx));
    soundFX.playSelect();
  };

  const handleCopyResults = () => {
    const lines = [
      '🏆 TEAM ENGAGEMENT GAME DRAW RESULTS 🏆',
      ...prizes.map(
        (p, idx) =>
          `${idx + 1}. ${p.tierLabel} (${p.title}): ${
            p.winningResult ? p.winningResult : 'Not drawn yet'
          }`
      ),
    ];
    if (drawnNumbersHistory.length > 0) {
      lines.push(
        `\nLucky Numbers Drawn: ${drawnNumbersHistory
          .map((n) => `#${n}`)
          .join(', ')}`
      );
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const lowBound = Math.min(minNumber, maxNumber);
  const highBound = Math.max(minNumber, maxNumber);
  const showNumberGrid = highBound - lowBound + 1 <= 40;
  const gridNumbers = showNumberGrid
    ? Array.from({ length: highBound - lowBound + 1 }, (_, i) => lowBound + i)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch select-none">
      {/* Left Column (7 cols): Interactive 1-20 Lucky Draw Machine */}
      <div className="lg:col-span-7 studio-glass rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between gap-5">
        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playSelect();
                setDrawMode('LUCKY_NUMBER');
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                drawMode === 'LUCKY_NUMBER'
                  ? 'bg-[#FFB800] text-slate-950'
                  : 'bg-white/5 text-[#A9B4D0] hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>1. Lucky Number Draw (1 to 20)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playSelect();
                setDrawMode('MYSTERY_WHEEL');
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                drawMode === 'MYSTERY_WHEEL'
                  ? 'bg-[#FF4F8B] text-white'
                  : 'bg-white/5 text-[#A9B4D0] hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Disc className="w-4 h-4" />
              <span>2. Mystery Prize Wheel</span>
            </button>
          </div>

          <span className="text-xs font-mono text-[#A9B4D0]">
            1–20 Lucky Draw · Google Meet Chat Friendly
          </span>
        </div>

        {/* Live Countdown Timer for Lucky Draw Chat Entries */}
        <GameTimer
          defaultSeconds={20}
          resetKey={`draw-${drawMode}-${selectedPrizeId}`}
          isCompleted={isSpinningNumber || isSpinningWheel}
          label="Chat Number Entry Timer"
          accentColor="amber"
        />

        {/* MODE 1: LUCKY NUMBER GENERATOR (1 TO 20) */}
        {drawMode === 'LUCKY_NUMBER' && (
          <div className="flex-1 flex flex-col items-center justify-between gap-5">
            {/* Range Controls */}
            <div className="w-full bg-[#090D16]/70 border border-white/10 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#A9B4D0]">
                    Min #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={minNumber}
                    onChange={(e) =>
                      setMinNumber(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-white focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
                <span className="text-[#A9B4D0] font-mono mt-4">to</span>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#A9B4D0]">
                    Max #
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={999}
                    value={maxNumber}
                    onChange={(e) =>
                      setMaxNumber(Math.max(2, parseInt(e.target.value) || 20))
                    }
                    className="w-20 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-[#FFB800] focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
              </div>

              {/* Quick Range Presets with 1-20 Default */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-[#A9B4D0] mr-1">
                  Range Preset:
                </span>
                {[10, 15, 20, 30, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      soundFX.playSelect();
                      setMinNumber(1);
                      setMaxNumber(preset);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer transition-colors ${
                      minNumber === 1 && maxNumber === preset
                        ? 'bg-[#FFB800] text-slate-950'
                        : 'bg-white/5 text-[#A9B4D0] hover:bg-white/15 hover:text-white border border-white/10'
                    }`}
                  >
                    1–{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Giant Slot Number Drum */}
            <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#131B2E] to-[#090D16] border-2 border-[#FFB800]/50 p-6 text-center">
              <div className="text-xs font-mono uppercase tracking-widest text-[#FFB800] mb-1 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>
                  {selectedPrize
                    ? `Drawing for: ${selectedPrize.title}`
                    : 'Team Engagement Lucky Draw (1 to 20)'}
                </span>
              </div>

              <div className="my-3 font-display font-black text-6xl sm:text-7xl tracking-tight text-white tabular-nums">
                {rollingDisplayNum !== null ? `#${rollingDisplayNum}` : '#1–20'}
              </div>

              {winningNumber !== null && !isSpinningNumber ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-[#FFB800]" />
                  <span>Winning Lucky Number: #{winningNumber}!</span>
                </div>
              ) : (
                <p className="text-xs text-[#A9B4D0]">
                  Ask teammates on Google Meet to type a number between{' '}
                  <strong className="text-white">#{lowBound}</strong> and{' '}
                  <strong className="text-white">#{highBound}</strong> in the chat!
                </p>
              )}
            </div>

            {/* Visual 1 to 20 Number Board */}
            {showNumberGrid && (
              <div className="w-full bg-[#090D16]/60 border border-white/10 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>
                    Live Number Board (#{lowBound} to #{highBound})
                  </span>
                  <span className="font-mono tabular-nums text-amber-300">
                    {drawnNumbersHistory.length} / {gridNumbers.length} Drawn
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {gridNumbers.map((num) => {
                    const isCurrentWinner =
                      winningNumber === num && !isSpinningNumber;
                    const isAlreadyDrawn = drawnNumbersHistory.includes(num);
                    const isRollingHighlight =
                      isSpinningNumber && rollingDisplayNum === num;

                    return (
                      <div
                        key={num}
                        className={`h-9 rounded-lg font-mono tabular-nums text-xs font-bold flex items-center justify-center border transition-colors ${
                          isCurrentWinner
                            ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
                            : isRollingHighlight
                            ? 'bg-amber-400 text-slate-950 border-amber-200'
                            : isAlreadyDrawn
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}
                      >
                        #{num}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spin Trigger & History */}
            <div className="w-full flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSpinLuckyNumber}
                  disabled={isSpinningNumber}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FFB800] via-[#FF8A00] to-[#FF4F8B] hover:brightness-110 disabled:opacity-50 text-slate-950 font-display font-black text-sm sm:text-base tracking-wide uppercase cursor-pointer transition-all whitespace-nowrap"
                >
                  {isSpinningNumber
                    ? 'Rolling Number (1–20)...'
                    : `Draw Lucky Number (${lowBound}–${highBound})`}
                </button>

                {drawnNumbersHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playSelect();
                      setDrawnNumbersHistory([]);
                      setWinningNumber(null);
                      setRollingDisplayNum(null);
                    }}
                    className="px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#A9B4D0] hover:text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Clear Drawn Numbers"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Board</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <label className="flex items-center gap-1.5 text-xs text-[#A9B4D0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeDrawnNumbers}
                    onChange={(e) => setExcludeDrawnNumbers(e.target.checked)}
                    className="rounded accent-[#FFB800]"
                  />
                  <span>Do not repeat drawn numbers</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: MYSTERY PRIZE WHEEL */}
        {drawMode === 'MYSTERY_WHEEL' && (
          <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6 py-2">
            <div className="relative flex flex-col items-center">
              <div className="z-20 -mb-3 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-[#FFB800]" />

              <div
                className="rounded-full p-2 bg-[#090D16] border-4 border-[#FFB800]/40"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinningWheel
                    ? 'transform 3.6s cubic-bezier(0.15, 0.85, 0.25, 1)'
                    : 'none',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={280}
                  className="rounded-full block"
                />
              </div>

              <button
                type="button"
                onClick={handleSpinMysteryWheel}
                disabled={isSpinningWheel}
                className="mt-4 px-7 py-3 rounded-2xl bg-gradient-to-r from-[#FF4F8B] to-[#FFB800] text-slate-950 font-display font-black text-sm uppercase tracking-wider hover:brightness-110 disabled:opacity-50 cursor-pointer transition-all whitespace-nowrap"
              >
                {isSpinningWheel ? 'Spinning Wheel...' : 'Spin Prize Wheel'}
              </button>
            </div>

            <div className="flex-1 w-full max-w-xs flex flex-col gap-3">
              {winningSliceText && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">
                    Wheel Landed On
                  </div>
                  <div className="font-display font-bold text-lg text-white mt-0.5">
                    {winningSliceText}
                  </div>
                </div>
              )}

              <div className="bg-[#090D16]/80 border border-white/10 rounded-xl p-3">
                <div className="text-xs font-mono uppercase tracking-wider text-[#A9B4D0] mb-2">
                  Customize Wheel Slices ({wheelSlices.length})
                </div>

                <form onSubmit={handleAddSlice} className="flex gap-1.5 mb-2.5">
                  <input
                    type="text"
                    value={newSliceInput}
                    onChange={(e) => setNewSliceInput(e.target.value)}
                    placeholder="Add custom reward..."
                    className="flex-1 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#A9B4D0]/50 focus:outline-none focus:border-[#FF4F8B]"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-lg bg-[#FF4F8B] text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {wheelSlices.map((slice, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5"
                    >
                      <span className="truncate text-white/90">{slice}</span>
                      {wheelSlices.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlice(i)}
                          className="text-[#A9B4D0] hover:text-rose-400 ml-2 cursor-pointer"
                          title="Remove slice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column (5 cols): Team Engagement Prize Showcase & Log */}
      <div className="lg:col-span-5 studio-glass rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <img
                src={trophyImgUrl}
                alt="Team Engagement Trophy"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-lg object-cover border border-[#FFB800]/40"
              />
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Team Engagement Prize Showcase
                </h3>
                <p className="text-xs text-[#A9B4D0]">
                  Select a prize tier before drawing a number (1–20)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyResults}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>Copy Log</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
            {prizes.map((prize) => {
              const isSelected = prize.id === selectedPrize?.id;
              return (
                <div
                  key={prize.id}
                  onClick={() => {
                    soundFX.playSelect();
                    setSelectedPrizeId(prize.id);
                  }}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#FFB800]/15 border-[#FFB800]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FFB800]/20 border border-[#FFB800]/40 flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4 text-[#FFB800]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#FFB800]">
                        {prize.tierLabel}
                      </div>
                      <div className="font-bold text-sm text-white truncate">
                        {prize.title}
                      </div>
                      {prize.winningResult && (
                        <div className="text-xs font-mono text-emerald-300 mt-0.5">
                          Result: <strong>{prize.winningResult}</strong> (
                          {prize.drawnAt})
                        </div>
                      )}
                    </div>
                  </div>

                  {prize.winningResult && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playSelect();
                        onResetPrizeResult(prize.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-500/20 text-[11px] font-mono text-[#A9B4D0] hover:text-rose-300 shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Golden Ticket Visual Footer */}
        <div className="rounded-xl bg-[#090D16]/90 border border-[#FFB800]/30 p-3.5 flex items-center gap-3.5">
          <img
            src={ticketImgUrl}
            alt="Golden Ticket"
            referrerPolicy="no-referrer"
            className="w-14 h-10 rounded-lg object-cover border border-[#FFB800]/40 shrink-0"
          />
          <div className="text-xs text-[#A9B4D0] leading-relaxed">
            <strong className="text-white block">
              How to Run the 1–20 Lucky Draw on Google Meet:
            </strong>
            Have teammates pick a number from <strong>1 to 20</strong> in the
            Google Meet chat, then click <strong>Draw Lucky Number (1–20)</strong>!
          </div>
        </div>
      </div>
    </div>
  );
};
