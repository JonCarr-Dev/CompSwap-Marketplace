const mongoose = require('mongoose')

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    ],
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

module.exports = mongoose.model('Conversation', ConversationSchema)