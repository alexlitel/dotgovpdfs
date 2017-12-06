import mongoose from 'mongoose'
import bluebird from 'bluebird'
import { DB_URL } from './config'

mongoose.connect(DB_URL, { useMongoClient: true })
const db = mongoose.connection
mongoose.Promise = bluebird

db.on('connected', () => {
  console.log(`Mongoose successfullly connected to ${DB_URL}`)
})

db.on('error', (err) => {
  console.log(`Unable to connect to DB. Mongoose error: ${err}`)
})

db.on('disconnected', () => {
  console.log('Mongoose default connection disconnected')
})

process.on('SIGINT', () => {
  db.close(() => {
    console.log('Mongoose connection closed')
    process.exit(0)
  })
})

export default db
