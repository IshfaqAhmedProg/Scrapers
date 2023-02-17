import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
XLSX.set_fs(fs);
const allData = [];
async function extractLinks(url, linktype) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { timeout: 60000 });
    const extractedData = {
        url: '',
        emails: [],
        facebookLinks: [],
        instagramLinks: [],
        linkedInLinks: [],
        childLinks: [],
    }
    extractedData.url = url;


    const emailRegExp = new RegExp(/([A-z0-9_.+-]+@[A-z0-9_.-]+\.[A-z]+)/, 'g')
    const facebookRegExp = new RegExp(/(?:https?:\/\/)?(?:www\.)?(mbasic.facebook|m\.facebook|facebook|fb)\.(com|me)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*([\w\-\.]*)/, 'ig')
    const linkedInRegExp = new RegExp(/(?:https?:)?\/\/(?:[\w]+\.)?linkedin\.com\/((company)|(school))\/([A-z0-9-À-ÿ\.]+)\/?/, 'g')
    const instagramRegExp = new RegExp(/(?:https?:)?\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)/, 'g')

    try {
        const data = await page.evaluate(() => document.querySelector('*').outerHTML);
        if (linktype != 'child') {
            const hrefs = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('a[href]'),
                    a => a.getAttribute('href')
                )
            );
            const filteredHref = hrefs.filter((c, index) => {
                if (c.includes(url) && c != url || c.indexOf('/') == 0)
                    return hrefs.indexOf(c) === index;
            })
            extractedData.childLinks = filteredHref.map((link) => {
                if (link.indexOf('/') == 0) {
                    link = url + link.slice(1);
                }
                return link
            })
        }
        const emailMatch = data.matchAll(emailRegExp);
        const facebookLinkMatch = data.matchAll(facebookRegExp);
        const instagramLinkMatch = data.matchAll(instagramRegExp);
        const linkedInLinkMatch = data.matchAll(linkedInRegExp);

        await browser.close();
        for (const facebookLink of facebookLinkMatch) {
            if (extractedData.facebookLinks.indexOf(facebookLink[0]) === -1)//prevent duplicates
                extractedData.facebookLinks.push(facebookLink[0])
        }
        for (const email of emailMatch) {
            if (extractedData.emails.indexOf(email[0]) === -1)//prevent duplicates
                extractedData.emails.push(email[0]);
        }
        for (const instagramLink of instagramLinkMatch) {
            if (extractedData.instagramLinks.indexOf(instagramLink[0]) === -1)//prevent duplicates
                extractedData.instagramLinks.push(instagramLink[0])
        }
        for (const linkedInLink of linkedInLinkMatch) {
            if (extractedData.linkedInLinks.indexOf(linkedInLink[0]) === -1)//prevent duplicates
                extractedData.linkedInLinks.push(linkedInLink[0])
        }

    } catch (error) {
        console.log('The browser timedout!', error)
    }
    await browser.close();
    allData.push(extractedData);
}
function writeToXLSX() {

    allData.map((c) => {
        // for (let index = 0; index < allData.length; index++) {
        //     const element = allData[index];
            
        // }
        c.childLinks = c.childLinks.toString()
        c.emails = c.emails.toString()
        c.facebookLinks = c.facebookLinks.toString()
        c.instagramLinks = c.instagramLinks.toString()
        c.linkedInLinks = c.linkedInLinks.toString()
    });
    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet);
    XLSX.writeFile(workbook, `check.xlsx`);
}
await extractLinks('https://www.nidirect.gov.uk/').then(async () => {
    for (let index = 0; index < allData[0].childLinks.length; index++) {
        const childLink = allData[0].childLinks[index];
        try {
            await extractLinks(childLink, 'child');
        } catch (error) {
            continue
        }
    }
    writeToXLSX();
});