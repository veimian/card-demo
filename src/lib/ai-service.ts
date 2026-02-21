import OpenAI from 'openai'
import { supabase } from './supabase'
import { getKnowledgeCardSystemPrompt, getReviewQuestionsSystemPrompt, getMemoryEnhancementSystemPrompt } from './prompts'
import type { KnowledgeCard, ReviewQuestions, MemoryEnhancement } from '../types/knowledge-card'

export interface AIAnalysisResult {
  title: string;
  summary: string;
  category: string;
  tags: string[];
}

export type SummaryLengthOption = 'short' | 'standard' | 'long';

/** 安全解析 JSON 并规整为 KnowledgeCard 结构，缺失或非法字段用默认值 */
function safeParseKnowledgeCard(raw: string): KnowledgeCard {
  const emptyCard: KnowledgeCard = {
    title: '',
    coreConcept: '',
    definition: '',
    keyPoints: [],
    logicStructure: [],
    shortSummary: '',
    category: '',
    tags: []
  }
  let parsed: unknown
  try {
    const trimmed = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    parsed = JSON.parse(trimmed)
  } catch (e) {
    console.error('KnowledgeCard JSON parse failed:', e)
    return { ...emptyCard, shortSummary: raw.slice(0, 500) }
  }
  if (!parsed || typeof parsed !== 'object') return emptyCard
  const o = parsed as Record<string, unknown>
  const ensureStr = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback)
  const ensureStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  return {
    title: ensureStr(o.title, ''),
    coreConcept: ensureStr(o.coreConcept, ''),
    definition: ensureStr(o.definition, ''),
    keyPoints: ensureStrArr(o.keyPoints),
    logicStructure: ensureStrArr(o.logicStructure),
    examples: Array.isArray(o.examples) ? o.examples.filter((x): x is string => typeof x === 'string') : undefined,
    applications: Array.isArray(o.applications) ? o.applications.filter((x): x is string => typeof x === 'string') : undefined,
    shortSummary: ensureStr(o.shortSummary, ''),
    category: ensureStr(o.category, ''),
    tags: ensureStrArr(o.tags)
  }
}

/** 安全解析 JSON 为 ReviewQuestions，缺失或非法字段用空数组 */
function safeParseReviewQuestions(raw: string): ReviewQuestions {
  const empty: ReviewQuestions = { basic: [], application: [], thinking: [] }
  let parsed: unknown
  try {
    const trimmed = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    parsed = JSON.parse(trimmed)
  } catch (e) {
    console.error('ReviewQuestions JSON parse failed:', e)
    return empty
  }
  if (!parsed || typeof parsed !== 'object') return empty
  const o = parsed as Record<string, unknown>
  const ensureStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  return {
    basic: ensureStrArr(o.basic),
    application: ensureStrArr(o.application),
    thinking: ensureStrArr(o.thinking)
  }
}

/** 安全解析 JSON 为 MemoryEnhancement，缺失或非法字段用空字符串 */
function safeParseMemoryEnhancement(raw: string): MemoryEnhancement {
  const empty: MemoryEnhancement = { mnemonic: '', analogy: '', keyInsight: '' }
  let parsed: unknown
  try {
    const trimmed = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    parsed = JSON.parse(trimmed)
  } catch (e) {
    console.error('MemoryEnhancement JSON parse failed:', e)
    return empty
  }
  if (!parsed || typeof parsed !== 'object') return empty
  const o = parsed as Record<string, unknown>
  const ensureStr = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback)
  return {
    mnemonic: ensureStr(o.mnemonic, ''),
    analogy: ensureStr(o.analogy, ''),
    keyInsight: ensureStr(o.keyInsight, '')
  }
}

class AIService {
  private openai: OpenAI | null = null;
  
  private async getApiKey(): Promise<string | null> {
    // 1. Try LocalStorage
    let apiKey = localStorage.getItem('deepseek_api_key') || import.meta.env.VITE_DEEPSEEK_API_KEY
    
    // 2. Try System Settings (if not in local storage)
    if (!apiKey) {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'deepseek_default_key')
          .single()
        
        if (data?.value) {
          apiKey = data.value
        }
      } catch (error) {
        console.error('Failed to fetch default API key:', error)
      }
    }
    
    return apiKey;
  }

  private async initClient() {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('请先在设置中配置 DeepSeek API Key');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: true
    });
  }

  async generateSummary(content: string, lengthOption: SummaryLengthOption = 'standard'): Promise<AIAnalysisResult> {
    if (!this.openai) {
      await this.initClient();
    }

    const lengthDesc = {
      short: '50～80 字，极简概括核心一点',
      standard: '80～200 字，提炼核心观点与结论',
      long: '200～350 字，可包含要点分条'
    }[lengthOption];

    try {
      const maxLen = 12000
      const truncatedContent = content.length > maxLen ? content.slice(0, maxLen) + '\n...(后文已截断)' : content

      const response = await this.openai!.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个知识卡片助手。请根据用户提供的正文，提炼要点并输出结构化结果。

要求：
1. title：简短标题，中文，20 字以内，概括主题。
2. summary：一段话摘要，中文，${lengthDesc}。不要复述原文，不要「本文介绍了」等套话。
3. category：一个分类名，中文，10 字以内。
4. tags：3～5 个标签，中文或英文，每个尽量简短。

只输出合法 JSON，不要 markdown 代码块或其它说明：
{
  "title": "...",
  "summary": "...",
  "category": "...",
  "tags": ["...", "..."]
}`
          },
          {
            role: 'user',
            content: truncatedContent
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })

      const result = response.choices[0]?.message?.content
      if (!result) throw new Error('No response generated')

      try {
        return JSON.parse(result) as AIAnalysisResult
      } catch (e) {
        console.error('Failed to parse JSON response:', result)
        // Fallback for non-JSON response
        return {
          title: '未命名卡片',
          summary: result,
          category: '未分类',
          tags: []
        }
      }
    } catch (error: any) {
      console.error('DeepSeek API Error:', error)
      // Force re-init on next call if unauthorized (key might be invalid)
      if (error.status === 401) {
        this.openai = null;
      }
      throw new Error(error.message || '生成摘要失败')
    }
  }

  async generateTags(content: string): Promise<string[]> {
    const result = await this.generateSummary(content);
    return result.tags;
  }

  /**
   * 结构化知识卡片生成：从正文生成 KnowledgeCard，temperature=0.4，强制 JSON 输出并安全解析
   */
  async generateKnowledgeCard(content: string): Promise<KnowledgeCard> {
    if (!this.openai) await this.initClient()

    const maxLen = 12000
    const truncatedContent = content.length > maxLen ? content.slice(0, maxLen) + '\n...(后文已截断)' : content

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: getKnowledgeCardSystemPrompt() },
          { role: 'user', content: truncatedContent }
        ],
        max_tokens: 2000,
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })

      const raw = response.choices[0]?.message?.content
      if (!raw) throw new Error('No response generated')
      return safeParseKnowledgeCard(raw)
    } catch (error: unknown) {
      const err = error as { status?: number }
      if (err?.status === 401) this.openai = null
      console.error('generateKnowledgeCard error:', error)
      throw new Error(error instanceof Error ? error.message : '生成知识卡片失败')
    }
  }

  /**
   * 根据知识卡片生成复习题（概念理解→情境迁移→深度思考，梯度递进），temperature=0.4，JSON 强制输出
   */
  async generateReviewQuestions(card: KnowledgeCard): Promise<ReviewQuestions> {
    if (!this.openai) await this.initClient()

    try {
      const userContent = JSON.stringify(card, null, 0)
      const response = await this.openai!.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: getReviewQuestionsSystemPrompt() },
          { role: 'user', content: userContent }
        ],
        max_tokens: 1500,
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })

      const raw = response.choices[0]?.message?.content
      if (!raw) throw new Error('No response generated')
      return safeParseReviewQuestions(raw)
    } catch (error: unknown) {
      const err = error as { status?: number }
      if (err?.status === 401) this.openai = null
      console.error('generateReviewQuestions error:', error)
      throw new Error(error instanceof Error ? error.message : '生成复习题失败')
    }
  }

  /**
   * 根据知识卡片生成记忆强化（口诀 / 类比 / 核心洞察），temperature=0.6，JSON 强制输出
   */
  async generateLearningEnhancement(card: KnowledgeCard): Promise<MemoryEnhancement> {
    if (!this.openai) await this.initClient()

    try {
      const userContent = JSON.stringify(card, null, 0)
      const response = await this.openai!.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: getMemoryEnhancementSystemPrompt() },
          { role: 'user', content: userContent }
        ],
        max_tokens: 800,
        temperature: 0.6,
        response_format: { type: 'json_object' }
      })

      const raw = response.choices[0]?.message?.content
      if (!raw) throw new Error('No response generated')
      return safeParseMemoryEnhancement(raw)
    } catch (error: unknown) {
      const err = error as { status?: number }
      if (err?.status === 401) this.openai = null
      console.error('generateLearningEnhancement error:', error)
      throw new Error(error instanceof Error ? error.message : '生成记忆强化失败')
    }
  }
}

export const aiService = new AIService()

// Backward compatibility
export const generateSummary = (content: string, lengthOption?: SummaryLengthOption) =>
  aiService.generateSummary(content, lengthOption ?? 'standard')

export const generateKnowledgeCard = (content: string) => aiService.generateKnowledgeCard(content)

export const generateReviewQuestions = (card: KnowledgeCard) => aiService.generateReviewQuestions(card)

export const generateLearningEnhancement = (card: KnowledgeCard) => aiService.generateLearningEnhancement(card)
