export interface FermiQuestion {
  question: string;
  answer: number;
  units: string;
  source_text: string;
  source_url: string;
  category: string;
  year: number;
  difficulty: string;
}

export type GamePhase = "loading" | "playing" | "feedback" | "end";

export interface FeedbackData {
  points: number;
  hit: boolean;
  trueExponent: number;
  rawAnswer: number;
  units: string;
  source_text: string;
  source_url: string;
  ratingDelta: number;
}
