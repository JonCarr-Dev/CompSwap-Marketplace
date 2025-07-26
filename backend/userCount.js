const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  sequence_name:  { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter
  || mongoose.model('Counter', CounterSchema);

module.exports = Counter;