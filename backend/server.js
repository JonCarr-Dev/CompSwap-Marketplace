require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const path = require('path')
const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')
const session = require('express-session')
const connectDB = require('./db')
const passport = require('./userAuth')
const userAuthRoutes = require('./userAuthRoutes')
const { Server } = require('socket.io')
const OpenAI = require('openai')
const multer = require('multer')
const User = require('./user')
const Conversation = require('./conversation')
const Message = require('./message')
const Listing = require('./listing')

if (process.env.NODE_ENV !== 'test') connectDB()

const app = express()
const server = http.createServer(app)
const io = new Server(server)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const upload = multer({
  dest: path.join(__dirname, '../frontend/uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 }
})

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
})
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  res.locals.currentUser = req.user || null
  res.locals.currentPath = req.path
  next()
})

app.set('views', path.join(__dirname, '../frontend'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '../frontend')))
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')))
app.use('/api/auth', userAuthRoutes)

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/login')
}

app.get('/', async (req, res, next) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 }).populate('seller', 'username').lean()
    res.render('home', { title: 'Marketplace Home', listings })
  } catch (err) {
    next(err)
  }
})

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null })
})

app.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body
    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) {
      return res.render('register', { title: 'Register', error: 'Email or username already in use.' })
    }
    const newUser = new User({ username, email, password })
    await newUser.save()
    req.login(newUser, err => {
      if (err) return next(err)
      res.redirect('/')
    })
  } catch {
    res.render('register', { title: 'Register', error: 'Server error, please try again.' })
  }
})

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: req.query.error || null })
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login?error=Invalid%20credentials'
}))

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'))
})

app.get('/account', ensureAuthenticated, (req, res) => {
  res.redirect(`/account/${req.user.accountType}`)
})

app.get('/account/buyer', ensureAuthenticated, (req, res) => {
  const safeUser = { username: req.user.username, email: req.user.email }
  res.render('buyerAccount', { title: 'Buyer Account', user: safeUser })
})

app.get('/account/seller', ensureAuthenticated, (req, res) => {
  const safeUser = {
    username: req.user.username,
    email: req.user.email,
    storeName: req.user.storeName
  }
  res.render('sellerAccount', { title: 'Seller Account', user: safeUser })
})

app.get('/account/admin', ensureAuthenticated, (req, res) => {
  const safeUser = { username: req.user.username, email: req.user.email }
  res.render('adminAccount', { title: 'Administrator Account', user: safeUser })
})

app.get('/messages', ensureAuthenticated, async (req, res) => {
  const convs = await Conversation.find({ participants: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('participants', 'username')
    .lean()
  const summaries = convs.map(c => {
    const other = c.participants.find(p => p._id.toString() !== req.user._id.toString())
    return { _id: c._id, username: other.username, updatedAt: c.updatedAt }
  })
  res.render('messages', { title: 'Messages', summaries, currentUser: req.user.username })
})

app.get('/support', ensureAuthenticated, (req, res) => {
  res.render('support', { title: 'Customer Support' })
})

app.get('/listing/create', ensureAuthenticated, (req, res) => {
  const categories = ['CPU','CPU Cooler','Motherboard','Memory','Storage','GPU','PSU','Case','Case Fan','Thermal Paste','Other']
  const conditions = ['New','Like New','Good','Fair','Poor']
  res.render('listingCreate', { title: 'Create Listing', categories, conditions, errors: [], formData: {} })
})

app.post('/listing/create', ensureAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, condition } = req.body
    if (!title || !description || !price || !category || !condition) {
      throw new Error('All fields must be filled out')
    }
    if (!req.file) {
      throw new Error('Please upload an image')
    }
    await Listing.create({
      seller: req.user._id,
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      imageUrl: `/uploads/${req.file.filename}`
    })
    res.redirect('/')
  } catch (err) {
    const categories = ['CPU','CPU Cooler','Motherboard','Memory','Storage','GPU','PSU','Case','Case Fan','Thermal Paste','Other']
    const conditions = ['New','Like New','Good','Fair','Poor']
    res.render('listingCreate', { title: 'Create Listing', categories, conditions, errors: [err.message], formData: req.body })
  }
})

app.get('/listing/:id', ensureAuthenticated, async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('seller', 'username').lean()
  if (!listing) return res.redirect('/')
  res.render('listingDetail', { title: listing.title, listing })
})

app.use((req, res) => {
  res.status(404).render('error', { message: 'Not Found' })
})

io.use((socket, next) => sessionMiddleware(socket.request, {}, next))
io.use((socket, next) => {
  passport.initialize()(socket.request, {}, () => {
    passport.session()(socket.request, {}, next)
  })
})

io.on('connection', socket => {
  const user = socket.request.user
  if (!user) return
  socket.join(user._id.toString())

  socket.data.history = [{
    role: 'system',
    content: [
      'You are the CompSwap Customer Support Specialist.',
      'CompSwap is a peer-to-peer online marketplace for buying, selling, and trading second-hand computer components.',
      'Your mission is to help users navigate and troubleshoot every feature:',
      '- Registration and login.',
      '- Creating and managing listings.',
      '- Account settings.',
      '- Admin tools.',
      '- Real-time messaging.',
      'Always provide accurate, step-by-step instructions based on these features.'
    ].join(' ')
  }]

  socket.on('user message', async msg => {
    socket.data.history.push({ role: 'user', content: msg })
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: socket.data.history,
        temperature: 0.2,
        max_tokens: 150
      })
      let answer = resp.choices[0].message.content
      const mod = await openai.moderations.create({ input: answer })
      if (mod.results[0].flagged) answer = "I’m sorry, I can’t help with that."
      socket.data.history.push({ role: 'assistant', content: answer })
      socket.emit('bot message', answer)
    } catch {
      socket.emit('bot message', 'Sorry, support is unavailable right now.')
    }
  })

  socket.on('end chat', () => {
    socket.data.history = [socket.data.history[0]]
    socket.emit('bot message', 'Chat ended. Type a new message to start again.')
  })

  socket.on('select user', async username => {
    const target = await User.findOne({ username })
    if (!target) return socket.emit('select user error', 'User does not exist.')
    let conv = await Conversation.findOne({ participants: { $all: [user._id, target._id] } })
    if (!conv) conv = await Conversation.create({ participants: [user._id, target._id] })
    socket.join(conv._id.toString())
    const msgs = await Message.find({ conversation: conv._id }).sort({ createdAt: 1 }).populate('sender', 'username').lean()
    socket.emit('conversation loaded', { conversationId: conv._id, messages: msgs })
  })

  socket.on('load conversation', async conversationId => {
    const msgs = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 }).populate('sender', 'username').lean()
    socket.emit('conversation loaded', { conversationId, messages: msgs })
  })

  socket.on('join conversation', conversationId => {
    socket.join(conversationId)
  })

  socket.on('send message', async ({ conversationId, content }) => {
    const msg = await Message.create({ conversation: conversationId, sender: user._id, content })
    await Conversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() })
    const populated = await msg.populate('sender', 'username')
    io.to(conversationId.toString()).emit('new message', populated)
  })
})

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}

module.exports = app