import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Save, Key, User, Shield, Smartphone, Palette, Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  
  // Theme state would typically be managed by a context or hook
  // For now we'll simulate it with local state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    const storedKey = localStorage.getItem('deepseek_api_key')
    if (storedKey) setApiKey(storedKey)
  }, [])

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem('deepseek_api_key')
      toast.success('API Key 已清除')
      return
    }
    
    localStorage.setItem('deepseek_api_key', apiKey.trim())
    toast.success('API Key 已保存')
  }

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    toast.success(`已切换至${newTheme === 'light' ? '日间' : '夜间'}模式`)
  }

  const tabs = [
    { id: 'general', name: '通用设置', icon: User },
    { id: 'appearance', name: '外观主题', icon: Palette },
    { id: 'ai', name: 'AI 设置', icon: Key },
    { id: 'security', name: '安全隐私', icon: Shield },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">设置</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">个人信息</h2>
                <p className="text-sm text-gray-500 mt-1">管理您的基本账户信息</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 sm:text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">邮箱地址暂不支持修改</p>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">外观设置</h2>
                <p className="text-sm text-gray-500 mt-1">自定义界面显示风格</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => toggleTheme('light')}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <Sun className="w-6 h-6 text-orange-500" />
                      </div>
                      <span className={`font-medium ${theme === 'light' ? 'text-blue-700' : 'text-gray-700'}`}>
                        日间模式
                      </span>
                    </div>
                    {theme === 'light' && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleTheme('dark')}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-gray-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-800 rounded-full shadow-sm">
                        <Moon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                        夜间模式
                      </span>
                    </div>
                    {theme === 'dark' && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-900" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">AI 配置</h2>
                <p className="text-sm text-gray-500 mt-1">配置 DeepSeek API 以启用智能摘要功能</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DeepSeek API Key
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="sk-..."
                      />
                    </div>
                    <button
                      onClick={handleSaveKey}
                      className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    您的 API Key 仅存储在本地浏览器中，不会发送到我们的服务器。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">安全与隐私</h2>
                <p className="text-sm text-gray-500 mt-1">管理您的账户安全设置</p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">多设备同步</h3>
                    <p className="text-sm text-gray-500 mt-1">在所有登录设备间同步数据</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-blue-600"/>
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
