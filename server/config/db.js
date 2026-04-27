const mongoose = require('mongoose');

// When MONGO_URI is missing or set to "memory" / "memory://", spin up an
// embedded MongoDB via mongodb-memory-server. Data resets on every restart —
// only suitable for demos / preview deployments where free hosting forbids a
// real database. For production, set MONGO_URI to a real Atlas connection.
function shouldUseMemoryServer() {
  const uri = (process.env.MONGO_URI || '').trim().toLowerCase();
  return !uri || uri === 'memory' || uri === 'memory://' || process.env.USE_IN_MEMORY_DB === 'true';
}

async function startInMemoryMongo() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  console.log('⚙️  Starting embedded MongoDB (data will not persist across restarts)…');
  const server = await MongoMemoryServer.create();
  const uri = server.getUri();
  console.log(`Embedded MongoDB ready at ${uri}`);
  return uri;
}

const connectDB = async () => {
  const uri = shouldUseMemoryServer()
    ? await startInMemoryMongo()
    : process.env.MONGO_URI;

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 4000
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
