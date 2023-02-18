import puppeteer from 'puppeteer';
import * as XLSX from 'sheetjs-style';
//User provided constants 
const MAX_CHILD_NODES = 10;
const rootUrlsToScrape = [
    "https://www.scrapefox.vercel.app/",
    "https://bdswimmingpool.com/",
    "https://www.nidirect.gov.uk/"

]

//Initialising
const allDataHeaderNames = [
    'Root URL',
    'Scraped URL',
    'Emails',
    'Facebook Links',
    'Instagram Links',
    'LinkedIn Links',
]
const refinedDataHeaderNames = [
    "URL",
    "Email",
    "Other Emails Found",
    "Facebook Link",
    "Other Facebook Links",
    "Instagram Link",
    "Other Instagram Links",
    "LinkedIn Link",
    "Other LinkedIn Links",
]
const allData = [[]]
const refinedData = [[]];

var childLinks = [];

//adding style to header values by add header Name to all Data object
function styleHeader(headerArray, data) {
    headerArray.forEach(header => {
        data[0].push({
            v: `${header}`, t: "s", s: {
                font: { bold: true, color: { rgb: "FFFFFFFF" } },
                fill: { fgColor: { rgb: "FF7B68EE" } },
                border: {
                    top: { style: "medium", color: { rgb: "FF7B68EE" } },
                    bottom: { style: "medium", color: { rgb: "FF7B68EE" } },
                    left: { style: "medium", color: { rgb: "FF7B68EE" } },
                    right: { style: "medium", color: { rgb: "FF7B68EE" } }
                },
                alignment: { wrapText: true }
            }
        })
    });
}


async function extractLinks(rootUrl, urlToScrape, linktype) {
    const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true });
    const page = await browser.newPage();

    await Promise.all([
        page.goto(urlToScrape, {
            waitUntil: "domcontentloaded",
        }),
        page.waitForNetworkIdle({ idleTime: 2000 }),
    ]);
    const extractedData = {
        rootUrl: rootUrl,
        url: '',
        emails: '',
        facebookLinks: '',
        instagramLinks: '',
        linkedInLinks: '',
    }
    extractedData.url = urlToScrape;


    const emailRegExp = new RegExp(/([A-z0-9_.+-]+@[A-z0-9_.-]+\.[A-z]+)/, 'g')
    const facebookRegExp = new RegExp(/(?:https?:\/\/)?(?:www\.)?(mbasic.facebook|m\.facebook|facebook|fb)\.(com|me)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*([\w\-\.]*)/, 'ig')
    const linkedInRegExp = new RegExp(/(?:https?:)?\/\/(?:[\w]+\.)?linkedin\.com\/((company)|(school))\/([A-z0-9-À-ÿ\.]+)\/?/, 'g')
    const instagramRegExp = new RegExp(/(?:https?:)?\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)/, 'g')
    //populate childlinks
    try {
        if (linktype != 'child') {
            const hrefs = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('a[href]'),
                    a => a.getAttribute('href')
                )
            );
            //filter out queryURL, '/' and /#sectionofpage and keep url type objects ie:"https://website.com/abcd" or 
            //subdirectory type objects i.e:"/abcd" 
            const filteredHref = hrefs.filter((c, index) => {
                if (c.includes(urlToScrape) && c != urlToScrape || c.indexOf('/') == 0 && c.indexOf('#') != 1 && c != "/") {
                    return hrefs.indexOf(c) === index;
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
        }
    } catch (error) {
        console.log(error);
    }

    try {
        // console.log("childLinks", childLinks)
        const data = await page.evaluate(() => document.querySelector('*').outerHTML);

        const emailMatch = data.matchAll(emailRegExp);
        const facebookLinkMatch = data.matchAll(facebookRegExp);
        const instagramLinkMatch = data.matchAll(instagramRegExp);
        const linkedInLinkMatch = data.matchAll(linkedInRegExp);

        await browser.close();
        for (const facebookLink of facebookLinkMatch) {
            if (extractedData.facebookLinks.indexOf(facebookLink[0]) === -1)//prevent duplicates
                extractedData.facebookLinks = extractedData.facebookLinks + (extractedData.facebookLinks == "" ? "" : ",") + facebookLink[0]
        }
        for (const email of emailMatch) {
            if (extractedData.emails.indexOf(email[0]) === -1)//prevent duplicates
                extractedData.emails = extractedData.emails + (extractedData.emails == "" ? "" : ",") + email[0]
        }
        for (const instagramLink of instagramLinkMatch) {
            if (extractedData.instagramLinks.indexOf(instagramLink[0]) === -1)//prevent duplicates
                extractedData.instagramLinks = extractedData.instagramLinks + (extractedData.instagramLinks == "" ? "" : ",") + instagramLink[0]
        }
        for (const linkedInLink of linkedInLinkMatch) {
            if (extractedData.linkedInLinks.indexOf(linkedInLink[0] === -1))//prevent duplicates
                extractedData.linkedInLinks = extractedData.linkedInLinks + (extractedData.linkedInLinks == "" ? "" : ",") + linkedInLink[0]
        }

    } catch (error) {
        console.log('The browser timedout!', error)
        await browser.close();
    }
    await browser.close();
    // console.log("extractedData", extractedData);
    allData.push(Object.values(extractedData))

}

async function refineAllData() {

    const allDataWoHeader = allData.slice(1);//removing headers
    const allDataToObj = allDataWoHeader.map(([RootURL,
        ScrapedURL,
        Emails,
        FacebookLinks,
        InstagramLinks,
        LinkedInLinks]) => {
        return { RootURL, ScrapedURL, Emails: Emails.split(','), FacebookLinks: FacebookLinks.split(','), InstagramLinks: InstagramLinks.split(','), LinkedInLinks: LinkedInLinks.split(',') }
    })
    // console.log("allDataToObj", allDataToObj);
    //https://stackoverflow.com/questions/60036060/combine-object-array-if-same-key-value-in-javascript
    const flattenedData = Object.values(allDataToObj).reduce((acc, curr) => {
        const duplicate = acc.find(e => e.RootURL == curr.RootURL)
        if (duplicate) {
            duplicate.Emails = [...new Set([...duplicate.Emails, ...curr.Emails])]
            duplicate.FacebookLinks = [...new Set([...duplicate.FacebookLinks, ...curr.FacebookLinks])]
            duplicate.InstagramLinks = [...new Set([...duplicate.InstagramLinks, ...curr.InstagramLinks])]
            duplicate.LinkedInLinks = [...new Set([...duplicate.LinkedInLinks, ...curr.LinkedInLinks])]
        } else {
            acc.push(curr)
        }
        return acc
    }, [])
    flattenedData.forEach(data => {
        const refinedDataInterface = {
            url: data.RootURL,
            possibleEmail: data.Emails[0],
            otherEmails: data.Emails.slice(1).toString(),
            possibleFacebookLink: data.FacebookLinks[0],
            otherFacebookLinks: data.FacebookLinks.slice(1).toString(),
            possibleInstagramLink: data.InstagramLinks[0],
            otherInstagramLinks: data.InstagramLinks.slice(1).toString(),
            possibleLinkedInLink: data.LinkedInLinks[0],
            otherLinkedInLinks: data.LinkedInLinks.slice(1).toString(),
        }
        refinedData.push(Object.values(refinedDataInterface));
    })

    console.log("refinedData", refinedData);
    // console.log("flattenedData", flattenedData);
}
async function main() {
    const workbook = XLSX.utils.book_new();

    styleHeader(allDataHeaderNames, allData)
    styleHeader(refinedDataHeaderNames, refinedData)
    for (let index = 0; index < rootUrlsToScrape.length; index++) {
        const rootUrl = rootUrlsToScrape[index];
        await extractLinks(rootUrl, rootUrl).then(async () => {
            console.log("childLinks", childLinks)
            for (let index = 0; index < childLinks.length; index++) {
                const childLink = childLinks[index];
                try {
                    await extractLinks(rootUrl, childLink, 'child');
                } catch (error) {
                    continue
                }
            }
        });
        console.log("allData", allData);

    }
    await refineAllData()
    workbook.SheetNames.push("Refined Data");
    workbook.SheetNames.push("All Data");
    workbook.Sheets["Refined Data"] = XLSX.utils.aoa_to_sheet(refinedData);
    workbook.Sheets["All Data"] = XLSX.utils.aoa_to_sheet(allData);
    XLSX.writeFile(workbook, `check.xlsx`);

}
main();