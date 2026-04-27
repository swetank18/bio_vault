const mongoose = require('mongoose');

// Embedded MongoDB fallback for free / preview deployments. Triggers when:
//   - MONGO_URI is missing
//   - MONGO_URI is the literal "memory" / "memory://"
//   - MONGO_URI is malformed (doesn't start with mongodb:// or mongodb+srv://)
//   - USE_IN_MEMORY_DB=true
// Data does NOT persist across restarts. For production, set MONGO_URI to a
// real Atlas connection string.
function isValidMongoUri(uri) {
  if (!uri) return false;
  return /^mongodb(\+srv)?:\/\//i.test(uri.trim());
}

function shouldUseMemoryServer() {
  if (process.env.USE_IN_MEMORY_DB === 'true') return true;
  const uri = (process.env.MONGO_URI || '').trim().toLowerCase();
  if (!uri) return true;
  if (uri === 'memory' || uri === 'memory://') return true;
  if (!isValidMongoUri(process.env.MONGO_URI)) return true;
  return false;
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
  if (shouldUseMemoryServer()) {
    if (process.env.MONGO_URI && !isValidMongoUri(process.env.MONGO_URI)) {
      console.warn('⚠️  MONGO_URI is set but malformed — falling back to embedded MongoDB.');
    }
    const uri = await startInMemoryMongo();
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`MongoDB Connected: ${conn.connection.host} (embedded)`);
    return conn;
  }

  const conn = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 4000
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
