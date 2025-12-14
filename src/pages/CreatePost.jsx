import React, { useState } from 'react'
import { request } from '../api.js'

export default function CreatePost() {
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      await request('/posts', { method: 'POST', auth: true, body: { imageUrl, caption } })
      setMsg('Post created')
      setImageUrl('')
      setCaption('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="card">
      <h2>Create Post</h2>
      <form onSubmit={onSubmit}>
        <input className="input" placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        <input className="input" placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} />
        {error && <div className="error">{error}</div>}
        {msg && <div className="success">{msg}</div>}
        <button className="btn" type="submit">Create</button>
      </form>
    </div>
  )
}
