class Tweet {
  static count(obj) {
    const exec = () => {
      if (Object.keys(obj).length) {
        return Promise.resolve(Tweet.instances
          .filter(tweet => tweet.url === obj.url).length)
      }
      return Promise.resolve(Tweet.instances.length)
    }
    return { exec }
  }

  static create(obj) {
    const newTweet = new Tweet(obj)
    Tweet.instances.push(newTweet)
    return Promise.resolve(Tweet)
  }

  static reset() {
    Tweet.instances = []
  }

  constructor(obj) {
    Object.assign(this, obj)
  }
}

Tweet.instances = []

export default Tweet
