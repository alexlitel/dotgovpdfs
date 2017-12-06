// eslint-disable-next-line
import feedparser from 'feedparser-promised'
import nock from 'nock'
import bluebird from 'bluebird'
import app from './app'
import ItemParser from './parse-item'
import Tweet from './model'


jest.mock('./model')
jest.mock('feedparser-promised', () => jest.fn(() => ['one', 'old', 'two', 'three', 'one', 'redirect'].map((link, i) => ({
  link: `https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/${link}&ct=ga`,
  title: `Document ${i}`,
}))))


const setUpMocks = () => {
  nock(/twitter\.com/)
  	.persist()
    .post(/.*/)
    .reply(200, () => ({ id_str: '1' }))

  	nock('https://www.testurl.com')
    	.persist()
    	.head(/test|one|two|three/)
    	.reply(200, true, {
    			'last-modified': new Date(),
    	})
    	.head('/missing')
    	.reply(404)
    	.head('/redirect')
    	.reply(302, undefined, {
    		Location: 'https://www.testurl.com/actualpage',
    	})
    	.head('/old')
    	.reply(202, undefined, {
    		'last-modified': 'Mon, 05 Oct 2015 14:09:32 GMT',
    	})
    	.head('/actualpage')
    	.reply(200)

  bluebird.delay = jest.fn(() => true)
}

const clearMocks = () => {
  nock.cleanAll()
  jest.resetModules()
}

describe('App', () => {
  const spyFns = {}
  beforeAll(() => setUpMocks())

  beforeEach(() => {
    // eslint-disable-next-line
    	for (const key of Object.keys(spyFns)) {
        	spyFns[key].mockRestore()
      	}

      	spyFns.dbInsert = jest.spyOn(ItemParser, 'dbInsert')
      	spyFns.postTweet = jest.spyOn(ItemParser, 'postTweet')
      	spyFns.headRequest = jest.spyOn(ItemParser, 'headRequest')
      	spyFns.checkDb = jest.spyOn(ItemParser, 'checkDb')
      	spyFns.parse = jest.spyOn(ItemParser, 'parse')
  })

  afterAll(() => clearMocks())

  afterEach(() => Tweet.reset(), 12000)


  test('Runs properly', async () => {
  	await app()
  	expect(spyFns.parse).toHaveBeenCalledTimes(6)
  	expect(bluebird.delay).toHaveBeenCalledTimes(6)
  	expect(spyFns.checkDb).toHaveBeenCalledTimes(5)
  	expect(spyFns.headRequest).toHaveBeenCalledTimes(6)
  	expect(spyFns.dbInsert).toHaveBeenCalledTimes(4)
  	expect(spyFns.postTweet).toHaveBeenCalledTimes(4)
    await expect(Tweet.count({ url: 'https://www.testurl.com/actualpage' }).exec()).resolves.toBe(1)
  	await expect(Tweet.count({ url: 'https://www.testurl.com/actualpage' }).exec()).resolves.toBe(1)
  })
})
