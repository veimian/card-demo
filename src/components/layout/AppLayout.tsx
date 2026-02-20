import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home, FolderTree, Settings, LogOut, Plus, LayoutDashboard } from 'lucide-react'
import clsx from 'clsx'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '仪表板', href: '/dashboard', icon: LayoutDashboard },
    { name: '分类管理', href: '/categories', icon: FolderTree },
    { name: '设置', href: '/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 glass border-r border-gray-200/50 dark:border-gray-700/50 flex-col z-20 h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>🧠</span> 知识卡片
          </h1>
        </div>

        <div className="px-4 mb-6">
          <Link
            to="/card/new"
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            新建卡片
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-700">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sticky top-0 z-10">
           <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>🧠</span> 知识卡片
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-700 text-xs">
                {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-50 pb-safe">
          <div className="grid grid-cols-4 h-16 pr-16">
            <Link
              to="/"
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <Home className={clsx("w-6 h-6", location.pathname === '/' && "fill-current")} />
              <span className="text-[10px] font-medium">首页</span>
            </Link>

            <Link
              to="/dashboard"
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                location.pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <LayoutDashboard className={clsx("w-6 h-6", location.pathname === '/dashboard' && "fill-current")} />
              <span className="text-[10px] font-medium">统计</span>
            </Link>

            <Link
              to="/categories"
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                location.pathname === '/categories' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <FolderTree className={clsx("w-6 h-6", location.pathname === '/categories' && "fill-current")} />
              <span className="text-[10px] font-medium">分类</span>
            </Link>

            <Link
              to="/settings"
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                location.pathname === '/settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <Settings className={clsx("w-6 h-6", location.pathname === '/settings' && "fill-current")} />
              <span className="text-[10px] font-medium">设置</span>
            </Link>
          </div>
          
          {/* Floating Action Button (Pizza Slice Corner) */}
          <Link
            to="/card/new"
            className={clsx(
              "fixed bottom-20 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full shadow-xl shadow-blue-500/40 flex items-center justify-center text-white active:scale-95 transition-all duration-300 z-50",
              location.pathname.startsWith('/card/') && location.pathname !== '/card/new' ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100 translate-y-0'
            )}
          >
            <Plus className="w-8 h-8" />
          </Link>
        </div>
      </div>
    </div>
  )
}
