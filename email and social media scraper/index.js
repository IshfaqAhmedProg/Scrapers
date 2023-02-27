import puppeteer from 'puppeteer';
import * as XLSX from 'sheetjs-style';
import { performance } from 'perf_hooks';
import parsePhoneNumber from 'libphonenumber-js'
//User provided constants 
const MAX_CHILD_NODES = 1;
const REQUEST = [
    // "https://www.scrapefox.vercel.app/",
    // "https://bdswimmingpool.com/",
    // "https://www.nidirect.gov.uk/",
    // "https://sblpools.com/",
    // "https://www.greenscenelandscape.com/",
    // "https://www.encorepoolsla.com/",
    // "https://www.executivepools.org/",
    // "https://calimingo.com/",
    // "https://californiapools.com/locations/",
    // "https://custommojavepool.com/",
    "http://www.murphypoolsandspas.com/",
    "http://www.alanjacksonpools.com/",
    "http://www.edpoolandspa.com/",
    // http://www.bigjohnspools.com/
    // https://sblpools.com/
    // http://poolbosscorp.com/
    // http://www.camposcustomconcrete.com/
    // https://www.greenscenelandscape.com/
    // https://www.encorepoolsla.com/
    // http://sbwpoolsinc.com/
    // https://www.executivepools.org/
    // https://calimingo.com/
    // https://californiapools.com/locations/santa-clarita?utm_source=google&utm_medium=organic&utm_campaign=gmb&utm_content=santaclarita
    // https://custommojavepool.com/
    // http://www.horusicky.com/
    // https://aquamanwest.com/
    // http://www.sunsetpoolscustomdesigns.com/
    // http://gotsplash.com/
    // http://temeculavalleycustompools.com/

]
const refinedData = [];
const allData = [];
class DataMatch {
    constructor(_name, _displayName, _type, _regExp) {
        this.name = _name;
        this.type = _type;
        this.displayName = _displayName;
        this.regexp = _regExp;
        this.matchArray = [];
        this.featureData = [];
        this.headers = { allData: _displayName, refinedData1: [_displayName, "Other " + _displayName + " Found"] };
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
                    return extractedDataArray;
                }
                break;
            default:
                break;
        }
    }
    // static {
    //     this.refinedData = [];
    //     this.allData = [[]];
    // }
    static styleHeader(headerArray, data) {
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
            });
        });
    }

    static getAllDataAsArray() {
        let allDataArray = []
        allData.forEach(data => {
            allDataArray.push(Object.keys(data).map((k) => {
                if (Array.isArray(data[k]))
                    return data[k] = data[k].toString()
                return data[k];
            }))
        });
        return allDataArray;
    }
    static setAllData(_data) {
        allData.push(_data);
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
    const browser = await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true });
    const page = await browser.newPage();

    await page.goto(urlToScrape, {
        waitUntil: "domcontentloaded",
    }).catch(err => console.log("goto", err))
    // page.waitForNetworkIdle({ idleTime: 1000 }),
    const extractedData = {
        rootUrl: rootUrl,
        url: urlToScrape,
    }
    //scrolling to the bottom of the page 216s for 10 URLs with 2 Nodes in headless
    //scrolling to the bottom of the page 337s for 10 URLs with 2 Nodes in headful
    // await autoScroll(page)

    try {
        //populate childlinks
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
        // console.log("childLinks", childLinks)
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
        console.log('The browser timedout!', error)
        await browser.close();
    }
    await browser.close();
    // console.log("extractedData", extractedData);
    DataMatch.setAllData(extractedData)
    // allData.push(Object.values(extractedData))

}
async function refineAllData() {
    //https://stackoverflow.com/questions/60036060/combine-object-array-if-same-key-value-in-javascript
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
                console.log(duplicate[extractor.dataMatch.name])
                duplicate[extractor.dataMatch.name] = [...new Set([...duplicate[extractor.dataMatch.name], ...keys])]
            });
        } else {
            acc.push(curr)
        }
        return acc
    }, [])
    console.log("flattenedData", flattenedData);
    flattenedData.shift();
    flattenedData.forEach((data) => {
        const refinedDataInterface = {
            URL: data.rootUrl,
        }
        extractors.forEach((extractor) => {
            const name = extractor.dataMatch.name;
            const displayName = extractor.dataMatch.displayName;
            refinedDataInterface[displayName] = data[name][0] || '';
            refinedDataInterface["Other" + displayName] = data[name].slice(1).toString();
        })
        refinedData.push(refinedDataInterface);
    })

    console.log("refinedData", refinedData);
}
async function emailAndContactsScraper(ROOT_URLS_TO_SCRAPE) {
    var sTime, eTime, ppsTime, ppeTime = 0;
    sTime = performance.now();
    const workbook = XLSX.utils.book_new();
    //create and style header
    const allDataHeaderNames = [
        'Root URL',
        'Scraped URL',
    ]
    const refinedDataHeaderNames = [
        "URL",
    ]
    extractors.forEach(extractor => {
        allDataHeaderNames.push(extractor.dataMatch.headers.allData);
        refinedDataHeaderNames.push(...extractor.dataMatch.headers.refinedData1);
    })


    for (let index = 0; index < ROOT_URLS_TO_SCRAPE.length; index++) {
        ppsTime = performance.now();

        const rootUrl = ROOT_URLS_TO_SCRAPE[index];
        await extractLinks(rootUrl, rootUrl).then(async () => {
            console.log("childLinks of " + `${rootUrl}`, childLinks)
            for (let i = 0; i < childLinks.length; i++) {
                const childLink = childLinks[i];
                try {
                    await extractLinks(rootUrl, childLink, 'child');
                } catch (error) {
                    continue
                }
            }
        });
        ppeTime = performance.now();
        console.log("allData", allData);
        console.log(`Time taken for ${rootUrl}(${index}):` + ` ${(ppeTime - ppsTime) / 1000}s`)

    }
    await refineAllData()
    console.log("DataMatch.refinedData", refinedData)
    // DataMatch.styleHeader(allDataHeaderNames, DataMatch.allData)
    // DataMatch.styleHeader(refinedDataHeaderNames, DataMatch.refinedData)
    // const allData = DataMatch.getAllDataAsArray()
    // workbook.SheetNames.push("Refined Data");
    // workbook.SheetNames.push("All Data");
    // workbook.Sheets["Refined Data"] = XLSX.utils.aoa_to_sheet(DataMatch.refinedData);
    // workbook.Sheets["All Data"] = XLSX.utils.aoa_to_sheet(allData);
    // XLSX.writeFile(workbook, `check.xlsx`);
    eTime = performance.now();
    console.log("Total time taken:" + ` ${(eTime - sTime) / 1000}s`)

}
emailAndContactsScraper(REQUEST);