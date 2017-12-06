import rp from 'request-promise'
import decode from 'ent/decode'
import qs from 'qs'
import { TWITTER_CONFIG } from './config'
import Tweet from './model'

class ItemParser {
  static extractUrl(url) {
    return qs.parse(url).url
  }

  static checkModifiedDate(date) {
    if (!date) {
      console.log('Document doesn\'t have modified header')
      return true
    }
    const currDate = new Date()
    const isValidDate = new Date(date) > currDate.setMonth(currDate.getMonth() - 6)
    console.log(`Document ${isValidDate ? 'within' : 'out of'} date range`)
    return isValidDate
  }

  static truncateTitle(title) {
    return title.length > 232 ? `${title.substr(0, 232)}…` : title
  }

  static async checkDb(url) {
    const notInDb = (await Tweet.count({ url }).exec()) === 0
    console.log(`${notInDb ? 'Doesn\'t exist' : 'Already'} in database`)
    return notInDb
  }

  static async headRequest(url) {
    try {
      const res = await rp({
        method: 'HEAD',
        simple: false,
        followAllRedirects: true,
        followRedirect: true,
        uri: this.extractUrl(url),
        resolveWithFullResponse: true,
      })

      console.log(res.request.uri.href)

      if (res.statusCode !== 200) console.log('Document unavailable')
      return {
        status: res.statusCode,
        url: res.request.uri.href,
        hostname: res.request.uri.hostname.replace(/^w{3}\./i, ''),
        validDate: this.checkModifiedDate(res.headers['last-modified']),
      }
    } catch (e) {
      console.log('Error making head request', e)
      return false
    }
  }

  static async postTweet(item) {
    return (await rp({
      method: 'POST',
      uri: 'https://api.twitter.com/1.1/statuses/update.json',
      oauth: TWITTER_CONFIG,
      qs: {
        status: `${this.truncateTitle(item.title)} ${item.hostname} ${item.url}`,
      },
      json: true,
    })).id_str
  }

  static async dbInsert(item) {
    delete item.validDate
    delete item.status
    return Tweet.create(item)
  }

  static async parse(item) {
    try {
      const headReq = await this.headRequest(item.link)
      const newItem = Object.assign({}, headReq)
      if (!newItem.validDate) return false
      if (!(await this.checkDb(newItem.url))) return false
      newItem.title = decode(item.title)
      newItem.tweet_id = await this.postTweet(newItem)
      await this.dbInsert(newItem)
      console.log('Successfully tweeted and inserted into DB')
      return newItem
    } catch (e) {
      console.log(`Item parsing err: ${e}`)
      return false
    }
  }
}

export default ItemParser
