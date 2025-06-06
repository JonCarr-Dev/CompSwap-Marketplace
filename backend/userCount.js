const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  sequence_name: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', CounterSchema);