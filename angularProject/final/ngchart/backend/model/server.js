const { ObjectId } = require('bson');
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = socketIO(server); // Attach Socket.IO to the server

// Connect to the mongodb (admin) database
mongoose.connect('mongodb://localhost:27017/admin');

// Connection success event
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
  });
  
  // Connection error event
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });  

// Define the schema for the User collection in MongoDB
const UserSchema = new mongoose.Schema({
  _id: ObjectId,
  id: String,
  date: Date,
  user: String,
  text: String,
  retweets: mongoose.Schema.Types.Mixed,
  published_at: Date,
});

// Create a model (collection) named 'users' based on the defined schema
const UserModel = mongoose.model('tweets', UserSchema);

// Middleware for handling CORS and HTTP methods
app.use((req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const emitDataToClients = () => {
    UserModel.find({}).cursor().eachAsync(async function (user, i) {
      if (i % 100 === 0 && i !== 0) {
        console.log(`Processed : ${i} `);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Fetch top 20 users' data every 100 records and emit the event
        const topUsers = await UserModel.aggregate([
          { $group: { _id: '$user', tweetCount: { $sum: 1 } } },
          { $sort: { tweetCount: -1 } },
          { $limit: 20 }
        ]).exec();
        io.emit('TopTwentyUsers', topUsers);
      }
      io.emit('userDataBatch', user);
      if (i === 99 || i === (await UserModel.countDocuments()) - 1) {
        io.emit('userDataBatchEnd');
      }
    });
  };

// Endpoint to fetch all users tweets
app.get('/getAllUsersTweet', (req, res) => {
  UserModel.find({})
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    });
});

// Endpoint to get the top 20 users based on the number of published tweets
app.get("/TopTwentyUsers", async (req, res) => {
  try {
    const topUsers = await UserModel.aggregate([
      { $group: { _id: '$user', tweetCount: { $sum: 1 } } },
      { $sort: { tweetCount: -1 } },
      { $limit: 20 }
    ]).exec();
    
    // Emit top 20 users' data to connected clients via Socket.IO
    io.emit('TopTwentyUsers', topUsers);
    
    res.json(topUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/getTweetsByDayForUser", async (req, res) => {
   try{
     const { username } = req.query;

    const tweetCounts = await UserModel.aggregate([
        {
            $match: {
                user: username
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]).exec();
        // Emit the tweetCounts data to connected clients via Socket.IO
        io.emit('TweetsByDayForUser', tweetCounts);
        
        res.json(tweetCounts);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred" });
    }
});
// Socket.IO connection event
io.on('connection', (socket) => {
  console.log('A client connected');

  // Emit initial data to the newly connected client
  emitDataToClients();

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

// Start the combined HTTP and Socket.IO server on port 3002
server.listen(3002, () => {
  console.log('Server is running on port 3002');
});


