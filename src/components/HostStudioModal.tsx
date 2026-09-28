import React, { useState } from 'react';
import {
  NaijaSongQuestion,
  TriviaQuestion,
  DecoderPuzzle,
  PrizeItem,
} from '../types/game';
import { soundFX } from '../utils/soundEffects';
import {
  X,
  Music,
  HelpCircle,
  Sparkles,
  Gift,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface HostStudioModalProps {
  isOpen: boolean;
  initialTab?: 'SONGS' | 'TRIVIA' | 'DECODER' | 'PRIZES' | 'GITHUB';
  onClose: () => void;
  naijaSongs: NaijaSongQuestion[];
  onAddNaijaSong: (song: NaijaSongQuestion) => void;
  onDeleteNaijaSong: (id: string) => void;
  triviaQuestions: TriviaQuestion[];
  onAddTrivia: (q: TriviaQuestion) => void;
  onDeleteTrivia: (id: string) => void;
  decoderPuzzles: DecoderPuzzle[];
  onAddDecoder: (p: DecoderPuzzle) => void;
  onDeleteDecoder: (id: string) => void;
  prizes: PrizeItem[];
  onUpdatePrizes: (prizes: PrizeItem[]) => void;
  onResetAllDefaults: () => void;
}

export const GITHUB_WORKFLOW_YAML = `name: Deploy Team Engagement Game Studio to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Normalize package.json & entry script for GitHub Runner
        run: |
          rm -f package-lock.json bun.lock
          node -e '
            const fs = require("fs");
            const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.build = "vite build --base=./";
            pkg.dependencies = {
              "lucide-react": "^0.460.0",
              "react": "^19.0.0",
              "react-dom": "^19.0.0"
            };
            pkg.devDependencies = {
              "@tailwindcss/vite": "^4.0.0",
              "@types/node": "^22.0.0",
              "@types/react": "^19.0.0",
              "@types/react-dom": "^19.0.0",
              "@vitejs/plugin-react": "^4.3.4",
              "tailwindcss": "^4.0.0",
              "typescript": "^5.7.0",
              "vite": "^6.0.0"
            };
            fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

            if (fs.existsSync("src/main.tsx")) {
              let main = fs.readFileSync("src/main.tsx", "utf8");
              if (!main.includes("__TEAM_ENGAGE_MOUNTED__")) {
                main = "(window as any).__TEAM_ENGAGE_MOUNTED__ = true;\\n" + main;
                fs.writeFileSync("src/main.tsx", main);
              }
            }
          '

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build production bundle with relative paths
        run: |
          NODE_ENV=production npx vite build --base=./
          cp dist/index.html dist/404.html
          touch dist/.nojekyll

      - name: Publish built bundle to gh-pages branch & main fallback
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          # 1. Push built dist/ to gh-pages branch so Branch-based GitHub Pages works
          TMP_GH=\$(mktemp -d)
          cp -r dist/. "\$TMP_GH/"
          (
            cd "\$TMP_GH"
            git init
            git config user.name "github-actions[bot]"
            git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
            git checkout -b gh-pages
            git add -A
            git commit -m "Deploy built app to gh-pages"
            git push -f "https://x-access-token:\${GITHUB_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git" gh-pages
          )

          # 2. Also populate dist-live/ & fallback loader on main branch so main-branch GitHub Pages never shows a blank page
          mkdir -p dist-live
          cp dist/assets/* dist-live/
          cp dist/assets/index-*.js dist-live/app.js
          cp dist/assets/index-*.css dist-live/app.css
          touch .nojekyll
          node -e '
            const fs = require("fs");
            let html = fs.readFileSync("index.html", "utf8");
            if (!html.includes("__TEAM_ENGAGE_BOOTING__")) {
              const loader = \`<script>(function(){var isViteDev=!!document.querySelector("script[src*=\\\\"@vite/client\\\\"]");var hasRawTsx=!!document.querySelector("script[src*=\\\\"src/main.tsx\\\\"]");function boot(){if(window.__TEAM_ENGAGE_MOUNTED__||window.__TEAM_ENGAGE_BOOTING__)return;window.__TEAM_ENGAGE_BOOTING__=true;var l=document.createElement("link");l.rel="stylesheet";l.href="./dist-live/app.css";document.head.appendChild(l);var s=document.createElement("script");s.type="module";s.src="./dist-live/app.js";document.body.appendChild(s);}if(!isViteDev&&hasRawTsx){boot();}else if(!isViteDev){window.addEventListener("load",function(){setTimeout(function(){var r=document.getElementById("root");if(r&&!r.hasChildNodes()&&!window.__TEAM_ENGAGE_MOUNTED__)boot();},600);});}})();</script></body>\`;
              html = html.replace("</body>", loader);
              fs.writeFileSync("index.html", html);
            }
          '
          cp index.html 404.html
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add dist-live index.html 404.html .nojekyll
          if ! git diff --cached --quiet; then
            git commit -m "Update static bundle for GitHub Pages [skip ci]" || true
            git push "https://x-access-token:\${GITHUB_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git" HEAD:\${GITHUB_REF_NAME} || true
          fi

      - name: Enable & Configure GitHub Pages
        id: pages_config
        continue-on-error: true
        uses: actions/configure-pages@v5
        with:
          enablement: true

      - name: Upload build artifact (dist)
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url || format('https://{0}.github.io/{1}/', github.repository_owner, github.event.repository.name) }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        continue-on-error: true
        uses: actions/deploy-pages@v4

      - name: Print Live App Link in Workflow Summary
        run: |
          LIVE_URL="https://\${{ github.repository_owner }}.github.io/\${{ github.event.repository.name }}/"
          echo "### 🚀 Team Engagement Game Studio is Live!" >> \$GITHUB_STEP_SUMMARY
          echo "" >> \$GITHUB_STEP_SUMMARY
          echo "**Open Your Deployed App:** [\${LIVE_URL}](\${LIVE_URL})" >> \$GITHUB_STEP_SUMMARY
          echo "" >> \$GITHUB_STEP_SUMMARY
          echo "> If your page still shows a white screen, go to **Settings → Pages → Build and deployment** and set Source to **GitHub Actions** (or **Deploy from a branch → gh-pages**)." >> \$GITHUB_STEP_SUMMARY`;

export const HostStudioModal: React.FC<HostStudioModalProps> = ({
  isOpen,
  initialTab = 'SONGS',
  onClose,
  naijaSongs,
  onAddNaijaSong,
  onDeleteNaijaSong,
  triviaQuestions,
  onAddTrivia,
  onDeleteTrivia,
  decoderPuzzles,
  onAddDecoder,
  onDeleteDecoder,
  prizes,
  onUpdatePrizes,
  onResetAllDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<
    'SONGS' | 'TRIVIA' | 'DECODER' | 'PRIZES' | 'GITHUB'
  >(initialTab);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // New Naija Song Form State
  const [songTitle, setSongTitle] = useState('');
  const [lyricSnippet, setLyricSnippet] = useState('');
  const [singerAnswer, setSingerAnswer] = useState('');
  const [releaseYear, setReleaseYear] = useState('2024');
  const [hint1Genre, setHint1Genre] = useState('');
  const [hint2Artist, setHint2Artist] = useState('');
  const [wrongSingers, setWrongSingers] = useState(
    'Burna Boy, Davido, Wizkid'
  );

  // New Trivia Form State
  const [triviaPrompt, setTriviaPrompt] = useState('');
  const [triviaCategory, setTriviaCategory] = useState('Company & Culture');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [triviaHint, setTriviaHint] = useState('');

  // New Decoder Form State
  const [emojiClues, setEmojiClues] = useState('');
  const [decoderAnswer, setDecoderAnswer] = useState('');
  const [decoderHint, setDecoderHint] = useState('');

  // New Prize Form State
  const [prizeTier, setPrizeTier] = useState('Grand Townhall Prize');
  const [prizeTitle, setPrizeTitle] = useState('');

  if (!isOpen) return null;

  const handleCreateSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !singerAnswer.trim() || !lyricSnippet.trim())
      return;

    const distractors = wrongSingers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    while (distractors.length < 3) {
      distractors.push('Rema');
    }

    const options = [...distractors, singerAnswer.trim()].sort(
      () => Math.random() - 0.5
    );

    const newSong: NaijaSongQuestion = {
      id: `song-custom-${Date.now()}`,
      songTitle: songTitle.trim(),
      lyricSnippet: lyricSnippet.trim(),
      singerAnswer: singerAnswer.trim(),
      releaseYear: releaseYear.trim() || '2024',
      bpm: 112,
      hint1GenreOrVibe:
        hint1Genre.trim() || 'Chart-topping Nigerian Afrobeats hit',
      hint2ArtistClue:
        hint2Artist.trim() || `Hit song titled "${songTitle.trim()}"`,
      multipleChoiceOptions: options,
      funFact: `${singerAnswer.trim()} released "${songTitle.trim()}" to massive replay value across Nigeria!`,
    };

    onAddNaijaSong(newSong);
    setSongTitle('');
    setLyricSnippet('');
    setSingerAnswer('');
    setHint1Genre('');
    setHint2Artist('');
    soundFX.playReveal();
  };

  const handleCreateTrivia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triviaPrompt.trim() || !optA.trim() || !optB.trim()) return;

    const newQ: TriviaQuestion = {
      id: `triv-custom-${Date.now()}`,
      question: triviaPrompt.trim(),
      category: triviaCategory.trim() || 'Townhall Special',
      options: [
        optA.trim(),
        optB.trim(),
        optC.trim() || 'All of the above',
        optD.trim() || 'None of the above',
      ],
      correctIndex: correctIdx,
      hintText:
        triviaHint.trim() || 'Think carefully about the best option on screen!',
      timeLimitSec: 20,
      funFact: 'Custom HR Townhall Trivia Question!',
    };

    onAddTrivia(newQ);
    setTriviaPrompt('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setTriviaHint('');
    soundFX.playReveal();
  };

  const handleCreateDecoder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emojiClues.trim() || !decoderAnswer.trim()) return;

    const newPuzzle: DecoderPuzzle = {
      id: `dec-custom-${Date.now()}`,
      clues: emojiClues.trim(),
      category: 'Custom HR Puzzle',
      answer: decoderAnswer.trim().toUpperCase(),
      clueNote:
        decoderHint.trim() || 'Say what the emojis represent out loud!',
    };

    onAddDecoder(newPuzzle);
    setEmojiClues('');
    setDecoderAnswer('');
    setDecoderHint('');
    soundFX.playReveal();
  };

  const handleCreatePrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeTitle.trim()) return;
    const nextPrizes: PrizeItem[] = [
      ...prizes,
      {
        id: `prize-${Date.now()}`,
        tierLabel: prizeTier.trim() || 'Townhall Prize',
        title: prizeTitle.trim(),
      },
    ];
    onUpdatePrizes(nextPrizes);
    setPrizeTitle('');
    soundFX.playSelect();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="studio-glass w-full max-w-4xl rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#090D16]/60">
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">
              HR Game &amp; Content Customizer
            </h2>
            <p className="text-xs text-[#A9B4D0]">
              Add custom Nigerian songs, company trivia, emoji puzzles, or prizes
              (Saved in your browser)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFX.playSelect();
                onResetAllDefaults();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#A9B4D0] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 border-b border-white/10 flex gap-2 overflow-x-auto bg-[#090D16]/30">
          <button
            onClick={() => setActiveTab('SONGS')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SONGS'
                ? 'border-[#10B981] text-[#10B981] bg-emerald-500/10'
                : 'border-transparent text-[#A9B4D0] hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Naija Songs ({naijaSongs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('TRIVIA')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'TRIVIA'
                ? 'border-[#7C3AED] text-purple-300 bg-purple-500/10'
                : 'border-transparent text-[#A9B4D0] hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Speed Trivia ({triviaQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DECODER')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'DECODER'
                ? 'border-[#FF4F8B] text-[#FF4F8B] bg-pink-500/10'
                : 'border-transparent text-[#A9B4D0] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Emoji Puzzles ({decoderPuzzles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PRIZES')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PRIZES'
                ? 'border-[#FFB800] text-[#FFB800] bg-amber-500/10'
                : 'border-transparent text-[#A9B4D0] hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Team Prizes ({prizes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('GITHUB')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'GITHUB'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-[#A9B4D0] hover:text-white'
            }`}
          >
            <span>GitHub Actions Deploy (.yml)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: NAIJA SONGS */}
          {activeTab === 'SONGS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateSong}
                className="bg-[#090D16]/70 border border-white/10 rounded-2xl p-4 space-y-3"
              >
                <h3 className="font-display font-bold text-sm text-emerald-400">
                  + Add Custom Nigerian Hit Song
                </h3>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Famous Lyric Line / Hook *
                  </label>
                  <textarea
                    rows={2}
                    value={lyricSnippet}
                    onChange={(e) => setLyricSnippet(e.target.value)}
                    placeholder='e.g. "calm down, calm down, baby calm down..."'
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#A9B4D0] mb-1">
                      Correct Singer *
                    </label>
                    <input
                      type="text"
                      value={singerAnswer}
                      onChange={(e) => setSingerAnswer(e.target.value)}
                      placeholder="e.g. Rema"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A9B4D0] mb-1">
                      Song Title *
                    </label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="e.g. Calm Down"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Hint 1 (Vibe / Song Clue)
                  </label>
                  <input
                    type="text"
                    value={hint1Genre}
                    onChange={(e) => setHint1Genre(e.target.value)}
                    placeholder="e.g. Global Afrobeats smash with Selena Gomez remix"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Hint 2 (Singer Nickname / Bio Clue)
                  </label>
                  <input
                    type="text"
                    value={hint2Artist}
                    onChange={(e) => setHint2Artist(e.target.value)}
                    placeholder="e.g. Mavin Records prince from Benin City"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    3 Other Singers for Hint 3 Multiple-Choice (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={wrongSingers}
                    onChange={(e) => setWrongSingers(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Song to Playlist</span>
                </button>
              </form>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {naijaSongs.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        #{idx + 1}. &ldquo;{s.songTitle}&rdquo; —{' '}
                        <span className="text-emerald-400">{s.singerAnswer}</span>
                      </div>
                      <div className="text-[11px] text-[#A9B4D0] truncate">
                        {s.lyricSnippet}
                      </div>
                    </div>
                    {naijaSongs.length > 1 && (
                      <button
                        onClick={() => onDeleteNaijaSong(s.id)}
                        className="p-1.5 text-[#A9B4D0] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SPEED TRIVIA */}
          {activeTab === 'TRIVIA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateTrivia}
                className="bg-[#090D16]/70 border border-white/10 rounded-2xl p-4 space-y-3"
              >
                <h3 className="font-display font-bold text-sm text-purple-300">
                  + Add Custom Trivia Question
                </h3>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Question Prompt *
                  </label>
                  <input
                    type="text"
                    value={triviaPrompt}
                    onChange={(e) => setTriviaPrompt(e.target.value)}
                    placeholder="e.g. What year was our company founded?"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    placeholder="Option A *"
                    className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    placeholder="Option B *"
                    className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    placeholder="Option C"
                    className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    placeholder="Option D"
                    className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#A9B4D0] mb-1">
                      Correct Answer
                    </label>
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="w-full bg-[#090D16] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={0}>Option A</option>
                      <option value={1}>Option B</option>
                      <option value={2}>Option C</option>
                      <option value={3}>Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#A9B4D0] mb-1">
                      Hint Text
                    </label>
                    <input
                      type="text"
                      value={triviaHint}
                      onChange={(e) => setTriviaHint(e.target.value)}
                      placeholder="Clue when HR clicks Hint"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Trivia Question</span>
                </button>
              </form>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {triviaQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        Q{idx + 1}. {q.question}
                      </div>
                      <div className="text-[11px] text-emerald-400">
                        Answer: {q.options[q.correctIndex]}
                      </div>
                    </div>
                    {triviaQuestions.length > 1 && (
                      <button
                        onClick={() => onDeleteTrivia(q.id)}
                        className="p-1.5 text-[#A9B4D0] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EMOJI DECODER */}
          {activeTab === 'DECODER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateDecoder}
                className="bg-[#090D16]/70 border border-white/10 rounded-2xl p-4 space-y-3"
              >
                <h3 className="font-display font-bold text-sm text-[#FF4F8B]">
                  + Add Custom Emoji Puzzle
                </h3>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Emojis *
                  </label>
                  <input
                    type="text"
                    value={emojiClues}
                    onChange={(e) => setEmojiClues(e.target.value)}
                    placeholder="e.g. 🇳🇬 🎶 🌍 🔥"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Answer Phrase (Letters &amp; Spaces) *
                  </label>
                  <input
                    type="text"
                    value={decoderAnswer}
                    onChange={(e) => setDecoderAnswer(e.target.value)}
                    placeholder="e.g. AFROBEATS TO THE WORLD"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Meaning Hint Text
                  </label>
                  <input
                    type="text"
                    value={decoderHint}
                    onChange={(e) => setDecoderHint(e.target.value)}
                    placeholder="Clue shown when HR clicks Show Meaning Hint"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#FF4F8B] hover:bg-[#FF4F8B]/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Emoji Puzzle</span>
                </button>
              </form>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {decoderPuzzles.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-base">{p.clues}</div>
                      <div className="text-xs font-mono font-bold text-white">
                        #{idx + 1}: {p.answer}
                      </div>
                    </div>
                    {decoderPuzzles.length > 1 && (
                      <button
                        onClick={() => onDeleteDecoder(p.id)}
                        className="p-1.5 text-[#A9B4D0] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRIZES */}
          {activeTab === 'PRIZES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreatePrize}
                className="bg-[#090D16]/70 border border-white/10 rounded-2xl p-4 space-y-3"
              >
                <h3 className="font-display font-bold text-sm text-[#FFB800]">
                  + Add Townhall Prize
                </h3>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Prize Tier Label
                  </label>
                  <input
                    type="text"
                    value={prizeTier}
                    onChange={(e) => setPrizeTier(e.target.value)}
                    placeholder="e.g. 1st Place / Grand Prize"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B4D0] mb-1">
                    Prize Description / Reward *
                  </label>
                  <input
                    type="text"
                    value={prizeTitle}
                    onChange={(e) => setPrizeTitle(e.target.value)}
                    placeholder="e.g. ₦50,000 Shopping Voucher or Extra Day Off"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#FFB800] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Prize</span>
                </button>
              </form>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {prizes.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#FFB800]">
                        {pr.tierLabel}
                      </div>
                      <div className="text-xs font-bold text-white">
                        {pr.title}
                      </div>
                    </div>
                    {prizes.length > 1 && (
                      <button
                        onClick={() =>
                          onUpdatePrizes(prizes.filter((x) => x.id !== pr.id))
                        }
                        className="p-1.5 text-[#A9B4D0] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: GITHUB ACTIONS DEPLOY WORKFLOW */}
          {activeTab === 'GITHUB' && (
            <div className="space-y-4">
              <div className="bg-[#090D16]/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-sm text-emerald-400">
                      GitHub Pages Workflow (.github/workflows/deploy.yml)
                    </h3>
                    <p className="text-xs text-[#A9B4D0] mt-1 leading-relaxed">
                      <strong>Why was the page blank white?</strong> By default, GitHub Pages serves your raw uncompiled <code>main</code> branch instead of the built React app.
                      <br />
                      1. In your GitHub repo, go to <strong>Settings → Pages → Build and deployment</strong> and change <strong>Source</strong> to <strong>GitHub Actions</strong> (or <strong>Deploy from a branch → gh-pages</strong>).
                      <br />
                      2. Replace your <code>.github/workflows/deploy.yml</code> with the workflow below and commit:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(GITHUB_WORKFLOW_YAML);
                      setCopiedWorkflow(true);
                      setTimeout(() => setCopiedWorkflow(false), 2500);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    {copiedWorkflow ? 'Copied Workflow YAML!' : 'Copy Fixed Workflow YAML'}
                  </button>
                </div>

                <pre className="bg-black/70 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-64 select-all">
                  {GITHUB_WORKFLOW_YAML}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
