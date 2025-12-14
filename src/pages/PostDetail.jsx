import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { request } from '../api.js'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [likeLoading, setLikeLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [meId, setMeId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const me = await request('/me', { auth: true })
      setMeId(me.user.id)
      const res = await request(`/posts/${id}`, { auth: true })
      setPost(res.post)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function toggleLike() {
    if (!post) return
    setLikeLoading(true)
    try {
      const path = post.likedByMe ? `/posts/${post.id}/unlike` : `/posts/${post.id}/like`
      const res = await request(path, { method: 'POST', auth: true })
      setPost(p => ({ ...p, ...res.post }))
    } catch (e) {
      // ignore
    } finally {
      setLikeLoading(false)
    }
  }

  async function toggleFollow() {
    if (!post?.author) return
    setFollowLoading(true)
    try {
      const path = post.isFollowingAuthor ? `/users/${post.author.id}/unfollow` : `/users/${post.author.id}/follow`
      await request(path, { method: 'POST', auth: true })
      setPost(p => ({ ...p, isFollowingAuthor: !p.isFollowingAuthor }))
    } catch (e) {
    } finally {
      setFollowLoading(false)
    }
  }

  async function addComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      const res = await request(`/posts/${id}/comments`, { method: 'POST', auth: true, body: { text: commentText } })
      setCommentText('')
      setPost(p => ({ ...p, commentsCount: p.commentsCount + 1, comments: [...(p.comments || []), res.comment] }))
    } catch (e) {
      // ignore
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <div>
      <h2>Post</h2>
      {error && <div className="error">{error}</div>}
      {loading ? <div>Loading...</div> : post && (
        <div className="card">
          <img className="post-image" src={post.imageUrl} alt={post.caption} />
          <p>{post.caption}</p>
          <div className="row">
            <button className="btn" onClick={toggleLike} disabled={likeLoading}>
              {post.likedByMe ? 'Unlike' : 'Like'} ({post.likesCount})
            </button>
            {post.author && meId && post.author.id !== meId && (
              <button className="btn secondary" onClick={toggleFollow} disabled={followLoading}>
                {post.isFollowingAuthor ? 'Unfollow' : 'Follow'} @{post.author.username}
              </button>
            )}
          </div>
          <div>
            <h3>Comments</h3>
            {(post.comments || []).length === 0 ? <div>No comments yet.</div> : (
              (post.comments || []).map(c => (
                <div key={c.id} className="comment">
                  <strong>@{c.user?.username}</strong> {c.text}
                </div>
              ))
            )}
            <form onSubmit={addComment} className="comment-form">
              <input className="input" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
              <button className="btn" type="submit" disabled={commentLoading}>Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
