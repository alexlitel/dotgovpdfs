import feedparser from 'feedparser-promised'
import bluebird from 'bluebird'
import ItemParser from './parse-item'

const app = async () => {
  try {
    const items = await feedparser('https://www.google.com/alerts/feeds/05724736813364006377/1110170774429747755')
    console.log('Feed received. Application now starting.')

    await bluebird.each(items, async (item, i) => {
      const num = i + 1
      console.log(`Parsing item #${num}`)
      await ItemParser.parse(item)
      await bluebird.delay(3000)
    })

    console.log('End of loop, db is now closing')
  } catch (e) {
    console.log(`Error with running application: ${e.toString()}`)
  }
}

export default app
