const mongoose = require('mongoose');

// Embedded MongoDB fallback for free / preview deployments. We try the
// configured MONGO_URI first; if it fails (DNS lookup, connection refused,
// auth failure, etc.) and the deployment opts in, we boot a local in-memory
// instance so the app keeps running. Data does NOT persist across restarts.
const MEMORY_URI_VALUES = new Set(['memory', 'memory://']);
const FALLBACK_OPT_OUT = process.env.DISABLE_MEMORY_DB_FALLBACK === 'true';

function explicitMemoryRequest() {
  if (process.env.USE_IN_MEMORY_DB === 'true') return true;
  const uri = (process.env.MONGO_URI || '').trim().toLowerCase();
  if (!uri) return true;
  if (MEMORY_URI_VALUES.has(uri)) return true;
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

async function connectWithUri(uri, label) {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
  console.log(`MongoDB Connected: ${conn.connection.host}${label ? ` (${label})` : ''}`);
  return conn;
}

const connectDB = async () => {
  if (explicitMemoryRequest()) {
    const uri = await startInMemoryMongo();
    return connectWithUri(uri, 'embedded');
  }

  try {
    return await connectWithUri(process.env.MONGO_URI);
  } catch (error) {
    if (FALLBACK_OPT_OUT) {
      throw error;
    }
    console.warn(`⚠️  External MongoDB unreachable (${error.message.split('\n')[0]}). Falling back to embedded MongoDB.`);
    const uri = await startInMemoryMongo();
    return connectWithUri(uri, 'embedded fallback');
  }
};

module.exports = connectDB;
