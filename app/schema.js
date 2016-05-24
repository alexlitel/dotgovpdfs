'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tweetSchema = new Schema({
	title: String,
	url: {
		full: String,
		actual: String
	},
	hostname: String,
	tweet: {
		text: String,
		link: String,
		time: { type : Date, default: new Date() }
	}
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;