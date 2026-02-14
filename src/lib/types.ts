export interface FermiQuestion {
  question: string;
  answer: string;
}

export type GamePhase = "loading" | "playing" | "feedback" | "end";

export interface FeedbackData {
  points: number;
  hit: boolean;
  trueExponent: number;
  rawAnswer: string;
}
