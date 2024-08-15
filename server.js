require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Gemini API client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Setup in-memory cache
const cache = new NodeCache({ stdTTL: 3600 }); // Cache responses for 1 hour

// Connect to MongoDB Atlas
const setup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error during setup:', error);
  }
};
setup();

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to User
});

messageSchema.index({ timestamp: -1 }); // Adding index for optimization
const Message = mongoose.model('Message', messageSchema);

// Middleware to parse JSON
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied.');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token.');
    req.user = user;
    next();
  });
};

// Signup Route
app.post('/api/signup', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).send('All fields are required.');
  }

  try {
    const user = new User({ username, password, email });
    await user.save();
    res.status(201).send('User created');
  } catch (error) {
    res.status(500).send('Error creating user, please try a different username and try again');
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

// Message Route
app.post('/api/message', authenticateJWT, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.userId;

  if (!message) {
    return res.status(400).send('Message is required.');
  }

  try {
    // Save user message to MongoDB
    await new Message({ sender: 'user', message, user: userId }).save();

    // Check cache first
    const cacheKey = `response_${message}`;
    let botMessage = cache.get(cacheKey);

    if (!botMessage) {
      // Generate bot response
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent([message]);
      botMessage = response.response.text();
      
      // Save bot message to MongoDB
      await new Message({ sender: 'bot', message: botMessage, user: userId }).save();
      
      // Cache bot message
      cache.set(cacheKey, botMessage);
    }

    res.json({ reply: botMessage });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).send('Error processing message');
  }
});

// History Route
app.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 100 } = req.query;
    const messages = await Message.find({ user: userId }).sort({ timestamp: -1 }).limit(parseInt(limit)).exec();
    res.json(messages);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).send('Error fetching history');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/`);
});
