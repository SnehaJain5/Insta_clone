import React, { useEffect } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from './api.js'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Home from './pages/Home.jsx'
import CreatePost from './pages/CreatePost.jsx'
import Profile from './pages/Profile.jsx'
import PostDetail from './pages/PostDetail.jsx'

function Nav() {
  const navigate = useNavigate()
  const loggedIn = !!getToken()
  return (
    <nav className="nav">
      <Link to="/">Feed</Link>
      <Link to="/create">Create</Link>
      <Link to="/profile">Profile</Link>
      {loggedIn ? (
        <button className="btn" onClick={() => { clearToken(); navigate('/login') }}>Logout</button>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </>
      )}
    </nav>
  )
}

export default function App() {
  useEffect(() => {
    // redirect to login if not authenticated and not on auth pages
    const token = getToken()
    const authPaths = ['/login', '/signup']
    if (!token && !authPaths.includes(window.location.pathname)) {
      window.history.replaceState({}, '', '/login')
    }
  }, [])
  return (
    <div className="container">
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/post/:id" element={<PostDetail />} />
      </Routes>
    </div>
  )
}
