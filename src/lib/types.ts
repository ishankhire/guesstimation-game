export interface QuestionData {
  question: string;
  program: string;
  answer: string;
  context: string;
}

export interface ParsedAnswer {
  value: number;
  unit: string;
  display: string;
}

export interface SubmissionResult {
  score: number;
  actualAnswer: ParsedAnswer;
  lowerBound: number;
  upperBound: number;
  scoringRule: "distance" | "order_of_magnitude";
}
