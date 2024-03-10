// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  wished: {
    type: Boolean,
    default: false, // Initially, the user has not been wished
  },
});

module.exports = mongoose.model("User", userSchema);
