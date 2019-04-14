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

// cron.schedule("* * * * *", function() {
    const proxyListOrigin = 'http://nntime.com/proxy-country-01.htm';
    const googlePage = 'https://google.com';
    const videoListPage = 'https://www.youtube.com/channel/UCllKdrJHM3s-W6k7xBsG50w/videos';
    const videoPage = 'https://www.youtube.com/watch?v=ZWgqatrraiQ&t=2s';
    const singleVideoPage = 'https://www.youtube.com/watch?v=jAoVE4pMoQw';
    const articlePage = "https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e";

    console.log('cron run');

//DOM element selectors

    const GOOGLE_INPUT_FIELD = '.gLFyf.gsfi';
    const GOOGLE_SUBMIT = '.FPdoLc.VlcLAe input[type="submit"]';
    async function run() {
        // Viewport && Window size
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
        console.log(proxies.proxies[0]);
        console.log('Done!');

        await page.setViewport({ width, height });
        await page.goto(singleVideoPage, {waitUntil: 'networkidle2'});

        // const html = await page.content();
        //save our html in a file
        // fs.writeFile('page.html', html, _ => console.log('HTML saved'));

        // await page.focus(GOOGLE_INPUT_FIELD);
        // await page.keyboard.type('Ольга Радченко почему ворчат старики');
        // await page.click(GOOGLE_SUBMIT);

        const urlList = await page.evaluateHandle(() => {
            return Array.from(document.getElementsByTagName('a')).map(a => {
                return {
                    link: a.href,
                    // text: a.innerHTML
                };
            });
        });

        let newArray = [{ link: '', text: '' }];
        let linksArray = await urlList.jsonValue();

        let filteredArray = linksArray.filter(item => {
            return item.link.includes('/watch');
        });

        // newArray = filteredArray.map((item, index) => {
        //     console.log(item.link);
        //     newArray.forEach(el => {
        //         return el.link !== item.link;
        //     });
        // });

        console.log(filteredArray);

        // for (let i = 0; i < filteredArray.length; i++) {
        //     for (let k = 0; k < newArray.length; k++) {
        //         if (newArray[i].link !== filteredArray[i].link) {
        //             console.log('not match');
        //             newArray.push(filteredArray[i]);
        //         } else {
        //             console.log('match');
        //         }
        //     }
        //
        //     if (!newArray.link.includes(filteredArray[i].link)) {
        //         newArray.push(filteredArray[i]);
        //     }
        // }

        linksArray = newArray;

        // console.log(linksArray);
        console.log(linksArray.length);

        fs.writeFile('result.json', Object.values(linksArray), _ => console.log('data saved'));

        await browser.close()
    }

    run();

// });

app.listen(3000);