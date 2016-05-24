 'use strict';
 const mongoose = require('mongoose');
 const Twit = require('twit');
 const Tweet = require('./schema');
 const async = require('async');
 const EventEmitter = require('events');

 const tweetFunc = (array) => {
     const db = mongoose.connect(process.env.MONGOLAB_URL || 'mongodb://localhost:27017/tweets');
     const t = new Twit({
         consumer_key: process.env.consumer_api_key,
         consumer_secret: process.env.consumer_api_secret,
         access_token: process.env.access_token,
         access_token_secret: process.env.access_token_secret
     });
     let evt = new EventEmitter();

     evt.on('end', function() {
         console.log('End of loop, db is now closing');
         db.connection.close();
     });

     function tweetItem(item) {
         t.post('statuses/update', { status: item.tweet.text }, function(err, data, response) {
             if (!err) {
                 item.tweet.link = `https://www.twitter.com/govpdfs/status/${data.id_str}`;
                 console.log('Successfully posted tweet');
                 createItem(item);
             } else {
                 console.log('Unable to post tweet');
                 return false;
             }
         });
     }

     function createItem(item) {
         Tweet.create(item, function(err, tweets) {
             if (err) {
                 console.log('Error with model creation: Tweet not added to database');
                 return false;
             }
             console.log('Tweet added to database');
         });
     }

     function checkDb(item) {
         Tweet.count({ 'url.actual': item.url.actual }, function(err, tweet) {
             if (tweet === 0) {
                 console.log(`Doesn't exist in database`);
                 tweetItem(item);
             }
             if (tweet !== 0) {
                 console.log(`Already exists in database`);
             }
         });
     }

     function loop(item, cb) {
         setTimeout(function() {
             let num = array.indexOf(item);
             console.log(`item: ${num}`);
             checkDb(item);
             cb();
         }, 15000);
     }

     function close(err) {
         setTimeout(function() {
             evt.emit('end');
         }, 350000)
     }
     async.eachSeries(array, loop, close);

 };

 module.exports = tweetFunc;
