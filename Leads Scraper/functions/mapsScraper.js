const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { performance } = require('perf_hooks')
puppeteer.use(StealthPlugin());


exports.mapsScraper = async function (request) {
  try {

    const result = []
    for (let index = 0; index < request.keywords.length; index++) {
      const keyword = request.keywords[index];
      const buffer = await getLocalPlacesInfo(`${keyword} in ${request.city} ${request.state} ${request.country}`, `@${request.lat},${request.lng},12z`, request.language);
      buffer.forEach((element) => {
        result.push(element);
      })
    }
    const dedupedResult = [...new Map(result.map(v => [v.title, v])).values()]

    return dedupedResult;
  } catch (error) {
    console.log(error)
  }
}
async function scrollPage(page, scrollContainer) {
  let lastHeight = await page.evaluate(
    `document.querySelector("${scrollContainer}").scrollHeight`
  );

  while (true) {
    await page.evaluate(
      `document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`
    );
    await page.waitForTimeout(5000);
    let newHeight = await page.evaluate(
      `document.querySelector("${scrollContainer}").scrollHeight`
    );
    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
  }
}

async function fillDataFromPage(page, query) {
  const dataFromPage = await page.evaluate((query) => {
    return Array.from(document.querySelectorAll(".bfdHYd")).map((el) => {
      const placeUrl = el.parentElement.querySelector(".hfpxzc")
        ? el.parentElement.querySelector(".hfpxzc").getAttribute("href")
        : "";
      const urlPattern =
        /!1s(?<id>[^!]+).+!3d(?<latitude>[^!]+)!4d(?<longitude>[^!]+)/gm; // https://regex101.com/r/KFE09c/1
      const dataId = [...placeUrl.matchAll(urlPattern)].map(
        ({ groups }) => groups.id
      )[0];
      const latitude = [...placeUrl.matchAll(urlPattern)].map(
        ({ groups }) => groups.latitude
      )[0];
      const longitude = [...placeUrl.matchAll(urlPattern)].map(
        ({ groups }) => groups.longitude
      )[0];
      const pageDetails = {
        query,
        title: el.querySelector(".qBF1Pd")
          ? el.querySelector(".qBF1Pd").textContent.trim()
          : "",
        rating: el.querySelector(".MW4etd")
          ? el.querySelector(".MW4etd").textContent.trim()
          : "",
        reviews: el.querySelector(".UY7F9")
          ? el
            .querySelector(".UY7F9")
            .textContent.replace("(", "")
            .replace(")", "")
            .trim()
          : "",
        type: el.querySelector(
          ".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:first-child"
        )
          ? el
            .querySelector(
              ".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:first-child"
            )
            .textContent.replaceAll("·", "")
            .trim()
          : "",
        address: el.querySelector(
          ".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:last-child"
        )
          ? el
            .querySelector(
              ".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:last-child"
            )
            .textContent.replaceAll("·", "")
            .trim()
          : "",
        openState: el.querySelector(
          ".W4Efsd:last-child > .W4Efsd:nth-of-type(2) > span:nth-child(1)"
        )
          ? el
            .querySelector(
              ".W4Efsd:last-child > .W4Efsd:nth-of-type(2) > span:nth-child(1)"
            )
            .textContent.replaceAll("·", "")
            .trim()
          : "",
        phone: el.querySelector(
          ".W4Efsd:last-child > .W4Efsd:nth-of-type(2) > span:nth-child(2)"
        )
          ? el
            .querySelector(
              ".W4Efsd:last-child > .W4Efsd:nth-of-type(2) > span:nth-child(2)"
            )
            .textContent.replaceAll("·", "")
            .trim()
          : "",
        website: el.querySelector("a[data-value]")
          ? el.querySelector("a[data-value]").getAttribute("href")
          : "",
        description: el.querySelector(
          ".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:first-child"
        )
          ? el
            .querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:first-child")
            .textContent.replace("·", "")
            .trim()
          : "",
        serviceOptions: el.querySelector(".qty3Ue")
          ? el
            .querySelector(".qty3Ue")
            .textContent.replaceAll("·", "")
            .replaceAll("  ", " ")
            .trim()
          : "",

        latitude,
        longitude,
        placeUrl,
        dataId,
      };
      return pageDetails
    });
  }, query);
  return dataFromPage;
}

async function getLocalPlacesInfo(query, coordinates, hl = "en") {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const queryURI = encodeURI(query);
    const URL = `http://google.com/maps/search/${queryURI}/${coordinates}?hl=${hl}`;
    // await page.setDefaultNavigationTimeout(60000);
    await page.goto(URL);

    await page.waitForNavigation();

    const scrollContainer = ".m6QErb[aria-label]";

    const localPlacesInfo = [];

    await page.waitForTimeout(2000);

    await scrollPage(page, scrollContainer);
    localPlacesInfo.push(...(await fillDataFromPage(page, query)));

    await browser.close();

    return localPlacesInfo;
  } catch (err) {
    // if (err instanceof TimeoutError) {
    // throw new Error('Please check your internet, or check if you are getting recaptcha when visiting google websites. If you are then change your IP address!')
    // }
    // else{  
    console.log()
    // }
  }
}

