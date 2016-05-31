 'use strict';
 const mongoose = require('mongoose');
 const Twit = require('twit');
 const Tweet = require('./schema');
 const request = require('request');
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

     evt.on('end', function(data) {
         console.log('End of loop, db is now closing');
         db.connection.close();
     });



     function parseFile(item, cb) {
         function cutOffDate(str) {
             return new Date(str) > new Date(new Date().setMonth(new Date().getMonth() - 6));

         }

         const req = request.head(item.url.actual);
         console.log(item.url.actual);
         req.on('error', function(err) {
        
             console.log('Error accessing document');
             req.abort();
             checkDb(item);
         })
         req.on('response', function(res) {
             if (res.statusCode !== 200) {
                 console.log('Document unavailable');
                 req.abort();
                 checkDb(item);
             } else {
                 if (res.headers.hasOwnProperty('last-modified')) {
                     let validDate = cutOffDate(res.headers['last-modified']);
                     req.abort();
                     if (validDate) {
                         console.log('Document within date range');
                         checkDb(item);
                     } else {
                         console.log('Document out of date range');
                         return false;
                     }
                 } else {
                     console.log('Document doesn\'t have modified header');
                     req.abort();
                     checkDb(item);
                 }
             }
         });

     };

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

             parseFile(item);
             cb();

         }, 10000);
     }

     function close(err) {
         setTimeout(function() {
             evt.emit('end', array);
         }, 30000);
     }
     async.eachSeries(array, loop, close);

 };

 module.exports = tweetFunc;
