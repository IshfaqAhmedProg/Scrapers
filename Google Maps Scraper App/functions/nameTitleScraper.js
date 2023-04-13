const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { performance } = require('perf_hooks')
const nlp = require('compromise/three')
const randomUseragent = require('random-useragent');
puppeteer.use(StealthPlugin());


exports.nameTitleScraper = async function (request) {
    try {
        const result = []
        for (const email of request) {
            if (email) {
                const buffer = await getResults(email);
                result.push(buffer);
            }
        }
        // const dedupedResult = [...new Map(result.map(v => [v.title, v])).values()]
        return result;
    } catch (error) {
        console.log(error)
    }
}


async function fillDataFromPage(page) {
    const dataFromPage = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".MjjYud")).map((el) => {
            const pageDetails = {
                "title": el.querySelector('.DKV0Md')?.innerText || '',
                "website": el.querySelector('span.VuuXrf')?.innerText || '',
                "desc": el.querySelector('.lEBKkf')?.innerText || '',
            }
            return pageDetails
        });
    });
    return dataFromPage;
}

async function getResults(email) {

    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        //minimise the browser
        const session = await page.target().createCDPSession();
        const { windowId } = await session.send('Browser.getWindowForTarget');
        await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });


        // await page.setUserAgent(
        //     randomUseragent.getRandom(function (ua) {
        //         return ua.folder === '/Browsers - Windows';
        //     })
        // )
        const queryURI = encodeURI(email);
        var results = {
            "relatedName": '',
            "otherRelatedNames": '',
            "emails": email
        }
        const dataFromPage = [];
        await page.goto(`https://www.google.com/search?q=${queryURI}`)
            .then(async () => {
                // await page.waitForNavigation();
                await page.waitForTimeout(2000);
                // await page.waitForSelector('.MjjYud').then(async () => {
                // TODO: add recaptcha solver here
                dataFromPage.push(...(await fillDataFromPage(page)));
                // });
                await browser.close();
                results = await checkForNamesAndTitles(dataFromPage, email)
            })
            .catch(err => console.log("\x1b[31mNot possible to get name, problem with google search, check for reCaptcha!\x1b[37m"));

        return results;
    } catch (error) {
        // if (err instanceof TimeoutError) {
        // throw new Error('Please check your internet, or check if you are getting recaptcha or blocked when visiting any google site. If you are then change your IP address!')
        // }
        // else {
        console.log()
        // }
    }
}
async function checkForNamesAndTitles(dataFromPage, email) {
    const resultsToCheck = {
        "firstResultType": dataFromPage[0],
        "linkedInType": dataFromPage.filter((data) => data.website == 'linkedin.com')[0],
        "twitterType": dataFromPage.filter((data) => data.website == 'twitter.com')[0]
    }

    let allNamesFromFirstResult = nlp(resultsToCheck.firstResultType?.desc).people().normalize().out('array')
    let allNamesFromLinkedIn = nlp(resultsToCheck.linkedInType?.desc).people().normalize().out('array')
    let allNamesFromTwitter = nlp(resultsToCheck.twitterType?.desc).people().normalize().out('array')

    let nameFound = allNamesFromFirstResult[0] || allNamesFromLinkedIn[0] || allNamesFromTwitter[0];

    allNamesFromFirstResult.length > 0 ? allNamesFromFirstResult.shift() : allNamesFromFirstResult.length = 0
    allNamesFromLinkedIn.length > 0 ? allNamesFromLinkedIn.shift() : allNamesFromLinkedIn.length = 0
    allNamesFromTwitter.length > 0 ? allNamesFromTwitter.shift() : allNamesFromTwitter.length = 0

    let otherNamesFound = newArray(allNamesFromFirstResult, allNamesFromLinkedIn, allNamesFromTwitter)
    return {
        "relatedName":  nameFound || '',
        "otherRelatedNames": otherNamesFound || '',
        "emails": email
    }
}
function newArray(x, y, z) {
    d = []
    x.concat(y, z).forEach(item => {
        if (d.indexOf(item) == -1)
            d.push(item);
    });
    return d;
}

