import { Card } from './app';

export type QuestionType = 
  | 'flashcard'      // Traditional flashcard
  | 'fill-in-blank'  // Cloze deletion
  | 'multiple-choice' // Generated from content
  | 'true-false'     // Generated from content
  | 'short-answer';   // Generated from content

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation?: string;
  cardId: string;
}

export interface ValidationResult {
  isCorrect: boolean;
  score: number; // 0-1 or 0-100
  feedback?: string;
}

export interface QuestionGenerator {
  generate(type: QuestionType, card: Card): Promise<GeneratedQuestion>;
  validate(answer: string, expected: string): ValidationResult;
}
