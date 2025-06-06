const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Counter = require('./userCount');

const UserSchema = new mongoose.Schema({
  userID: { type: Number, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountType: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { sequence_name: 'userID' },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    this.userID = counter.sequence_value;
  }
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});


UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);