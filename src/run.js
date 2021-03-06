import db from './db'
import app from './app'

const main = async () => {
  try {
    await app()
  } catch (e) {
    console.log(`Err with running app: ${e.toString()}`)
  }
  db.close()
  process.exit()
}

main()
