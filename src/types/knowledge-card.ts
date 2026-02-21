/**
 * 结构化知识卡片 - 由 AI 从正文生成
 */
export interface KnowledgeCard {
  title: string
  coreConcept: string
  definition: string
  keyPoints: string[]
  logicStructure: string[]
  examples?: string[]
  applications?: string[]
  shortSummary: string
  category: string
  tags: string[]
}

/**
 * 复习题目 - 由 AI 根据知识卡片生成，支持后续扩展为带答案的答题模式
 */
export interface ReviewQuestions {
  basic: string[]
  application: string[]
  thinking: string[]
}

/**
 * 记忆强化 - 由 AI 根据知识卡片生成，用于口诀 / 类比 / 核心洞察
 */
export interface MemoryEnhancement {
  mnemonic: string
  analogy: string
  keyInsight: string
}
