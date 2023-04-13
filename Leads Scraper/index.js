"use strict"
var fs = _interopRequireWildcard(require("fs"));
var _promises = require("stream/promises");
var _readline = _interopRequireDefault(require("readline"));
const { mapsScraper } = require('./functions/mapsScraper')
const { emailContactsScraper } = require('./functions/emailContactsScraper')
const { facebookScraper } = require('./functions/facebookScraper')
const { nameTitleScraper } = require('./functions/nameTitleScraper')
const locationArray = require('./locations.json')
const keywordsJSON = require('./keywords.json')
const xlsx = require('sheetjs-style');


function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }


const rl = _readline.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = query => new Promise(resolve => rl.question(query, resolve));
const GLOBAL = {
    start: {
        processFound: false,
        processInput: '',
        process: false,
    },
    restart: {
        processFound: false,
        processInput: '',
        process: false,
    },
    keywordCount: 0,
    locationCount: 0,

    scrapeFacebook: {
        processFound: false,
        processInput: '',
        process: false,
    },
    scrapeNameTitle: {
        processFound: false,
        processInput: '',
        process: false,
    }

}
function totalTime() {
    const GMTIME = 60;
    const ENCTIME = 10.5;
    const FBTIME = 6.5;
    const NTTIME = 8.5;
    const AVGENC = 60;
    const AVGNT = 20;
    const AVGFB = 50;
    let total = (
        ((GLOBAL.keywordCount * GMTIME)
            + (AVGENC * ENCTIME)
            + (GLOBAL.scrapeFacebook.process && (AVGFB * FBTIME))
            + (GLOBAL.scrapeNameTitle.process && (AVGNT * NTTIME)))
        * GLOBAL.locationCount
    )

    return total
}
async function userIO(stage, condition) {
    switch (stage) {
        case 'Initialise': {
            console.log(`
            ██      ███████  █████  ██████  ███████         
            ██      ██      ██   ██ ██   ██ ██              
            ██      █████   ███████ ██   ██ ███████         
            ██      ██      ██   ██ ██   ██      ██         
            ███████ ███████ ██   ██ ██████  ███████         
                                                            
                                                            
    ███████  ██████ ██████   █████  ██████  ███████ ██████  
    ██      ██      ██   ██ ██   ██ ██   ██ ██      ██   ██ 
    ███████ ██      ██████  ███████ ██████  █████   ██████  
         ██ ██      ██   ██ ██   ██ ██      ██      ██   ██ 
    ███████  ██████ ██   ██ ██   ██ ██      ███████ ██   ██ 
                                                            `)
            console.log(`\n\x1b[1m------------------------------\x1b[33mIshfaq Ahmed\x1b[37m--------------------------------`);
            console.log(`-----------------------\x1b[33mGithub: @IshfaqAhmedProg\x1b[37m---------------------------\x1b[0m\n\n\n`);
            console.log(`\x1b[1mScrape Google Business Listings, Business Websites, Emails, Names,
Phone Numbers, Social Media Links, Facebook public pages and Online Presence, for any location, to generate Leads!\n`)
            console.log(`**Instructions**\x1b[0m\n
1)\x1b[32m Make sure the keywords are on the keywords.json file.\x1b[37m
      \x1b[37mFormat\x1b[32m   => \x1b[33m{"keywords":["keyword1","keyword2",...]}\x1b[37m\n
2)\x1b[32m To change the locations add it to locations.json file (Set by default to US).\x1b[37m
      \x1b[37mFormat\x1b[32m   => \x1b[33m{
                  "Country1":[
                    {
                      "state":"state1",
                      "city":"city1",
                      "lat":100,
                      "lng":200
                    },
                    ...],
                  ...}\x1b[37m\n
3)\x1b[32m If any of the emails are dummy mails or you want to exclude add it to
    \x1b[33mexcludeEmails\x1b[37m in \x1b[33m/functions/emailContactsScraper.js.\x1b[37m\n
4)\x1b[32m If any of the contacts pages are being left out while scraping add the
    keyword to \x1b[33mcontactTypePage\x1b[37m in \x1b[33m/functions/emailContactsScraper.js\x1b[37m\n
5)\x1b[32m Make sure none of the output excel files are open.\x1b[37m\n
6)\x1b[32m Keep an eye on the chromium browser to see if you're being blocked because of reCaptcha
    or some other reason like accepting cookies form. If you see reCaptcha change your ip or wait 10min
    before restarting!\x1b[37m\n
7)\x1b[32m Make sure to check your ip reputation on https://talosintelligence.com/reputation_center/, 
    bad reputation could lead to getting reCaptcha everytime\x1b[37m\n
8)\x1b[32m If you see multiple chromium instances, close the instance thats been running the 
    longest manually\x1b[37m\n
9)\x1b[32m Sometimes while scraping facebook, you might be warned by facebook with this message

        %cStop!

        %cThis is a browser feature intended for developers. If someone told you to copy and 
        paste something here to enable a Facebook feature or "hack" someone's account, 
        it is a scam and will give them access to your Facebook account., 
    
    Ignore this message. \x1b[37m\n
            `);
        }
            break;
        case 'restart':
            {
                while (!GLOBAL.restart.processFound) {
                    GLOBAL.restart.processInput = await prompt("\x1b[32m\nDo you want to restart the script?\x1b[37m Y/N: ");
                    if (GLOBAL.restart.processInput.match(/^[YNyn]$/)) {
                        if (GLOBAL.restart.processInput.match(/^[Yy]$/)) {
                            console.log(`\x1b[32mRestarting script!`)
                            const initialValues = {
                                start: {
                                    processFound: false,
                                    processInput: '',
                                    process: false,
                                },
                                restart: {
                                    processFound: false,
                                    processInput: '',
                                    process: false,
                                },
                                keywordCount: 0,
                                locationCount: 0,
                                locationArray: []
                            }
                            Object.keys(GLOBAL).forEach((k) => GLOBAL[k] = initialValues[k])
                        }
                        else if (GLOBAL.restart.processInput.match(/^[Nn]$/)) {
                            console.log(`\x1b[32mPress CTRL+C to close.`)
                            GLOBAL.restart.process = false;
                            rl.close();
                        }
                        GLOBAL.restart.processFound = true;
                    }
                    else {
                        console.log("\x1b[31m" + 'Incorrect input. Please input y/Y or n/N');
                    }
                }
            }
            break;
        case 'config': {
            while (!GLOBAL.scrapeFacebook.processFound) {
                GLOBAL.scrapeFacebook.processInput = await prompt(`\n\x1b[32mScrape facebook links found in websites?\x1b[37m Y/N: `);
                if (GLOBAL.scrapeFacebook.processInput.match(/^[YNyn]$/)) {
                    if (GLOBAL.scrapeFacebook.processInput.match(/^[Yy]$/)) {
                        GLOBAL.scrapeFacebook.process = true;
                    }
                    else {
                        GLOBAL.scrapeFacebook.process = false;
                    }
                    GLOBAL.scrapeFacebook.processFound = true;
                }
                else {
                    console.log("\x1b[31m" + 'Incorrect input. Please input y/Y or n/N');
                }
            }
            while (!GLOBAL.scrapeNameTitle.processFound) {
                GLOBAL.scrapeNameTitle.processInput = await prompt(`\n\x1b[32mFind names of people associated with the business?\x1b[37m Y/N: `);
                if (GLOBAL.scrapeNameTitle.processInput.match(/^[YNyn]$/)) {
                    if (GLOBAL.scrapeNameTitle.processInput.match(/^[Yy]$/)) {
                        GLOBAL.scrapeNameTitle.process = true;
                    }
                    else {
                        GLOBAL.scrapeNameTitle.process = false;
                    }
                    GLOBAL.scrapeNameTitle.processFound = true;
                }
                else {
                    console.log("\x1b[31m" + 'Incorrect input. Please input y/Y or n/N');
                }
            }
        }
            break;
        case 'start':
            {
                while (!GLOBAL.start.processFound) {
                    console.log(`\n\x1b[32mProcess will be started with these settings\x1b[37m`)
                    console.log(`Number of Keywords found in keywords.json:\x1b[32m${GLOBAL.keywordCount}\x1b[37m`)
                    console.log(`Number of Locations found in locations.json:\x1b[32m${GLOBAL.locationCount}\x1b[37m`)
                    console.log(`Expected number of results:\x1b[32m${GLOBAL.locationCount * GLOBAL.keywordCount * 120}\x1b[37m`)
                    console.log(`Scrape facebook:\x1b[32m${GLOBAL.scrapeFacebook.process}\x1b[37m`)
                    console.log(`Find people associated with business:\x1b[32m${GLOBAL.scrapeNameTitle.process}\x1b[37m`)
                    // console.log(`Estimated time to scrape:\x1b[32m${totalTime()}s\x1b[37m`)
                    GLOBAL.start.processInput = await prompt("\x1b[32m" + `\nStart the Scraping?\x1b[37m Y/N: `);
                    if (GLOBAL.start.processInput.match(/^[YNyn]$/)) {
                        if (GLOBAL.start.processInput.match(/^[Yy]$/)) {
                            GLOBAL.start.process = true;
                        }
                        else {
                            GLOBAL.start.process = false;
                        }
                        GLOBAL.start.processFound = true;
                    }
                    else {
                        console.log("\x1b[31m" + 'Incorrect input. Please input y/Y or n/N');
                    }
                }
            }
            break;
        default:
            break;
    }
}
async function joinData(toJoin, joinWith, joinBy) {
    const jointData = joinWith
        .filter((obj1) => joinWith.some((obj2) => obj1[joinBy] === obj2[joinBy]))
        .map((obj1) => ({
            ...obj1,
            ...toJoin.find((obj2) => obj1[joinBy] === obj2[joinBy])
        }));
    return jointData;
}
async function writeDataToExcel(resultData, location) {
    console.log(`\x1b[37mWriting file to:`, `${location.outputPath}/${location.outputName}\x1b[37m`)
    const headers = Object.keys(
        resultData[0]);
    const aoaData = [[]];
    resultData.map((obj) => {
        aoaData.push(Object.values(obj));
    });
    await downloadFormatted(headers, aoaData, location);
}
async function downloadFormatted(headerArray, data, location) {
    headerArray.forEach((header) => {
        data[0].push({
            v: `${header}`,
            t: "s",
            s: {
                font: { bold: true, color: { rgb: "FFFFFFFF" } },
                fill: { fgColor: { rgb: "FF7B68EE" } },
                border: {
                    top: { style: "medium", color: { rgb: "FF7B68EE" } },
                    bottom: { style: "medium", color: { rgb: "FF7B68EE" } },
                    left: { style: "medium", color: { rgb: "FF7B68EE" } },
                    right: { style: "medium", color: { rgb: "FF7B68EE" } },
                },
                alignment: { wrapText: true },
            },
        });
    });
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet);
    await createDir(location.outputPath);
    xlsx.writeFile(workbook, `${location.outputPath}/${location.outputName}`);
    console.log('\x1b[32mXLSX file has been created!\x1b[37m')
}
async function createDir(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true }, err => { console.log("Error creating path", err) });
    }
}
function normalizeArrayOfObjects(arr) {
    if (arr.length === 0) {
        return arr;
    }
    // Get the highest number of keys from all objects in the array
    let maxKeys = 0;
    for (const obj of arr) {
        const numKeys = Object.keys(obj).length;
        if (numKeys > maxKeys) {
            maxKeys = numKeys;
        }
    }
    // Create an array of keys with the highest number of keys
    const keys = [];
    for (const obj of arr) {
        for (const key of Object.keys(obj)) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
    }
    // Update each object in the array with the same keys
    for (let i = 0; i < arr.length; i++) {
        const obj = arr[i];
        for (const key of keys) {
            if (!obj.hasOwnProperty(key)) {
                obj[key] = "";
            }
        }
    }
    return arr;
}

async function main() {
    await userIO('Initialise')
    // const result = await nameTitleScraper(['hjeffcoat@burtonadvertising.com', 'impallari@gmail.com', 'blanders@oakwood.edu', 'heather@heatherjeffcoatpr.com'])
    // console.log("result", result)
    try {
        for (; ;) {
            while (!GLOBAL.restart.process) {

                //set location and keyword count once locationarray is populated
                GLOBAL.locationCount = locationArray.length
                GLOBAL.keywordCount = keywordsJSON.keywords.length
                //ask user if everything is ok and proceed
                await userIO('config')
                await userIO('start')
                if (GLOBAL.start.process) {
                    var finalData = [];
                    //Run the main loop for each location
                    for (const idx in locationArray) {
                        const location = locationArray[idx]
                        const request = { ...location, keywords: keywordsJSON.keywords }

                        //run google maps scraper
                        console.log(`\n\x1b[37mStarted scraping Google Maps for \x1b[35m${request.country}, ${request.state}, ${request.city}\x1b[37m, please wait...\x1b[37m`);
                        var sTimeMaps = performance.now();
                        const scrapedData = await mapsScraper(request);
                        var eTimeMaps = performance.now()
                        console.log("\x1b[32m" + `Done scraping Google Maps for ${request.city}! TTC:${((eTimeMaps - sTimeMaps) / 1000).toFixed(2)}s\x1b[37m`)

                        //extract websites from the results
                        const websiteExtract = scrapedData
                            .filter((result) => result.website)
                            .map((result) => result.website);
                        // websiteExtract.length = 10
                        //run email and contact scraper
                        console.log('\n\x1b[37mStarted scraping email and contacts on:', websiteExtract.length, "websites, please wait...")
                        var sTimeEnc = performance.now();
                        const encData = await emailContactsScraper(websiteExtract)
                        var eTimeEnc = performance.now();
                        console.log(`\x1b[32mDone scraping Email and Contacts for ${location.city}! TTC:${((eTimeEnc - sTimeEnc) / 1000).toFixed(2)}s\x1b[37m`)
                        fs.writeFileSync('Logs/encData.json', JSON.stringify(encData))


                        // full outer join on encData and scrapedData by website
                        finalData = await joinData(encData, scrapedData, 'website')

                        if (GLOBAL.scrapeNameTitle.process) {
                            //extract emails from finalData
                            const emailExtract = finalData
                                .filter((result) => result.emails)
                                .map((result) => result.emails);
                            // emailExtract.length = 10

                            //run name title scraper
                            console.log('\n\x1b[37mStarted scraping names for:', emailExtract.length, "emails, please wait...")
                            var sTimeNt = performance.now();
                            const nTData = await nameTitleScraper(emailExtract);
                            var eTimeNt = performance.now();
                            console.log(`\x1b[32mDone scraping names for ${location.city}! TTC:${((eTimeNt - sTimeNt) / 1000).toFixed(2)}s\x1b[37m`)
                            fs.writeFileSync('Logs/ntData.json', JSON.stringify(nTData));
                            // full outer join on nTData and finalData by website
                            finalData = await joinData(nTData, finalData, 'emails')
                            finalData = await normalizeArrayOfObjects(finalData);
                            fs.writeFileSync('Logs/finalData1.json', JSON.stringify(finalData));
                        }

                        if (GLOBAL.scrapeFacebook.process) {
                            //extract fbLinks from finalData
                            const fbLinksExtract = finalData
                                .filter((result) => result.facebookLinks)
                                .map((result) => result.facebookLinks);
                            // fbLinksExtract.length = 10
                            // console.log("fbLinksExtract", fbLinksExtract)

                            //run name title scraper
                            console.log('\n\x1b[37mStarted scraping facebook for:', fbLinksExtract.length, "facebook links, please wait...")
                            var sTimeFb = performance.now();
                            const fBData = await facebookScraper(fbLinksExtract);
                            var eTimeFb = performance.now();
                            console.log(`\x1b[32mDone scraping facebook for ${location.city}! TTC:${((eTimeFb - sTimeFb) / 1000).toFixed(2)}s\x1b[37m`)
                            fs.writeFileSync('Logs/fbData.json', JSON.stringify(fBData));

                            // full outer join on nTData and finalData by fblinks
                            finalData = await joinData(fBData, finalData, 'facebookLinks')
                            finalData = await normalizeArrayOfObjects(finalData);
                            fs.writeFileSync('Logs/finalData2.json', JSON.stringify(finalData));
                        }
                        //write the data to excel to file output/<country>/<state>/<city>.xlsx
                        const outputPath = `./output/${location.country}/${location.state}`
                        const outputName = `${location.city}.xlsx`
                        await writeDataToExcel(finalData, { outputPath, outputName });
                    }

                } else {
                    GLOBAL.restart.process = true;
                }
            }
            await userIO('restart');
        }
    } catch (error) {
        console.log('Main function:', error, 'Please restart the process.')
    }
}
main()
rl.on('close', () => process.exit(0));




