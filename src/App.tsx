import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import CardEditor from './pages/CardEditor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/card/new" element={<CardEditor />} />
            <Route path="/card/:id" element={<CardEditor />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
