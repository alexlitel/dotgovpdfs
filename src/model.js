import mongoose from 'mongoose'

const tweetSchema = new mongoose.Schema({
  title: String,
  url: String,
  hostname: String,
  tweet_id: String,
  time: { type: Date, default: new Date() },

})

const Tweet = mongoose.model('Tweet', tweetSchema)

export default Tweet
