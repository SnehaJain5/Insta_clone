import React, { useEffect, useState } from 'react'
import { request } from '../api.js'
import PostCard from '../components/PostCard.jsx'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const me = await request('/me', { auth: true })
        if (mounted) setMeId(me.user.id)
        const res = await request('/feed', { auth: true })
        if (mounted) setPosts(res.posts)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function updatePost(updated) {
    setPosts(p => p.map(post => post.id === updated.id ? { ...post, ...updated } : post))
  }

  return (
    <div>
      <h2>Home Feed</h2>
      {error && <div className="error">{error}</div>}
      {loading ? <div>Loading...</div> : posts.length === 0 ? <div>No posts yet. Follow users or create one.</div> : (
        posts.map(p => <PostCard key={p.id} post={p} meId={meId} onChanged={updatePost} />)
      )}
    </div>
  )
}
