import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
// import App from './App.jsx'
import './index.css'
import { UserProvider } from './contexts/userContext'
import { ModalProvider } from './contexts/modalContext'

import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Messages from './pages/Messages.jsx'
import Profile from './pages/Profile.jsx'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const Layout = () => {
  return (
    <>
      <main className="min-h-screen bg-theme-0 p-0 m-0">
        <Navbar />
        <div className='pr-4'>
          <Outlet />
        </div>
        <Footer />
      </main>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />} >
              <Route path='/' element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </UserProvider>
  </React.StrictMode>,
)
