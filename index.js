import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

let nextUserId = 1
let nextPostId = 1
let nextCommentId = 1

const users = new Map() // id -> { id, username, passwordHash, followers:Set, following:Set }
const usernameToId = new Map()
const posts = new Map() // id -> { id, userId, imageUrl, caption, likes:Set, comments:[], createdAt }

function generateToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || ''
  const parts = auth.split(' ')
  if (parts.length === 2 && parts[0] === 'Bearer') {
    const token = parts[1]
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      const user = users.get(payload.sub)
      if (!user) return res.status(401).json({ error: 'Invalid token' })
      req.user = user
      return next()
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
  return res.status(401).json({ error: 'Missing token' })
}

function userPublic(user, currentUserId) {
  const followersCount = user.followers.size
  const followingCount = user.following.size
  const isFollowing = currentUserId ? users.get(currentUserId)?.following.has(user.id) : false
  return {
    id: user.id,
    username: user.username,
    followersCount,
    followingCount,
    isFollowing
  }
}

function postPublic(post, currentUserId) {
  const author = users.get(post.userId)
  return {
    id: post.id,
    imageUrl: post.imageUrl,
    caption: post.caption,
    createdAt: post.createdAt,
    author: author ? { id: author.id, username: author.username } : null,
    likesCount: post.likes.size,
    likedByMe: currentUserId ? post.likes.has(currentUserId) : false,
    commentsCount: post.comments.length,
    isFollowingAuthor: currentUserId ? users.get(currentUserId)?.following.has(post.userId) : false
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })
  if (usernameToId.has(username)) return res.status(400).json({ error: 'username already exists' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = { id: nextUserId++, username, passwordHash, followers: new Set(), following: new Set() }
  users.set(user.id, user)
  usernameToId.set(username, user.id)
  const token = generateToken(user)
  res.json({ token, user: userPublic(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })
  const id = usernameToId.get(username)
  if (!id) return res.status(401).json({ error: 'invalid credentials' })
  const user = users.get(id)
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid credentials' })
  const token = generateToken(user)
  res.json({ token, user: userPublic(user) })
})

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: userPublic(req.user, req.user.id) })
})

app.get('/api/users/:id', (req, res) => {
  const user = users.get(Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'user not found' })
  const currentId = (() => {
    const auth = req.headers.authorization || ''
    const parts = auth.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const payload = jwt.verify(parts[1], JWT_SECRET)
        return payload.sub
      } catch {
        return null
      }
    }
    return null
  })()
  res.json({ user: userPublic(user, currentId) })
})

app.post('/api/users/:id/follow', authMiddleware, (req, res) => {
  const target = users.get(Number(req.params.id))
  if (!target) return res.status(404).json({ error: 'user not found' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'cannot follow yourself' })
  req.user.following.add(target.id)
  target.followers.add(req.user.id)
  res.json({ user: userPublic(target, req.user.id) })
})

app.post('/api/users/:id/unfollow', authMiddleware, (req, res) => {
  const target = users.get(Number(req.params.id))
  if (!target) return res.status(404).json({ error: 'user not found' })
  req.user.following.delete(target.id)
  target.followers.delete(req.user.id)
  res.json({ user: userPublic(target, req.user.id) })
})

app.post('/api/posts', authMiddleware, (req, res) => {
  const { imageUrl, caption } = req.body || {}
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' })
  const post = {
    id: nextPostId++,
    userId: req.user.id,
    imageUrl,
    caption: caption || '',
    likes: new Set(),
    comments: [],
    createdAt: Date.now()
  }
  posts.set(post.id, post)
  res.status(201).json({ post: postPublic(post, req.user.id) })
})

app.get('/api/posts/:id', (req, res) => {
  const post = posts.get(Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'post not found' })
  const currentId = (() => {
    const auth = req.headers.authorization || ''
    const parts = auth.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const payload = jwt.verify(parts[1], JWT_SECRET)
        return payload.sub
      } catch {
        return null
      }
    }
    return null
  })()
  const author = users.get(post.userId)
  const comments = post.comments.map(c => ({
    id: c.id,
    text: c.text,
    createdAt: c.createdAt,
    user: users.get(c.userId) ? { id: c.userId, username: users.get(c.userId).username } : null
  }))
  res.json({
    post: {
      ...postPublic(post, currentId),
      comments
    }
  })
})

app.get('/api/users/:id/posts', (req, res) => {
  const uid = Number(req.params.id)
  if (!users.get(uid)) return res.status(404).json({ error: 'user not found' })
  const currentId = (() => {
    const auth = req.headers.authorization || ''
    const parts = auth.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const payload = jwt.verify(parts[1], JWT_SECRET)
        return payload.sub
      } catch {
        return null
      }
    }
    return null
  })()
  const list = Array.from(posts.values())
    .filter(p => p.userId === uid)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => postPublic(p, currentId))
  res.json({ posts: list })
})

app.post('/api/posts/:id/like', authMiddleware, (req, res) => {
  const post = posts.get(Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'post not found' })
  post.likes.add(req.user.id)
  res.json({ post: postPublic(post, req.user.id) })
})

app.post('/api/posts/:id/unlike', authMiddleware, (req, res) => {
  const post = posts.get(Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'post not found' })
  post.likes.delete(req.user.id)
  res.json({ post: postPublic(post, req.user.id) })
})

app.post('/api/posts/:id/comments', authMiddleware, (req, res) => {
  const post = posts.get(Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'post not found' })
  const { text } = req.body || {}
  if (!text) return res.status(400).json({ error: 'text required' })
  const comment = { id: nextCommentId++, userId: req.user.id, text, createdAt: Date.now() }
  post.comments.push(comment)
  res.status(201).json({
    comment: {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      user: { id: req.user.id, username: req.user.username }
    }
  })
})

app.get('/api/feed', authMiddleware, (req, res) => {
  const follows = req.user.following
  const list = Array.from(posts.values())
    .filter(p => follows.has(p.userId) || p.userId === req.user.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => postPublic(p, req.user.id))
  res.json({ posts: list })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
