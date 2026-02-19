import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Save, Key, User, Shield, Smartphone, Palette, Moon, Sun, Download, Upload, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [nickname, setNickname] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  
  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Theme state would typically be managed by a context or hook
  // For now we'll simulate it with local state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    const storedKey = localStorage.getItem('deepseek_api_key')
    if (storedKey) setApiKey(storedKey)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
          
        if (error) throw error
        if (data && data.name) {
          setNickname(data.name)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
    
    fetchProfile()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    if (!nickname.trim()) return toast.error('昵称不能为空')
    
    try {
      setSavingProfile(true)
      const { error } = await supabase
        .from('users')
        .update({ name: nickname.trim() })
        .eq('id', user.id)
        
      if (error) throw error
      toast.success('个人信息已更新')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('更新失败')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) return toast.error('请输入新密码')
    if (newPassword.length < 6) return toast.error('密码长度至少为6位')
    if (newPassword !== confirmPassword) return toast.error('两次输入的密码不一致')
    
    try {
      setChangingPassword(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      toast.success('密码已更新')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || '密码更新失败')
    } finally {
      setChangingPassword(false)
    }
  }

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

  const handleExportData = async (format: 'json' | 'markdown') => {
    if (!user) return
    
    try {
      setExporting(true)
      const toastId = toast.loading('正在导出数据...')
      
      // Fetch all user data
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select(`
          *,
          categories (*),
          card_tags (
            tags (*)
          )
        `)
        .eq('user_id', user.id)
      
      if (cardsError) throw cardsError
      
      if (format === 'json') {
        const dataStr = JSON.stringify(cards, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `knowledge-cards-backup-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Markdown Export
        let mdContent = '# Knowledge Cards Backup\n\n'
        cards?.forEach(card => {
          mdContent += `## ${card.title}\n\n`
          if (card.summary) mdContent += `> ${card.summary}\n\n`
          mdContent += `${card.content}\n\n`
          
          const tags = card.card_tags.map((ct: any) => ct.tags?.name).filter(Boolean).join(', ')
          if (tags) mdContent += `**Tags:** ${tags}\n`
          if (card.categories) mdContent += `**Category:** ${card.categories.name}\n`
          mdContent += `\n---\n\n`
        })
        
        const blob = new Blob([mdContent], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `knowledge-cards-export-${new Date().toISOString().slice(0, 10)}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      toast.success('导出成功', { id: toastId })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const tabs = [
    { id: 'general', name: '通用设置', icon: User },
    { id: 'appearance', name: '外观主题', icon: Palette },
    { id: 'data', name: '数据管理', icon: FileText },
    { id: 'ai', name: 'AI 设置', icon: Key },
    { id: 'security', name: '安全隐私', icon: Shield },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">设置</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="flex overflow-x-auto md:flex-col md:overflow-visible space-x-2 md:space-x-0 md:space-y-1 pb-2 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="whitespace-nowrap">{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">个人信息</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理您的基本账户信息</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    昵称
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="设置您的昵称"
                      className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile || !nickname.trim()}
                      className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[80px]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingProfile ? '保存中' : '保存'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">邮箱地址暂不支持修改</p>
                </div>
                
                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">修改密码</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        新密码
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="请输入新密码"
                        className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        确认新密码
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="请再次输入新密码"
                        className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={changingPassword || !newPassword || !confirmPassword}
                        className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        {changingPassword ? '修改中...' : '修改密码'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">外观设置</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">自定义界面显示风格</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => toggleTheme('light')}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                        <Sun className="w-6 h-6 text-orange-500" />
                      </div>
                      <span className={`font-medium ${theme === 'light' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        日间模式
                      </span>
                    </div>
                    {theme === 'light' && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleTheme('dark')}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-gray-900 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-800 dark:bg-gray-900 rounded-full shadow-sm">
                        <Moon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        夜间模式
                      </span>
                    </div>
                    {theme === 'dark' && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-900 dark:border-gray-800" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Management Settings */}
          {activeTab === 'data' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">数据管理</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">导入、导出或备份您的数据</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleExportData('json')}
                    disabled={exporting}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 dark:border-gray-700 border-dashed rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">导出 JSON 备份</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">包含所有元数据的完整备份</p>
                  </button>

                  <button
                    onClick={() => handleExportData('markdown')}
                    disabled={exporting}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 dark:border-gray-700 border-dashed rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                      <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">导出 Markdown</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">适合迁移到其他笔记软件</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI 配置</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">配置 DeepSeek API 以启用智能摘要功能</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    DeepSeek API Key
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="sk-..."
                      />
                    </div>
                    <button
                      onClick={handleSaveKey}
                      className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    您的 API Key 仅存储在本地浏览器中，不会发送到我们的服务器。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">安全与隐私</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理您的账户安全设置</p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">多设备同步</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">在所有登录设备间同步数据</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-600 border-4 appearance-none cursor-pointer border-gray-300 dark:border-gray-500 checked:right-0 checked:border-blue-600 dark:checked:border-blue-500"/>
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
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
