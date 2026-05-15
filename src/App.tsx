import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import CardEditor from './pages/CardEditor'
import SharedCard from './pages/SharedCard'
import Review from './pages/Review'
import Dashboard from './pages/Dashboard'

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">页面不存在</h1>
      <p className="text-gray-500 dark:text-gray-400">请检查地址，或返回首页继续使用。</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/share/:token" element={<SharedCard />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/review" element={<Review />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/card/new" element={<CardEditor />} />
            <Route path="/card/:id" element={<CardEditor />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
