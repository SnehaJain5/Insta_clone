import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { request } from '../api.js'

export default function PostCard({ post, onChanged, meId }) {
  const [likeLoading, setLikeLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  async function toggleLike() {
    setLikeLoading(true)
    try {
      const path = post.likedByMe ? '/posts/' + post.id + '/unlike' : '/posts/' + post.id + '/like'
      const res = await request(path, { method: 'POST', auth: true })
      onChanged && onChanged(res.post)
    } catch (e) {
      // ignore
    } finally {
      setLikeLoading(false)
    }
  }

  async function toggleFollow() {
    if (!post.author) return
    setFollowLoading(true)
    try {
      const path = post.isFollowingAuthor ? `/users/${post.author.id}/unfollow` : `/users/${post.author.id}/follow`
      await request(path, { method: 'POST', auth: true })
      onChanged && onChanged({ ...post, isFollowingAuthor: !post.isFollowingAuthor })
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
      const res = await request(`/posts/${post.id}/comments`, { method: 'POST', auth: true, body: { text: commentText } })
      setCommentText('')
      onChanged && onChanged({ ...post, commentsCount: post.commentsCount + 1 })
    } catch (e) {
      // ignore
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <div className="card post">
      <div className="post-header">
        <Link to={`/profile/${post.author?.id}`}>@{post.author?.username}</Link>
        {post.author && meId && post.author.id !== meId && (
          <button className="btn secondary" onClick={toggleFollow} disabled={followLoading} style={{ marginLeft: 8 }}>
            {post.isFollowingAuthor ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
      <img className="post-image" src={post.imageUrl} alt={post.caption} />
      <div className="post-body">
        <p>{post.caption}</p>
        <div className="post-actions">
          <button className="btn" onClick={toggleLike} disabled={likeLoading}>
            {post.likedByMe ? 'Unlike' : 'Like'} ({post.likesCount})
          </button>
          <Link className="btn secondary" to={`/post/${post.id}`}>Comments ({post.commentsCount})</Link>
        </div>
        <form className="comment-form" onSubmit={addComment}>
          <input className="input" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
          <button className="btn" type="submit" disabled={commentLoading}>Post</button>
        </form>
      </div>
    </div>
  )
}
