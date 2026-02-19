import OpenAI from 'openai'

export interface AIAnalysisResult {
  title: string;
  summary: string;
  category: string;
  tags: string[];
}

export async function generateSummary(content: string): Promise<AIAnalysisResult> {
  const apiKey = localStorage.getItem('deepseek_api_key') || import.meta.env.VITE_DEEPSEEK_API_KEY
  
  if (!apiKey) {
    throw new Error('请先在设置中配置 DeepSeek API Key')
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com',
    dangerouslyAllowBrowser: true
  })

  try {
    const truncatedContent = content.length > 12000 ? content.slice(0, 12000) + '...(truncated)' : content

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that analyzes text. Please provide:
1. A concise summary (max 200 words) in Chinese
2. A single category name (short, max 10 chars)
3. 3-5 relevant tags
4. A short and descriptive title (max 20 chars)

Return ONLY valid JSON in the following format, without any markdown formatting:
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
    throw new Error(error.message || '生成摘要失败')
  }
}
