const puppeteer = require('puppeteer');
require('dotenv').config();
let url = 'https://www.facebook.com';

let email = process.env.EMAIL;
let pass = process.env.PASSWORD;

(async () => {
    const browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();
    await page.goto(url);
    await page.focus('input[id=email]');
    await page.keyboard.type(email)
    await page.focus('input[id=pass]');
    await page.keyboard.type(pass);

    let res = await Promise.all([
        await page.keyboard.press("Enter"),
        await page.waitForNavigation({waitUntil: 'networkidle2'}),
    ])
    let partUrl = await page.evaluate(() => {
        let link = document.querySelector('div[aria-label="Facebook"]>ul>li>span>div>a[href="/bookmarks/"]')
        return link.getAttribute('href');
    });
    let newUrl = url.concat(partUrl);
    await page.goto(newUrl, {waitUntil: 'networkidle2'});
    let urlProfile = await page.evaluate(async () => {
        let link = document.querySelector('div[data-pagelet="page"]>div>div>div[class="buofh1pr"]>ul>li>div>a');
        return link.getAttribute('href');
    });
    await page.goto(urlProfile, {waitUntil: 'networkidle2'});

    let user = await page.evaluate(() => {
        let title = document.querySelector('div[class="bi6gxh9e aov4n071"]>span[dir="auto"]>h1[class="gmql0nx0 l94mrbxd p1ri9a11 lzcic4wl bp9cbjyn j83agx80"][dir="auto"]');
        let name = title.textContent;
        let img = document.querySelector('svg[aria-label]>g[mask="url(#jsc_c_i)"]>image');
        const studySelector = 'div[data-pagelet="ProfileTilesFeed_0"] ul span'
        let placeOfStudy = document.querySelector(studySelector).textContent

        return {
            name: name,
            imgUrl: img?.hasAttribute('xlink:href') ? img.getAttribute('xlink:href') : 'img',
            placeOfStudy: placeOfStudy
        };
    })

    console.log(`full Name: ${user.name}`);
    console.log(`place of study: ${user.placeOfStudy}`);
    console.log(`image: ${user.imgUrl}`);

    let urlPosts = String(urlProfile).concat('posts/');
    let selector = 'div[data-pagelet="ProfileTimeline"] a[href^="' + urlPosts + '"]';

    await page.keyboard.press("Enter");

    await  page.evaluate(async(selector)=>{
        const delay = 3000;
        const wait = (ms) => new Promise(res => setTimeout(res, ms));
        const count = async () => document.querySelectorAll('div[data-pagelet="ProfileTimeline"]').length;
        const scrollDown = async () => {
            document.querySelector(selector)
                .scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'center' });
        }
        let preCount = 0;
        let postCount = 0;
        do {
            preCount = await count();
            await scrollDown();
            await wait(delay);
            postCount = await count();
        } while (postCount > preCount);
        await wait(delay);
    },selector)

    let timePosts = await page.evaluate((selector) => {
        let timeList = [];
        let listPosts = document.querySelectorAll(selector)
        listPosts.forEach(value => {
            timeList.push(value.innerText);
        })
        return timeList;

    }, selector)
    console.log(timePosts);

    await browser.close()
})()






