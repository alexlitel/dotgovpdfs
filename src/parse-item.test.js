import nock from 'nock'
import Tweet from './model'
import ItemParser from './parse-item'

jest.mock('./model')

const setUpMocks = () => {
  nock(/twitter\.com/)
  	.persist()
    .post(/.*/)
    .reply(200, () => ({ id_str: '1' }))

  nock('https://www.testurl.com')
    	.persist()
    	.head('/test')
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
}

const clearMocks = () => {
  nock.cleanAll()
}

beforeAll(() => {
  setUpMocks()
})

// beforeAll(done => initializeDb(done), 12000)

afterAll(() => clearMocks(), 12000)
afterEach(() => Tweet.reset(), 12000)

describe('ItemParser class methods', () => {
  describe('extractUrl', () => {
    test('Extracts URL from RSS feed link', () => {
      const url = 'https://www.google.com/url?rct=j&sa=t&url=https://www.nrc.gov/docs/ML1414/ML14142A032.pdf&ct=ga'
      expect(ItemParser.extractUrl(url)).toEqual('https://www.nrc.gov/docs/ML1414/ML14142A032.pdf')
    })
  })

  describe('truncateTitle', () => {
    test('Truncates title longer than 232 characters', () => {
      expect(ItemParser.truncateTitle('a'.repeat(234)).endsWith('…')).toBeTruthy()
    })

    test('Does not truncate short title', () => {
      expect(ItemParser.truncateTitle('a'.repeat(3)).endsWith('…')).toBeFalsy()
    })
  })

  describe('checkModifiedDate', () => {
    test('Returns true for valid date', () => {
      expect(ItemParser.checkModifiedDate(new Date())).toBeTruthy()
    })

    test('Returns false for invalid date', () => {
      expect(ItemParser.checkModifiedDate('Wed, 08 Nov 2007 21:29:03 GMT')).toBeFalsy()
    })

    test('Returns true for no date', () => {
      expect(ItemParser.checkModifiedDate(null)).toBeTruthy()
      expect(ItemParser.checkModifiedDate('')).toBeTruthy()
    })
  })

  describe('dbInsert', () => {
  	test('Inserts item into db', async () => {
  		await ItemParser.dbInsert({ url: 'http://www.google.com' })
  		await expect(Tweet.count({ url: 'http://www.google.com' }).exec()).resolves.toBe(1)
  	})
  })

  describe('checkDb', () => {
    test('Returns true if url already in database', async () => {
  		await expect(ItemParser.checkDb('http://www.google.com')).resolves.toBeTruthy()
  	})

  	test('Returns false if url already in database', async () => {
  		await ItemParser.dbInsert({ url: 'http://www.google.com' })
  		await expect(ItemParser.checkDb('http://www.google.com')).resolves.toBeFalsy()
  	})
  })

  describe('postTweet', () => {
  	test('Posts tweet', async () => {
  		await expect(ItemParser.postTweet({ title: 'foo', hostname: 'foo', url: 'foo' })).resolves.toEqual('1')
  	})
  })

  describe('headRequest', () => {
  	test('Makes head request and returns pertinent data', async () => {
  		const url = 'https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/test&ct'
  		await expect(ItemParser.headRequest(url)).resolves.toEqual({
  			hostname: 'testurl.com', url: 'https://www.testurl.com/test', status: 200, validDate: true,
  		})
  	})

  	test('Returns correct status code if resource missing', async () => {
  		const url = 'https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/missing&ct'
  		await expect(ItemParser.headRequest(url)).resolves.toHaveProperty('status', 404)
  	})

  	test('Returns false for validDate when locating old resource', async () => {
  		const url = 'https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/old&ct'
  		await expect(ItemParser.headRequest(url)).resolves.toHaveProperty('validDate', false)
  	})

  	test('Returns final url when there is a redirected resource', async () => {
  		const url = 'https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/redirect&ct'
  		await expect(ItemParser.headRequest(url)).resolves.toHaveProperty('url', 'https://www.testurl.com/actualpage')
  	})
  })

  describe('parse process', () => {
  	const spyFns = {}
  	beforeEach(() => {
  		// eslint-disable-next-line
    	for (const key of Object.keys(spyFns)) {
        	spyFns[key].mockRestore()
      	}

      	spyFns.dbInsert = jest.spyOn(ItemParser, 'dbInsert')
      	spyFns.postTweet = jest.spyOn(ItemParser, 'postTweet')
      	spyFns.headRequest = jest.spyOn(ItemParser, 'headRequest')
      	spyFns.checkDb = jest.spyOn(ItemParser, 'checkDb')
  	})
  	describe('Regular parse process', () => {
  		test('Returns link object and runs all parts of process', async () => {
  			const item = { title: 'foo', link: 'https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/test&ct' }
  			await expect(ItemParser.parse(item)).resolves.toEqual({
  				hostname: 'testurl.com',
  				tweet_id: '1',
  				title: 'foo',
  				url: 'https://www.testurl.com/test',
  			})
  			expect(spyFns.headRequest).toBeCalled()
  			expect(spyFns.checkDb).toBeCalled()
  			expect(spyFns.postTweet).toBeCalled()
  			expect(spyFns.dbInsert).toBeCalled()
  		})
  	})

  	describe('Link out of date range', () => {
  		test('Returns false after head request', async () => {
  			const item = { title: 'foo', link: 'https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/old&ct' }
  			await expect(ItemParser.parse(item)).resolves.toBeFalsy()
  			expect(spyFns.headRequest).toBeCalled()
  			expect(spyFns.checkDb).not.toBeCalled()
  			expect(spyFns.postTweet).not.toBeCalled()
  			expect(spyFns.dbInsert).not.toBeCalled()
  		})
  	})

  	describe('Link already in db', () => {
  		beforeEach(async () => {
  			Tweet.create({ url: 'https://www.testurl.com/test' })
  		})

  		test('Returns false after db check', async () => {
  			const item = { title: 'foo', link: 'https://www.google.com/url?rct=j&sa=t&url=https://www.testurl.com/test&ct' }
  			await expect(ItemParser.parse(item)).resolves.toBeFalsy()
  			expect(spyFns.headRequest).toBeCalled()
  			expect(spyFns.checkDb).toBeCalled()
  			expect(spyFns.postTweet).not.toBeCalled()
  			expect(spyFns.dbInsert).not.toBeCalled()
  		})
  	})
  })
})
