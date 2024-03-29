const puppeteer = require("puppeteer");
const parsePhoneNumber = require('libphonenumber-js')

//User provided constants 
const MAX_CHILD_NODES = 1; //the number of child urls to scrape for data
const contactTypePage = ["contacts", "contact", "contact-us", "contactUs", "contact-Us", "contact_us"]
const excludeEmails = [
    "@sentry-next.wixpress.com",
    "@sentry.wixpress.com",
    "@sentry.io",
    ".png",
    ".jpg",
    "@keen.io"
]


class DataMatch {
    constructor(_name, _displayName, _type, _regExp) {
        this.name = _name;
        this.type = _type;
        this.displayName = _displayName;
        this.regexp = _regExp;
        this.matchArray = [];
        this.featureData = [];
        // this.headers = { allData: _displayName, refinedData1: [_displayName, "Other" + _displayName + " Found"] };
        // this.headers = { allData: _displayName, refinedData1: [_name, "Other" + _displayName + "Found"] };
    }
    getExtractedData(_data) {
        var extractedDataArray = [];

        switch (this.type) {
            case "allLinks":
                {
                    this.matchArray = _data;
                    // console.log("phoneNumber", _data)
                    this.matchArray.forEach((item) => {
                        if (item.includes('tel:')) {
                            const phoneNumber = parsePhoneNumber('+' + item.replace('tel:', '').replace('+', '').replace('-', ''))
                            // console.log("phoneNumber found", item)
                            if (phoneNumber) {
                                extractedDataArray.push(phoneNumber.formatInternational());
                            }
                        }

                    })
                    return extractedDataArray;
                    // console.log("phone number")
                }
                break;

            case "allData":
                {
                    this.matchArray = _data.matchAll(this.regexp);
                    // console.log("other", this.matchArray);
                    for (const item of this.matchArray) {
                        if (extractedDataArray.indexOf(item[0]) === -1)//prevent duplicates
                        {
                            extractedDataArray.push(item[0])
                        }
                    }
                    if (this.name == 'emails') {
                        for (let i = 0; i < extractedDataArray.length; i++) {
                            const email = extractedDataArray[i].toLowerCase().trim();
                            if (excludeEmails.some((domain) => email.includes(domain))) {
                                extractedDataArray.splice(i, 1);
                                i--;
                            }
                        }
                    }
                    return extractedDataArray;
                }
                break;
            default:
                break;
        }
    }
}
//Initialising
var childLinks = [];
const extractors = [
    {
        dataMatch: new DataMatch("emails", "Emails", "allData", new RegExp(/([A-z0-9_.+-]+@[A-z0-9_.-]+\.[A-z]+)/, 'g'))
    },
    {
        dataMatch: new DataMatch("facebookLinks", "Facebook Links", "allData", new RegExp(/(?:https?:\/\/)?(?:www\.)?(mbasic.facebook|m\.facebook|facebook|fb)\.(com|me)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*([\w\-\.]*)/, 'ig'))
    },
    {
        dataMatch: new DataMatch("instagramLinks", "Instagram Links", "allData", new RegExp(/(?:https?:)?\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)/, 'g'))
    },
    {
        dataMatch: new DataMatch("linkedInLinks", "LinkedIn Links", "allData", new RegExp(/(?:https?:)?\/\/(?:[\w]+\.)?linkedin\.com\/((company)|(school))\/([A-z0-9-À-ÿ\.]+)\/?/, 'g'))
    },
    {
        dataMatch: new DataMatch("phoneNumber", "Phone Numbers", "allLinks", new RegExp(/\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/, 'g'))
    }
]
//adding style to header values by add header Name to all Data object
exports.emailContactsScraper = async function (ROOT_URLS_TO_SCRAPE) {
    var refinedData = [];
    const allData = [[]];
    var totalChildLinks = 0
    //create and style header
    // const allDataHeaderNames = [
    //     'Root URL',
    //     'Scraped URL',
    // ]
    // const refinedDataHeaderNames = [
    //     "URL",
    // ]
    // extractors.forEach(extractor => {
    //     allDataHeaderNames.push(extractor.dataMatch.headers.allData);
    //     refinedDataHeaderNames.push(...extractor.dataMatch.headers.refinedData1);
    // })
    for (let index = 0; index < ROOT_URLS_TO_SCRAPE.length; index++) {

        const rootUrl = ROOT_URLS_TO_SCRAPE[index];
        await extractLinks(rootUrl, rootUrl).then(async (extract) => {
            allData.push(extract);
            // console.log("childLinks of " + `${rootUrl}`, childLinks)
            totalChildLinks = totalChildLinks + childLinks.length
            for (let i = 0; i < childLinks.length; i++) {
                const childLink = childLinks[i];
                try {
                    await extractLinks(rootUrl, childLink, 'child').then(extract => {
                        allData.push(extract);
                    });
                } catch (error) {
                    continue
                }
            }
        });
        // console.log("allData", allData);

    }
    await refineAllData(allData).then((data) => refinedData = data).catch((err) => {
        console.error("\x1b[31mError refining enc scraped data!\x1b[37m", err)
    })
    // console.log("DataMatch.refinedData", refinedData)
    console.log(`Total websites scraped for Emails and Contacts: \x1b[33m${ROOT_URLS_TO_SCRAPE.length + totalChildLinks}\x1b[37m websites`)
    return refinedData

}
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}
async function extractLinks(rootUrl, urlToScrape, linktype) {
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
    //minimise the browser
    const session = await page.target().createCDPSession();
    const { windowId } = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });


    const extractedData = {
        rootUrl: rootUrl,
        url: urlToScrape,
    }
    await page.goto(urlToScrape, {
        waitUntil: "domcontentloaded",
    }).catch(err => console.error("\x1b[31mNot possible to scrape, problem with the website!\x1b[37m", urlToScrape))
    // page.waitForNetworkIdle({ idleTime: 1000 }),
    //scrolling to the bottom of the page 216s for 10 URLs with 2 Nodes in headless
    //scrolling to the bottom of the page 337s for 10 URLs with 2 Nodes in headful
    // await autoScroll(page)
    await page.waitForTimeout(2000);

    try {
        //populate childlinks
        if (linktype != 'child') {
            const hrefs = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('a[href]'),
                    a => a.getAttribute('href')
                )
            );

            const filteredHref = hrefs.filter((childUrl, index) => {
                //filter out queryURL, '/' and /#sectionofpage and keep url type objects ie:"https://website.com/abcd" or 
                //subdirectory type objects i.e:"/abcd" 
                if (
                    childUrl.includes(urlToScrape) && childUrl != urlToScrape
                    || childUrl.indexOf('/') == 0 && childUrl.indexOf('#') != 1 && childUrl != "/"

                ) {
                    //and if childurl is a contacts type page
                    if (contactTypePage.some((substring) => childUrl.includes(substring)))
                        return hrefs.indexOf(childUrl) === index;
                }
            })
            filteredHref.length = Math.min(filteredHref.length, MAX_CHILD_NODES);
            //changing /page to website.com/page
            childLinks = filteredHref.map((link) => {
                if (link.indexOf('/') == 0) {
                    link = urlToScrape + link.slice(1);
                }
                return link
            })
            // console.log("childLinks", childLinks)

        }
        const fullPageData = await page.evaluate(() => document.querySelector('*').innerHTML);
        const fullPageLinks = await page.evaluate(
            () => Array.from(
                document.querySelectorAll('a[href]'),
                a => a.getAttribute('href')
            )
        );
        extractors.forEach(extractor => {
            switch (extractor.dataMatch.type) {
                case "allLinks":
                    {
                        extractedData[extractor.dataMatch.name] = extractor.dataMatch.getExtractedData(fullPageLinks);

                    }
                    break;
                case "allData":
                    {
                        extractedData[extractor.dataMatch.name] = extractor.dataMatch.getExtractedData(fullPageData);
                    }
                    break;
                default:
                    break;
            }
            // extractor.dataMatch.setAllData(rootUrl, urlToScrape, extractedData[extractor.dataMatch.name]);
        });
        await browser.close();

    } catch (error) {
        console.log(`\x1b[31mThe browser timedout while scraping \x1b[37m${rootUrl}\x1b[31m,either the website took \ntoo long to load or, please check your internet\x1b[37m`)
        await browser.close();
    }
    await browser.close();
    // console.log("extractedData", extractedData);
    // DataMatch.setAllData(extractedData)
    return extractedData;
    // allData.push(Object.values(extractedData))

}
async function refineAllData(allData) {
    //https://stackoverflow.com/questions/60036060/combine-object-array-if-same-key-value-in-javascript
    const refinedData = [];
    const flattenedData = Object.values(allData).reduce((acc, curr) => {
        const duplicate = acc.find(e => e.rootUrl == curr.rootUrl)
        if (duplicate) {
            extractors.forEach(extractor => {
                //logic for most occuring
                let counts = curr[extractor.dataMatch.name].reduce((counts, num) => {
                    counts[num] = (counts[num] || 0) + 1;
                    return counts;
                }, {});
                let keys = Object.keys(counts)
                //sort most occuring first 222331
                keys.sort(function (p0, p1) {
                    return counts[p1] - counts[p0];
                });

                //concate with existing
                // console.log(duplicate[extractor.dataMatch.name])
                duplicate[extractor.dataMatch.name] = [...new Set([...duplicate[extractor.dataMatch.name], ...keys])]
            });
        } else {
            acc.push(curr)
        }
        return acc
    }, [])
    // console.log("flattenedData", flattenedData);
    flattenedData.shift();
    flattenedData.forEach((data) => {
        const refinedDataInterface = {
            website: data.rootUrl,
        }
        extractors.forEach((extractor) => {
            const name = extractor.dataMatch.name;
            const displayName = extractor.dataMatch.displayName;
            refinedDataInterface[name] = data[name] ? data[name][0] : '';
            refinedDataInterface[`other${displayName.replace('\s', '')}`] = data[name] ? data[name].slice(1).toString() : '';
        })
        refinedData.push(refinedDataInterface);
    })
    // console.log("refinedData", refinedData);
    return refinedData;
}
