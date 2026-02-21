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
    if (difficulty <= 0 || !content.trim()) return content;

    const trimmed = content.trim();
    const hasSpaces = /\s+/.test(trimmed);
    const isCjkOrLongWord = (s: string) => /[\u4e00-\u9fff\u3000-\u303f]/.test(s) || s.length > 8;

    // 无空格或以中文为主：按字符/短段遮挡，避免整段变成一条横线
    if (!hasSpaces || (trimmed.length <= 20 && isCjkOrLongWord(trimmed))) {
      const chars = Array.from(trimmed);
      const segmentSize = 2; // 每 2 个字符为一组，按组遮挡
      let result = '';
      for (let i = 0; i < chars.length; i += segmentSize) {
        const segment = chars.slice(i, i + segmentSize).join('');
        const isPunct = /^[^\w\u4e00-\u9fff]+$/.test(segment);
        if (segment.length <= 1 || isPunct) {
          result += segment;
        } else {
          result += Math.random() < difficulty ? '____' : segment;
        }
      }
      return result;
    }

    // 有空格：按词遮挡
    const words = trimmed.split(/\s+/);
    return words.map(word => {
      if (word.length <= 3 || /^[^\w\u4e00-\u9fff]+$/.test(word)) return word;
      // 长词（如整句中文被误判为一词）也按段遮挡，不整词替换
      if (word.length > 8) {
        const chars = Array.from(word);
        let part = '';
        for (let i = 0; i < chars.length; i += 2) {
          const seg = chars.slice(i, i + 2).join('');
          part += Math.random() < difficulty ? '____' : seg;
        }
        return part;
      }
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
    const content = card.content || (card as { summary?: string | null }).summary || '';
    
    switch (type) {
      case 'fill-in-blank': {
        // Simple cloze: remove random words
        const obfuscated = ContentObfuscator.obfuscateContent(content, 0.3); // 30% hidden
        return {
          type,
          question: obfuscated, // The "question" is the content with blanks
          correctAnswer: content, // Ideally, we'd store the removed words as answers
          cardId: card.id,
          explanation: content
        };
      }
        
      case 'multiple-choice': {
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
      }
        
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
