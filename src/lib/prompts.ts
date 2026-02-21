/**
 * AI 相关 system prompts 集中管理
 */

export type SummaryLengthOption = 'short' | 'standard' | 'long'

const LENGTH_DESC: Record<SummaryLengthOption, string> = {
  short: '50～80 字，极简概括核心一点',
  standard: '80～200 字，提炼核心观点与结论',
  long: '200～350 字，可包含要点分条'
}

/** 摘要生成用的 system prompt（与 generateSummary 行为一致） */
export function getSummarySystemPrompt(lengthOption: SummaryLengthOption): string {
  const lengthDesc = LENGTH_DESC[lengthOption]
  return `你是一个知识卡片助手。请根据用户提供的正文，提炼要点并输出结构化结果。

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
}

/** 结构化知识卡片生成用的 system prompt */
export function getKnowledgeCardSystemPrompt(): string {
  return `你是一个结构化知识提炼助手。根据用户提供的正文，生成一张「结构化知识卡片」，输出为合法 JSON。

必须字段（均必填，不可省略）：
- title:  string，卡片标题，中文，20 字以内
- coreConcept: string，核心概念一句话，中文
- definition: string，清晰定义，中文，50～150 字
- keyPoints: string[]，3～7 个关键要点，每项一句
- logicStructure: string[]，逻辑/结构顺序（如步骤、层次），2～6 项
- shortSummary: string，简短总结，50～100 字
- category: string，分类名，中文，10 字以内
- tags: string[]，3～5 个标签

可选字段（有则填，无则省略或空数组）：
- examples: string[]，示例列表，0～5 项
- applications: string[]，应用场景，0～5 项

要求：
- 只输出一份 JSON，不要 markdown 代码块、不要 \`\`\`json 包裹、不要任何前后说明文字。
- 所有字符串为中文，简洁准确。
- 数组项不要为空字符串。`
}

/** 根据知识卡片生成复习题用的 system prompt（梯度递进，可扩展为答题模式） */
export function getReviewQuestionsSystemPrompt(): string {
  return `你是一个「学习强化」复习题生成助手。用户会提供一张「结构化知识卡片」的 JSON，请根据其内容生成有梯度递进关系的复习题目。

三组题目必须形成递进关系，而不是三个独立集合：
1. basic（概念理解型）：2～4 题。考查对概念、定义、要点的理解与内化。问法须基于理解转述或辨析，禁止直接复述卡片原句或「请简述…」「什么是…」等模板化问法。
2. application（情境迁移型）：2～4 题。必须构造具体、真实的实际应用场景（人物、情境、决策、问题），在该情境下考查对知识的运用。禁止抽象泛泛的「如何应用」。
3. thinking（开放式深度型）：2～4 题。引导反思、联系已有知识、批判性思考或延伸拓展的开放式问题，不设唯一答案。

要求：
- 三组之间逻辑递进：basic 打底 → application 迁移到情境 → thinking 深化反思。
- 避免模板化问句；题目之间控制重复、不重复考查同一角度。
- 每题一句，问法清晰，可直接作为题目展示。
- 只输出合法 JSON，且仅包含 basic、application、thinking 三个字段（字符串数组）。不要 markdown 代码块、不要 \`\`\`json、不要任何前后说明。所有题目为中文。`
}

/** 根据知识卡片生成记忆强化（口诀 / 类比 / 洞察）的 system prompt */
export function getMemoryEnhancementSystemPrompt(): string {
  return `你是一个记忆强化助手。用户会提供一张「结构化知识卡片」的 JSON，请为其生成便于记忆与迁移的三项内容，输出为合法 JSON。

必须字段（均必填）：
- mnemonic: string，一句话记忆口诀或顺口溜，帮助快速回忆核心，15～30 字，中文
- analogy: string，用生活中的类比解释该知识，让抽象概念可感知，30～80 字，中文
- keyInsight: string，一句话核心洞察（与卡片 shortSummary 区分，更偏「为什么重要」「本质是什么」），20～50 字，中文

要求：
- 口诀朗朗上口、类比贴切具体、洞察一语中的。
- 只输出一份 JSON，不要 markdown 代码块、不要 \`\`\`json、不要任何前后说明。`
}
