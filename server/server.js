const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3001; // Ensure this port is different from your React app's port
const url = process.env.DATABASE_URL;
console.log(`process.env.DATABASE_URL: ${url}`);
const dbName = 'blockchain'; // Your database name

app.use(cors());

// Endpoint to fetch alerts from MongoDB
app.get('/alerts', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection('alert');
    const data = await collection.find({}).sort({created: -1}).toArray();
    res.json(data);
  } finally {
    await client.close();
  }
});

// Endpoint to fetch alerts from MongoDB
app.get('/blocks', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection('blockAnalysis');
    const data = await collection.find({}).sort({created: -1}).toArray();
    res.json(data);
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
