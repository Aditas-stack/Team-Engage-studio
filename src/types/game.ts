export type GameState =
  | 'TITLE_MENU'
  | 'NAIJA_SONGS'
  | 'SPEED_TRIVIA'
  | 'SURVEY_FEUD'
  | 'WORD_DECODER'
  | 'WINNER_DRAW';

export interface NaijaSongQuestion {
  id: string;
  songTitle: string;
  lyricSnippet: string;
  singerAnswer: string;
  releaseYear: string;
  bpm: number;
  audioUrl?: string;
  hint1GenreOrVibe: string;
  hint2ArtistClue: string;
  multipleChoiceOptions: string[]; // 4 singers for Hint 3
  funFact: string;
}

export interface FeudAnswer {
  id: string;
  text: string;
  points: number;
  hint: string;
  revealed: boolean;
}

export interface FeudQuestion {
  id: string;
  prompt: string;
  category: string;
  generalHint: string;
  answers: FeudAnswer[];
}

export interface TriviaQuestion {
  id: string;
  question: string;
  category: string;
  options: string[];
  correctIndex: number;
  hintText: string;
  timeLimitSec: number;
  funFact: string;
}

export interface DecoderPuzzle {
  id: string;
  clues: string;
  category: string;
  answer: string;
  clueNote: string;
}

export interface PrizeItem {
  id: string;
  title: string;
  tierLabel: string;
  winningResult?: string;
  drawnAt?: string;
}
