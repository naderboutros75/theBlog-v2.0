import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from "mongoose-findorcreate";

const postSchema = new mongoose.Schema({
  postTitle: { type: String, required: true, unique: true, trim: true },
  postContent: { type: String, required: true, trim: true },
  author: { type: String, trim: true },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
});

export const Post = mongoose.model("Post", postSchema);

// creating replies database
const replySchema = new mongoose.Schema({
  replyContent: { type: String, required: true, trim: true },
});

export const Reply = mongoose.model("Reply", replySchema);

//creating users database
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

export const User = new mongoose.model("User", userSchema);
