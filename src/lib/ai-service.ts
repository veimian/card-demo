import OpenAI from 'openai'
import { supabase } from './supabase'

export interface AIAnalysisResult {
  title: string;
  summary: string;
  category: string;
  tags: string[];
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

  async generateSummary(content: string): Promise<AIAnalysisResult> {
    if (!this.openai) {
      await this.initClient();
    }

    try {
      const truncatedContent = content.length > 12000 ? content.slice(0, 12000) + '...(truncated)' : content

      const response = await this.openai!.chat.completions.create({
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
}

export const aiService = new AIService();

// Backward compatibility
export const generateSummary = (content: string) => aiService.generateSummary(content);
