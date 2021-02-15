const puppeteer = require('puppeteer');
require('dotenv').config();
const url = 'https://www.facebook.com';
let urlProfile = '';//TODO add url profile example 'https://www.facebook.com/your.link/'
const email = process.env.EMAIL;
const pass = process.env.PASSWORD;
const friend = 'V'; //TODO input name friend
(async () => {
    const browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();

    async function loginUser() {
        await page.goto(url);
        await page.focus('input[id=email]');
        await page.keyboard.type(email)
        await page.focus('input[id=pass]');
        await page.keyboard.type(pass);

        let res = await Promise.all([
            await page.keyboard.press("Enter"),
            await page.waitForNavigation({waitUntil: 'networkidle2'}),
        ])
    }

    async function getInfoForLogoutUser() {
        await page.goto(urlProfile, {waitUntil: 'networkidle2'});
        let partUrl = await page.evaluate(() => {
            let name = document.querySelector('div[id="fbProfileCover"] span[id="fb-timeline-cover-name"]>a');
            let image = document.querySelector('div[id="fbTimelineHeadline"] img').getAttribute('src');
            let isCheckEducation = document.querySelector('div[id="pagelet_eduwork"]');
            let educations = []
            if (isCheckEducation) {
                let educationNodes = document.querySelectorAll('div[id="pagelet_eduwork"] ul li a:not([tabindex][aria-hidden])')
                educationNodes.forEach(value => {
                    educations.push(value.innerText)
                })
            }

            console.log(name, image, educations);
            return {
                name: name.textContent,
                imageUrl: image,
                educations: educations
            };
        });
        console.log('part url', partUrl);
    }

    async function getInfoForLoginUser() {
        console.log(urlProfile)
        if (!urlProfile || !urlProfile.length) {
            let partUrl = await page.evaluate(() => {
                let link = document.querySelector('div[aria-label="Facebook"]>ul>li>span>div>a[href="/bookmarks/"]')
                return link.getAttribute('href');
            });
            let newUrl = url.concat(partUrl);
            await page.goto(newUrl, {waitUntil: 'networkidle2'});
            let profile = await page.evaluate(async () => {
                let link = document.querySelector('div[data-pagelet="page"] ul>li>div>a');
                return link.getAttribute('href');
            });
            urlProfile = String(profile)
        }
        await page.goto(urlProfile, {waitUntil: 'networkidle2'});
        await page.focus('div[data-pagelet="root"] div[data-pagelet="page"] h1');
        await page.keyboard.press("Enter");
        let user = await page.evaluate(() => {
            let title = document.querySelector('div[data-pagelet="root"] div[data-pagelet="page"] h1');
            let name = title.textContent;
            let img = document.querySelector('div[data-pagelet="root"] div[data-pagelet="page"] svg[aria-label]>g>image');
            let isEducation = document.querySelector('div[data-pagelet="ProfileTilesFeed_0"] ul');
            let education;
            if (isEducation) {
                education = document.querySelector('div[data-pagelet="ProfileTilesFeed_0"] ul span').textContent
            }

            return {
                name: name,
                imgUrl: img?.hasAttribute('xlink:href') ? img.getAttribute('xlink:href') : 'img',
                education: education

            };
        })

        console.log(user)

        let selector = 'div[data-pagelet="ProfileTimeline"] a span[aria-labelledby]>span[aria-labelledby]';

        await page.keyboard.press("Enter");
        let timePosts;

        await page.evaluate(async () => {
            const delay = 3000;
            const wait = (ms) => new Promise(res => setTimeout(res, ms));
            const count = async () => document.querySelectorAll('div[data-pagelet="ProfileTimeline"]>div').length;
            const scrollDown = async () => {
                document.querySelector('div[data-pagelet="ProfileTimeline"]>div:last-child')
                    .scrollIntoView({behavior: 'smooth', block: 'end', inline: 'center'});
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
        })

        timePosts = await page.evaluate((selector) => {
            let timeList = [];
            let listPosts = document.querySelectorAll(selector)
            listPosts.forEach(value => {
                let time = value.parentElement.innerText;
                timeList.push(time);
            })
            return timeList;

        }, selector)
        console.log(timePosts);
    }

    async function findFriends() {
        await page.keyboard.press("Enter");
        await page.focus('input[type="search"]');

        await page.keyboard.type(friend);
        await new Promise(r => setTimeout(r, 2000));

        let listFriend = await page.$$eval('div[role="listbox"] ul li[role="option"]', list => {
            let resList = [];
            let resLength = 0;
            for (let i = 0; i < list.length; i++) {
                let el = list[i];
                if (el.querySelector('img[src]')) {
                    let name = el.querySelector('a span').textContent;
                    resList.push(name);
                    resLength++;
                }
                if (resLength >= 5) {
                    break;
                }
            }
            return resList;
        });
        console.debug('List li', listFriend)
        return listFriend;
    }

    if (pass && email) {
        //TODO with credentials password and email
        await loginUser();
        await findFriends();
        // await getInfoForLoginUser()
    } else {
        //TODO  if your logout but ...
        // await getInfoForLogoutUser();
    }
    //await browser.close()
})()








