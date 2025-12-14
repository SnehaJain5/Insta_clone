import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { request, setToken } from '../api.js'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await request('/auth/signup', { method: 'POST', body: { username, password } })
      setToken(res.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-stack">
          <img src="https://picsum.photos/id/1062/300/420" alt="" />
          <img src="https://picsum.photos/id/1027/300/420" alt="" />
          <img src="https://picsum.photos/id/1011/300/420" alt="" />
        </div>
      </div>
      <div className="auth-right">
        <div className="brand">Instagram</div>
        <div className="auth-card">
          <form onSubmit={onSubmit} className="auth-form">
            <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            {error && <div className="error">{error}</div>}
            <button className="btn full" type="submit">Sign up</button>
          </form>
        </div>
        <div className="auth-card small">
          <span>Have an account? </span>
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  )
}
