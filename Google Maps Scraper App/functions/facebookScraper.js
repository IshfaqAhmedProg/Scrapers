const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { performance } = require('perf_hooks')
const randomUseragent = require('random-useragent');

puppeteer.use(StealthPlugin());


exports.facebookScraper = async function (request) {
    try {
        const result = []
        for (const url of request) {
            const buffer = url ? await getFacebookInfo(url) : {};
            result.push(buffer);
        }
        // const dedupedResult = [...new Map(result.map(v => [v.title, v])).values()]
        return result;
    } catch (error) {
        console.log(error)
    }
}


async function fillDataFromPage(page) {
    page.on('console', async (msg) => {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
            console.log(await msgArgs[i].jsonValue());
        }
    });
    const dataFromPage = await page.evaluate(() => {
        const likesRegex = /([\d.]+)([KMB])?\s+likes/i;
        const followersRegex = /([\d.]+)([KMB])?\s+followers/i;
        const followingRegex = /([\d.]+)([KMB])?\s+following/i;

        const name = document.querySelector('h1.x1heor9g')?.innerText

        const info = document.querySelector(".xieb3on span:nth-child(1)")
            ?.innerText ||
            document.querySelector('div.x7wzq59:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
                ?.innerText

        const category = document.querySelector('div.x7wzq59:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > ul:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > div:nth-child(1) > span:nth-child(1)')
            ?.innerText

        const address = document.querySelector('div.x1nhvcw1:nth-child(2) > div:nth-child(2) > div:nth-child(1) > span:nth-child(1)')
            ?.innerText

        const phoneNumber = document.querySelector('div.x1nhvcw1:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)')
            ?.innerText

        const email = document.querySelector('div.x7wzq59:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(7) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > span:nth-child(1)')
            ?.innerText ||
            document.querySelector('div.x1nhvcw1:nth-child(4) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)')
                ?.innerText

        const website = document.querySelector('div.x2lah0s:nth-child(5) > div:nth-child(2) > div:nth-child(1) > a:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)')
            ?.innerText ||
            document.querySelector('.x1qq9wsj .x1yc453h')?.innerText ||
            document.querySelector('div.x7wzq59:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(5) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > span:nth-child(1) > a:nth-child(1)')
                ?.innerText
        const rating = document.querySelector('div.x9f619:nth-child(7) > div:nth-child(2) > a:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)')
            ?.innerText.match(/[\d\.]+(?=\s*\()/)

        const reviews = document.querySelector('div.x9f619:nth-child(7) > div:nth-child(2) > a:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)')
            ?.innerText.match(/\d+(?=\s+reviews)/)

        const likes = document.querySelector('div.x1cy8zhl:nth-child(2) > span:nth-child(1)')
            ?.innerText.match(likesRegex)?.[0].replace(' likes', '') ||
            document.querySelector('div.x7wzq59:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > span:nth-child(1)')
                ?.innerText.replace(' people', '')

        const followers = document.querySelector('div.x1cy8zhl:nth-child(2) > span:nth-child(1)')
            ?.innerText.match(followersRegex)?.[0].replace(' followers', '') ||
            document.querySelector('div.xl56j7k:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > span:nth-child(1)')
                ?.innerText.replace(' people follow this', '')

        const following = document.querySelector('div.x1cy8zhl:nth-child(2) > span:nth-child(1)')
            ?.innerText.match(followingRegex)?.[0].replace(' following', '')



        const pageDetails = {
            "nameOnFb": name || '',
            "infoOnFb": info?.startsWith('Page · ') ? "" : info,
            "categoryOnFb": category ?
                category.replace('Page · ', '') :
                info?.startsWith('Page · ') ?
                    info.replace('Page · ', '') :
                    '',
            "addressOnFb": address || '',
            "phoneOnFb": phoneNumber || '',
            "emailOnFb": email || '',
            "websiteOnFb": website || '',
            "ratingOnFb": rating ? `${rating[0]} stars` : '',
            "reviewsOnFb": reviews ? reviews[0] : '',
            "likesOnFb": likes || '',
            "followersOnFb": followers || '',
            "followingOnFb": following || ''
        }
        return pageDetails
    });
    return dataFromPage;
}

async function getFacebookInfo(URL) {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        // await page.setUserAgent(
        //     randomUseragent.getRandom(function (ua) {
        //         return ua.folder === '/Browsers - Windows';
        //     })
        // )
        //need to enable cookies https://stackoverflow.com/questions/69496344/how-to-set-cookies-enabled-in-puppeteer
        var results = {
            "nameOnFb": '',
            "infoOnFb": '',
            "categoryOnFb": '',
            "addressOnFb": '',
            "phoneOnFb": '',
            "emailOnFb": '',
            "websiteOnFb": '',
            "ratingOnFb": '',
            "reviewsOnFb": '',
            "likesOnFb": '',
            "followersOnFb": '',
            "followingOnFb": '',
        }
        await page.goto(URL).then(async () => {
            await page.waitForTimeout(2000);
            results = await fillDataFromPage(page)
        }).catch(err =>
            console.error("\x1b[31mNot possible to scrape, problem with the website!\x1b[37m", URL)
        );
        results.facebookLinks = URL

        // await page.waitForNavigation();
        await browser.close();

        return results;
    } catch (err) {
        // if (err instanceof TimeoutError) {
        // throw new Error('Please check your internet, or check if you are getting recaptcha or blocked when visiting facebook. If you are then change your IP address!')
        // }
        // else {
        console.log("faceboook scraper", URL, err)
        // }
    }
}
