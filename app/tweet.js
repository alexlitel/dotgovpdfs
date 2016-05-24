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
         access_token_secret: process.env.access_token_secret,
         timeout_ms: 15 * 1000
     });
     let evt = new EventEmitter();

     evt.on('end', function() {
         console.log('end of loop, db closing');
         db.connection.close();
     });

     function tweetItem(item) {
         t.post('statuses/update', { status: item.tweet.text }, function(err, data, response) {
             if (!err) {
                 item.tweet.link = `https://www.twitter.com/govpdfs/status/${data.id_str}`;
                 console.log('tweet successful');
                 createItem(item);
             } else {
                 console.log('tweet unsuccessful');
                 return false;
             }
         });
     }

     function createItem(item) {
         Tweet.create(item, function(err, tweets) {
             if (err) {
                 console.log('tweet not added to database');
                 return false;
             }
             console.log('tweet added to database');
         });
     }

     function checkDb(item) {
         Tweet.count({ title: item.url.actual }, function(err, tweet) {
             if (tweet === 0) {
                 console.log('I don\'t exist');
                 tweetItem(item);
             }
             if (tweet !== 0) {
                 console.log(' i already exist');
             }
         });
     }

     function loop(item, cb) {
         checkDb(item);
         cb();
     }

     function close(err) {
         evt.emit('end');
     }
     async.eachSeries(array, loop, close);




 };

 module.exports = tweetFunc;
