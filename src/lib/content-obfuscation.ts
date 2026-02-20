import { GeneratedQuestion, QuestionGenerator, QuestionType, ValidationResult } from '../types/question-types';
import { Card } from '../types/app';

/**
 * Basic content obfuscation utility
 */
export class ContentObfuscator {
  /**
   * Masks a portion of the content based on difficulty
   * @param content Original content
   * @param difficulty Difficulty level (0-1), higher means more masked
   */
  static obfuscateContent(content: string, difficulty: number): string {
    if (difficulty <= 0) return content;
    
    // Simple masking: mask words randomly based on difficulty probability
    const words = content.split(' ');
    return words.map(word => {
      // Keep short words and punctuation
      if (word.length <= 3 || /^[^\w]+$/.test(word)) return word;
      
      return Math.random() < difficulty ? '_____' : word;
    }).join(' ');
  }
  
  static generateDistractors(correctAnswer: string, count: number): string[] {
    // In a real app, this would use AI or similar terms from other cards.
    // For now, generate placeholder distractors.
    return Array(count).fill('Wrong Answer');
  }
}

/**
 * Basic question generator implementation
 */
export class BasicQuestionGenerator implements QuestionGenerator {
  async generate(type: QuestionType, card: Card): Promise<GeneratedQuestion> {
    const content = card.content || '';
    
    switch (type) {
      case 'fill-in-blank':
        // Simple cloze: remove random words
        const obfuscated = ContentObfuscator.obfuscateContent(content, 0.3); // 30% hidden
        return {
          type,
          question: obfuscated, // The "question" is the content with blanks
          correctAnswer: content, // Ideally, we'd store the removed words as answers
          cardId: card.id,
          explanation: card.content
        };
        
      case 'multiple-choice':
        // Generate options (mock)
        const distractors = ContentObfuscator.generateDistractors(content, 3);
        const options = [content, ...distractors].sort(() => Math.random() - 0.5);
        return {
          type,
          question: card.title || 'What is the content of this card?',
          options,
          correctAnswer: content,
          cardId: card.id
        };
        
      case 'flashcard':
      default:
        return {
          type: 'flashcard',
          question: card.title || 'Review this card',
          correctAnswer: content,
          cardId: card.id
        };
    }
  }
  
  validate(answer: string, expected: string): ValidationResult {
    // Simple string comparison for now
    const isCorrect = answer.trim().toLowerCase() === expected.trim().toLowerCase();
    return {
      isCorrect,
      score: isCorrect ? 1 : 0
    };
  }
}
