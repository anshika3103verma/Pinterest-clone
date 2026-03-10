const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI)



const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  fullname: {
    type: String,
    required: true,
  },
  dp: {
    type: String,
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }],
});

module.exports = mongoose.model("User", userSchema);