const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    require: true,
    unique: true,
  },
  role: {
    type: String, // "user" | "broker"
    require: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
