# 快速创建系统设计方案

## 核心功能架构

### 1. 浮动快速创建按钮

```typescript
// src/components/QuickAdd/FloatingQuickAdd.tsx
import { useState, useRef } from 'react';
import { Plus, Sparkles, FileText, Link, Mic, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateCard } from '../../hooks/useQueries';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAddOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
  shortcut?: string;
}

export default function FloatingQuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const { user } = useAuth();
  const createCardMutation = useCreateCard();
  
  const quickAddOptions: QuickAddOption[] = [
    {
      id: 'text',
      title: '文本卡片',
      icon: <Type className="w-5 h-5" />,
      description: '快速输入文字内容',
      action: () => setSelectedMode('text'),
      shortcut: 'T'
    },
    {
      id: 'ai',
      title: 'AI制卡',
      icon: <Sparkles className="w-5 h-5" />,
      description: '智能生成卡片内容',
      action: () => setSelectedMode('ai'),
      shortcut: 'A'
    },
    {
      id: 'clipboard',
      title: '剪贴板',
      icon: <FileText className="w-5 h-5" />,
      description: '从剪贴板创建',
      action: () => handleClipboardCreate(),
      shortcut: 'V'
    },
    {
      id: 'link',
      title: '网页链接',
      icon: <Link className="w-5 h-5" />,
      description: '保存网页内容',
      action: () => setSelectedMode('link'),
      shortcut: 'L'
    },
    {
      id: 'voice',
      title: '语音输入',
      icon: <Mic className="w-5 h-5" />,
      description: '语音转文字制卡',
      action: () => setSelectedMode('voice'),
      shortcut: 'M'
    }
  ];

  const handleClipboardCreate = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText.trim()) {
        await createCardMutation.mutateAsync({
          title: clipboardText.substring(0, 50) + (clipboardText.length > 50 ? '...' : ''),
          content: clipboardText,
          user_id: user!.id,
          category_id: null
        });
        toast.success('已从剪贴板创建卡片');
      }
    } catch (error) {
      toast.error('无法访问剪贴板');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 主按钮 */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: 0 }}
              animate={{ rotate: 45 }}
              exit={{ rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 45 }}
              animate={{ rotate: 0 }}
              exit={{ rotate: 45 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 展开选项 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 space-y-3"
          >
            {quickAddOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={option.action}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all w-64"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {option.icon}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
                    {option.title}
                    {option.shortcut && (
                      <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                        {option.shortcut}
                      </kbd>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷键监听 */}
      <KeyboardShortcuts 
        isOpen={isOpen} 
        options={quickAddOptions}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

// 快捷键处理组件
function KeyboardShortcuts({ 
  isOpen, 
  options, 
  onClose 
}: { 
  isOpen: boolean; 
  options: QuickAddOption[]; 
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      const option = options.find(opt => 
        opt.shortcut?.toLowerCase() === e.key.toLowerCase()
      );
      
      if (option) {
        e.preventDefault();
        option.action();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options, onClose]);
  
  return null;
}
```

### 2. AI智能制卡组件

```typescript
// src/components/QuickAdd/AICardCreator.tsx
import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { generateAICard } from '../../lib/ai-service';
import { useCreateCard } from '../../hooks/useQueries';
import { useAuth } from '../../contexts/AuthContext';

interface AICreationState {
  status: 'idle' | 'processing' | 'success' | 'error';
  result?: {
    title: string;
    content: string;
    summary: string;
    tags: string[];
  };
  error?: string;
}

export default function AICardCreator() {
  const [input, setInput] = useState('');
  const [state, setState] = useState<AICreationState>({ status: 'idle' });
  const { user } = useAuth();
  const createCardMutation = useCreateCard();
  
  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setState({ status: 'processing' });
    
    try {
      const result = await generateAICard(input);
      setState({ status: 'success', result });
    } catch (error) {
      setState({ 
        status: 'error', 
        error: (error as Error).message 
      });
    }
  };
  
  const handleSave = async () => {
    if (state.status !== 'success' || !state.result) return;
    
    try {
      await createCardMutation.mutateAsync({
        title: state.result.title,
        content: state.result.content,
        summary: state.result.summary,
        user_id: user!.id,
        category_id: null
      });
      
      toast.success('AI卡片创建成功！');
      setState({ status: 'idle' });
      setInput('');
    } catch (error) {
      toast.error('保存失败');
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          AI智能制卡
        </h2>
      </div>
      
      {state.status === 'idle' && (
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入任何你想记住的内容，AI会帮你制作成知识卡片..."
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleGenerate}
            disabled={!input.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            生成知识卡片
          </button>
        </div>
      )}
      
      {state.status === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            AI正在分析并制作卡片...
          </p>
        </div>
      )}
      
      {state.status === 'success' && state.result && (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {state.result.title}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {state.result.content}
            </p>
            {state.result.summary && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>摘要：</strong> {state.result.summary}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              保存卡片
            </button>
            <button
              onClick={() => setState({ status: 'idle' })}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              重新生成
            </button>
          </div>
        </div>
      )}
      
      {state.status === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {state.error}
          </p>
          <button
            onClick={() => setState({ status: 'idle' })}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
}
```

### 3. 语音输入组件

```typescript
// src/components/QuickAdd/VoiceInput.tsx
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Check } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export default function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    transcript: speechTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true
  });
  
  useEffect(() => {
    setTranscript(speechTranscript);
  }, [speechTranscript]);
  
  const handleStartRecording = () => {
    if (!hasRecognitionSupport) {
      toast.error('您的浏览器不支持语音识别');
      return;
    }
    
    startListening();
    setIsRecording(true);
  };
  
  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
    setIsProcessing(true);
    
    // 模拟处理时间
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };
  
  const handleReset = () => {
    resetTranscript();
    setTranscript('');
    setIsRecording(false);
    setIsProcessing(false);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          {isRecording ? (
            <div className="w-8 h-8 bg-red-500 rounded-full animate-pulse"></div>
          ) : (
            <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          语音输入
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          点击麦克风开始说话，AI会自动转换为文字
        </p>
      </div>
      
      <div className="mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 min-h-32">
          {transcript ? (
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {transcript}
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              {isRecording ? '正在聆听...' : '点击下方麦克风开始录音'}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={isProcessing}
            className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Mic className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          >
            <Square className="w-6 h-6" />
          </button>
        )}
        
        {(transcript || isRecording) && (
          <button
            onClick={handleReset}
            disabled={isRecording}
            className="w-16 h-16 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center shadow transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
        
        {transcript && !isRecording && (
          <button
            onClick={() => {/* 保存到卡片 */}}
            className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          >
            <Check className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 text-sm">
              正在处理语音内容...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// 语音识别Hook
// src/hooks/useSpeechRecognition.ts
export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const hasRecognitionSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  useEffect(() => {
    if (!hasRecognitionSupport) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? false;
    recognition.lang = options.lang ?? 'zh-CN';
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript + interimTranscript);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    return () => {
      recognition.stop();
    };
  }, [options.continuous, options.interimResults, options.lang]);
  
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };
  
  const resetTranscript = () => {
    setTranscript('');
  };
  
  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  };
}
```

### 4. 模板系统

```typescript
// src/components/QuickAdd/TemplateSelector.tsx
import { useState } from 'react';
import { BookOpen, Lightbulb, Target, Calendar } from 'lucide-react';

interface CardTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  fields: {
    title: string;
    content: string;
    placeholder: string;
  };
  examples: string[];
}

const TEMPLATES: CardTemplate[] = [
  {
    id: 'concept',
    name: '概念解释',
    icon: <Lightbulb className="w-5 h-5" />,
    description: '解释重要概念或定义',
    fields: {
      title: '概念名称',
      content: '详细解释',
      placeholder: '请输入概念的定义和说明...'
    },
    examples: [
      '什么是机器学习？',
      '解释光合作用的过程',
      '什么是区块链技术？'
    ]
  },
  {
    id: 'fact',
    name: '事实记忆',
    icon: <BookOpen className="w-5 h-5" />,
    description: '记住重要事实和数据',
    fields: {
      title: '事实主题',
      content: '具体内容',
      placeholder: '请输入需要记忆的事实信息...'
    },
    examples: [
      '中国的首都是北京',
      '水的化学分子式是H₂O',
      '地球的卫星是月球'
    ]
  },
  {
    id: 'procedure',
    name: '操作步骤',
    icon: <Target className="w-5 h-5" />,
    description: '记录操作流程或步骤',
    fields: {
      title: '操作名称',
      content: '详细步骤',
      placeholder: '请按顺序列出操作步骤...'
    },
    examples: [
      '如何制作一杯咖啡',
      '急救心肺复苏步骤',
      '安装软件的流程'
    ]
  }
];

export default function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  
  const handleTemplateSelect = (template: CardTemplate) => {
    setSelectedTemplate(template);
    setFormData({ title: '', content: '' });
  };
  
  const handleSubmit = () => {
    // 处理表单提交
    console.log('Creating card with template:', { ...formData, template: selectedTemplate?.id });
  };
  
  if (selectedTemplate) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              {selectedTemplate.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedTemplate.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {selectedTemplate.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedTemplate(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← 返回模板选择
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {selectedTemplate.fields.title}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={selectedTemplate.fields.placeholder.split('\n')[0]}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {selectedTemplate.fields.content}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={selectedTemplate.fields.placeholder}
              rows={6}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!formData.title.trim() || !formData.content.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            创建卡片
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        选择制卡模板
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        选择合适的模板可以更快地创建高质量的知识卡片
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:shadow-md transition-all bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                {template.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {template.name}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {template.description}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              示例：
              <ul className="list-disc list-inside mt-1 space-y-1">
                {template.examples.slice(0, 2).map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

这套快速创建系统大大降低了用户制作知识卡片的门槛，通过多种输入方式和智能化辅助，让用户能够更便捷地将知识转化为可复习的卡片格式。