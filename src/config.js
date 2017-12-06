import dotEnv from 'dotenv'

dotEnv.config({ silent: true })

export const DB_URL = process.env.MONGOLAB_URL || 'mongodb://localhost:27017/tweets'

export const TWITTER_CONFIG = {
  consumer_key: process.env.CONSUMER_API_KEY || 'test',
  consumer_secret: process.env.CONSUMER_API_SECRET || 'test',
  token: process.env.ACCESS_TOKEN || 'test',
  token_secret: process.env.ACCESS_TOKEN_SECRET || 'test',
}
