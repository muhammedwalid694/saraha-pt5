import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true, minLength: 1, maxLength: 1000 },
  // The User _id is a String (the user's email), so this must be a String too.
  receiverId: { type: String, ref: "user", required: true, index: true }
}, {
  timestamps: true
});

const Messages = mongoose.model("Messages", messageSchema);
export default Messages;
