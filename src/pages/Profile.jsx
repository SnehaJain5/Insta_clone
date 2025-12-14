import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { request } from '../api.js'
import PostCard from '../components/PostCard.jsx'

export default function Profile() {
  const params = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const meRes = await request('/me', { auth: true })
      const idParam = params.id ? Number(params.id) : meRes.user.id
      setMeId(meRes.user.id)
      const uRes = await request(`/users/${idParam}`, { auth: true })
      setUser(uRes.user)
      const pRes = await request(`/users/${idParam}/posts`, { auth: true })
      setPosts(pRes.posts)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function toggleFollow() {
    if (!user) return
    try {
      const path = user.isFollowing ? `/users/${user.id}/unfollow` : `/users/${user.id}/follow`
      const res = await request(path, { method: 'POST', auth: true })
      setUser(res.user)
    } catch (e) {
      // ignore
    }
  }

  function updatePost(updated) {
    setPosts(p => p.map(post => post.id === updated.id ? { ...post, ...updated } : post))
  }

  return (
    <div>
      <h2>Profile</h2>
      {error && <div className="error">{error}</div>}
      {loading ? <div>Loading...</div> : user && (
        <>
          <div className="card">
            <h3>@{user.username}</h3>
            <div className="row">
              <span>Followers: {user.followersCount}</span>
              <span>Following: {user.followingCount}</span>
            </div>
            {user.id !== meId && (
              <button className="btn" onClick={toggleFollow}>
                {user.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
          {posts.length === 0 ? <div>No posts yet.</div> : posts.map(p => (
            <PostCard key={p.id} post={p} onChanged={updatePost} />
          ))}
        </>
      )}
    </div>
  )
}
