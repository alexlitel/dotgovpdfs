'use strict';
const request = require('request');
const FeedParser = require('feedparser');
const objParse = require('./parseobj');
const dbCheck = require('./tweet');

const app = () => {
    const feed = request('https://www.google.com/alerts/feeds/05724736813364006377/1110170774429747755');
    const feedparser = new FeedParser({ normalize: true });
    var arr = [];
    feed.on('response', function(res) {
        var stream = this;
        if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
        stream.pipe(feedparser);
    });

    feedparser.on('readable', function() {
        var stream = this;
        var item;

        while (item = stream.read()) {
            arr.push(objParse(item));
        }

    });

   feedparser.on('end', function() {
        dbCheck(arr);
    });
};
app();
