const path = require('path');
const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const proxies = require('./proxies');
const cron = require('node-cron');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');
// app.get('/', (req, res, next) => {
//     res.render('index', {pageTitle: 'Index page', path: '/'});
// });

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

const videoListPage = 'https://www.youtube.com/channel/UCllKdrJHM3s-W6k7xBsG50w/videos';
const videoPage = 'https://www.youtube.com/watch?v=ZWgqatrraiQ&t=2s';
const singleVideoPage = 'https://www.youtube.com/watch?v=jAoVE4pMoQw';

let newArray = [];
let videoIndex = 0;
let linksArray = [];

async function initVideoParser() {
    const width = 1650;
    const height = 2000;

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            // `--proxy-server=${ proxies.proxies[0] }`,
            `--window-size=${ width },${ height }`,
            '--no-sandbox', '--disable-setuid-sandbox'
        ],
    });
    const page = await browser.newPage();
    // console.log(proxies.proxies[0]);
    console.log('Done!');

    await page.setViewport({width, height});
    await page.goto(videoListPage, {waitUntil: 'networkidle2'});

    const urlList = await page.evaluateHandle(() => {
        return Array.from(document.getElementsByTagName('a')).map(a => {
            return {
                link: a.href,
                // text: a.innerHTML
            };
        });
    });

    linksArray = await urlList.jsonValue();
    let filteredArray = linksArray.filter(item => {
        return item.link.includes('/watch');
    });

    newArray = [];
    newArray = filteredArray.reduce((unique, o) => {
        if (!unique.some(obj => obj.link === o.link)) {
            unique.push(o);
        }
        return unique;
    }, []);
    // console.log(newArray);
    linksArray = newArray;

    console.log(linksArray.length);

    fs.writeFile('result.txt', Object.values(linksArray), _ => console.log('data saved'));

    await browser.close();
}

initVideoParser();

cron.schedule("* * * * *", function () {
    console.log('cron run');
    async function run() {
        // Viewport && Window size
        const width = 800;
        const height = 600;
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                // `--proxy-server=${ proxies.proxies[0] }`,
                `--window-size=${ width },${ height }`,
                '--no-sandbox', '--disable-setuid-sandbox'
            ],
        });
        const page = await browser.newPage();
        console.log('Current link: ', linksArray[videoIndex].link);

        await page.setViewport({width, height});
        await page.goto(linksArray[videoIndex].link, {waitUntil: 'networkidle2'});
        await page.waitFor(10000);
        videoIndex++;
        await browser.close();
    }

    run();
});

app.listen(3000);