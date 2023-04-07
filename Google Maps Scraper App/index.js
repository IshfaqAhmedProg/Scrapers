"use strict"
var fs = _interopRequireWildcard(require("fs"));
var _promises = require("stream/promises");
var _readline = _interopRequireDefault(require("readline"));
const mapsScraper = require('./functions/mapsScraper')
const emailContactScraper = require('./functions/emailContactScraper')
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
    startProcessFound: false,
    startProcessInput: '',
    startProcess: false,
    restartProcessFound: false,
    restartProcessInput: '',
    restartProcess: false,
    keywordCount: 0,
    locationCount: 0,
}

async function userIO(stage, condition) {
    switch (stage) {
        case 'Initialise': {
            console.log(`
            ██████   ██████   ██████   ██████  ██      ███████     
           ██       ██    ██ ██    ██ ██       ██      ██          
           ██   ███ ██    ██ ██    ██ ██   ███ ██      █████       
           ██    ██ ██    ██ ██    ██ ██    ██ ██      ██          
            ██████   ██████   ██████   ██████  ███████ ███████     
                                                                   
                                                                   
                   ███    ███  █████  ██████  ███████              
                   ████  ████ ██   ██ ██   ██ ██                   
                   ██ ████ ██ ███████ ██████  ███████              
                   ██  ██  ██ ██   ██ ██           ██              
                   ██      ██ ██   ██ ██      ███████              
                                                                   
                                                                   
           ███████  ██████ ██████   █████  ██████  ███████ ██████  
           ██      ██      ██   ██ ██   ██ ██   ██ ██      ██   ██ 
           ███████ ██      ██████  ███████ ██████  █████   ██████  
                ██ ██      ██   ██ ██   ██ ██      ██      ██   ██ 
           ███████  ██████ ██   ██ ██   ██ ██      ███████ ██   ██ 
                                                                                                
           `)
            console.log(`\n\x1b[1m------------------------------\x1b[33mIshfaq Ahmed\x1b[37m--------------------------------`);
            console.log(`-----------------------\x1b[33mGithub: @IshfaqAhmedProg\x1b[37m---------------------------\x1b[0m\n\n\n`);
            console.log("\x1b[1mScrape Google Maps and any email or contacts found on the listings website!\n")
            console.log(`Make sure to check what kind of data is inside!\x1b[0m\n
1)\x1b[32m Make sure the keywords are on the keywords.json file.\x1b[37m
      \x1b[37mFormat\x1b[32m   => {"keywords":["keyword1","keyword2",...]}\x1b[37m\n
2)\x1b[32m To change the locations add it to locations.json file (Set by default to US).\x1b[37m
      \x1b[37mFormat\x1b[32m   => {"Country1":[{"state":"state1","city":"city1","lat":100,"lng":200},...],...}\x1b[37m
            `);
        }
            break;
        case 'restart':
            {
                while (!GLOBAL.restartProcessFound) {
                    GLOBAL.restartProcessInput = await prompt("\x1b[37m" + "\nDo you want to restart the script? Y/N: ");
                    if (GLOBAL.restartProcessInput.match(/^[YNyn]$/)) {
                        if (GLOBAL.restartProcessInput.match(/^[Yy]$/)) {
                            console.log(`\x1b[32mRestarting script!.`)
                            const initialValues = {
                                startProcessFound: false,
                                startProcessInput: '',
                                startProcess: false,
                                restartProcessFound: false,
                                restartProcessInput: '',
                                restartProcess: false,
                                keywordCount: 0,
                                locationCount: 0,
                                locationArray: []
                            }
                            Object.keys(GLOBAL).forEach((k) => GLOBAL[k] = initialValues[k])
                        }
                        else if (GLOBAL.restartProcessInput.match(/^[Nn]$/)) {
                            console.log(`\x1b[32mPress CTRL+C to close.`)
                            GLOBAL.restartProcess = false;
                            rl.close();
                        }
                        GLOBAL.restartProcessFound = true;
                    }
                    else {
                        console.log("\x1b[31m" + 'Incorrect input. Please input y/Y or n/N');
                    }
                }
            }
            break;
        case 'start':
            {
                while (!GLOBAL.startProcessFound) {
                    console.log(`\n\x1b[32mProcess will be started with these settings\x1b[37m`)
                    console.log(`Number of Keywords found in keywords.json:\x1b[32m${GLOBAL.keywordCount}\x1b[37m`)
                    console.log(`Number of Locations found in locations.json:\x1b[32m${GLOBAL.locationCount}\x1b[37m`)
                    console.log(`Expected number of results:\x1b[32m${GLOBAL.locationCount * GLOBAL.keywordCount * 120}\x1b[37m`)
                    GLOBAL.startProcessInput = await prompt("\x1b[37m" + `\nStart the Scraping?\x1b[37m Y/N: `);
                    if (GLOBAL.startProcessInput.match(/^[YNyn]$/)) {
                        if (GLOBAL.startProcessInput.match(/^[Yy]$/)) {
                            GLOBAL.startProcess = true;
                        }
                        else {
                            GLOBAL.startProcess = false;
                        }
                        GLOBAL.startProcessFound = true;
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
async function joinAddonData(toJoin, joinWith, joinBy) {
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
        resultData.sort(
            (a, b) => Object.keys(b).length - Object.keys(a).length
        )[0]
    );
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
async function main() {
    await userIO('Initialise')
    try {
        for (; ;) {
            while (!GLOBAL.restartProcess) {

                //set location and keyword count once locationarray is populated
                GLOBAL.locationCount = locationArray.length
                GLOBAL.keywordCount = keywordsJSON.keywords.length
                //ask user if everything is ok and proceed
                await userIO('start')
                if (GLOBAL.startProcess) {
                    //Run the main loop for each location
                    for (const idx in locationArray) {
                        const location = locationArray[idx]
                        const request = { ...location, keywords: keywordsJSON.keywords }

                        //run google maps scraper
                        const scrapedData = await mapsScraper.scrapeGoogleMaps(request);

                        //extract websites from the results
                        const websiteExtract = scrapedData
                            .filter((result) => result.website !== "")
                            .map((result) => result.website);
                        console.log('\x1b[37mScraping email and contacts on:', websiteExtract.length, "websites")
                        //run email and contact scraper
                        var sTime = performance.now();
                        const encData = await emailContactScraper.emailAndContactsScraper(websiteExtract)
                        var eTime = performance.now();
                        console.log(`\x1b[32mDone scraping Email and Contacts for ${location.city}! TTC:${eTime - sTime}ms\x1b[37m`)

                        //full outer join on encData and scrapedData by website 
                        const finalData = await joinAddonData(encData, scrapedData, 'website')
                        //write the data to excel to file output/<country>/<state>/<city>.csv
                        const outputPath = `./output/${location.country}/${location.state}`
                        const outputName = `${location.city}.csv`
                        await writeDataToExcel(finalData, { outputPath, outputName });

                    }
                } else {
                    GLOBAL.restartProcess = true;
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