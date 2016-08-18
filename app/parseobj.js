'use strict';
const Entities = require('html-entities').AllHtmlEntities;

class Item {
    static decodeStr(str) {
        let entities = new Entities();
        return entities.decode(str);
    };

    static getHostName(url) {
        return url.match(/(url=http(s)??\:\/\/(www)?).+\.gov/)[0].replace(/url=http(s)?\:\/\/(www\.)?/, '');
    };
    static getUrl(url) {
        return url.slice(url.lastIndexOf('http'), url.indexOf('&ct'));
    };
    static truncDesc(str) {
        return (str.length > 92) ? str.substr(0, 91) + "…" : str;
    };

    constructor(data) {
        const title = data.title;
        const link = data.link
        this.title = Item.decodeStr(title);
        this.url = {
            full: link,
            actual: Item.getUrl(link),
        };
        this.hostname = Item.getHostName(link);
        this.tweet = {
            text: `${Item.truncDesc(this.title)} ${this.hostname} ${this.url.actual}`,
            link: null
        }

    }
};

const objGen = (data) => {
    return new Item(data);
};

module.exports = objGen;
