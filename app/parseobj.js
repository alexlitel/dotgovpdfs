'use strict';
const Entities = require('html-entities').AllHtmlEntities;


const objGen = (data) => {
    class Item {
        constructor(data) {
            const title = data.title;
            const link = data.link

            function decodeStr(str) {
                var entities = new Entities();
                return entities.decode(str);
            }

            function getHostName(url) {
                return url.match(/(url=http(s)??\:\/\/(www)?).+\.gov/)[0].replace(/url=http(s)?\:\/\/(www\.)?/, '');
            }

            function getUrl(url) {
                return url.slice(url.lastIndexOf('http'), url.indexOf('&ct'));
            }


            function truncDesc(str) {
                return (str.length > 92) ? str.substr(0,91) + "…" : str;
            }

            this.title = decodeStr(title);
            this.url = {
                full: link,
                actual: getUrl(link),
            };
            this.hostname = getHostName(link);
            this.tweet = {
                text: `${truncDesc(this.title)} ${this.hostname} ${this.url.actual}`,
                link: null
            }

        }
    }

    return new Item(data);
};

module.exports = objGen;
