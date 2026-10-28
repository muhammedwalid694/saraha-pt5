import mongoose from "mongoose";

const blackListedTokensSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  expirationDate: { type: Date, required: true },
  userId: { type: String, ref: "user" }
});

// TTL index: MongoDB removes the entry automatically once the token has expired.
blackListedTokensSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });

const BlackListedTokens = mongoose.model("BlackListedTokens", blackListedTokensSchema);
export default BlackListedTokens;
