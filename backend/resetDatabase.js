require('dotenv').config();
const mongoose = require('mongoose');

const User         = require('./user');
const Listing      = require('./listing');
const Message      = require('./message');
const Conversation = require('./conversation');
const Counter      = require('./userCount');

const dbURI = process.env.DB_URI
  || (process.env.NODE_ENV === 'test'
      ? 'mongodb://localhost:27017/test_db'
      : 'mongodb://localhost:27017/compswap-marketplace');

async function reset() {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true
    });
    console.log(`Connected to ${dbURI}`);

    const models = [ User, Listing, Message, Conversation, Counter ];
    for (const Model of models) {
      const name = Model.collection.collectionName;
      console.log(`Clearing "${name}" collection...`);
      await Model.deleteMany({});
    }

    console.log('All collections cleared. Database reset is complete.');
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

reset();