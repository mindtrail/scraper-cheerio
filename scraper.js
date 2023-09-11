import os from 'os'
import { PlaywrightCrawler, Configuration, downloadListOfUrls } from 'crawlee'

const config = new Configuration({
  // MOST IMPORTANT THING FOR RUNNING ON AWS LAMBDA / EC2 / FARGATE (Docker)
  disableBrowserSandbox: true,
  defaultRequestQueueId: generateRandomID(10),
  persistStateIntervalMillis: 1000 * 5, // 5 seconds
  availableMemoryRatio: 0.75,
})

const launchOptions = {
  headless: true,
  ignoreHTTPSErrors: true,
}

// If it's the EC2 Env... it's a quick fix for easier debugging
if (os.platform() === 'linux') {
  launchOptions.executablePath = '/usr/bin/brave-browser' // /usr/bin/brave-browser
}

const crawler = new PlaywrightCrawler(
  {
    launchContext: {
      launchOptions,
    },

    maxRequestsPerCrawl: 150,
    // Use the requestHandler to process each of the crawled pages.
    requestHandler: async ({ request, page, enqueueLinks, log }) => {
      const title = await page.title()

      const pageContent = await page.content()
      log.info(`Title of ${request.loadedUrl} is '${title}'`)

      await enqueueLinks({
        limit: 30,
      })
      return pageContent
    },
  },
  config,
)

const listOfUrls = await downloadListOfUrls({
  url: 'https://www.fuer-gruender.de/sitemap.xml',
})
console.log(listOfUrls)
await crawler.addRequests(listOfUrls)

// Add first URL to the queue and start the crawl.
console.time('Crawl')
const res = await crawler.run()
await crawler.requestQueue.drop()
console.timeEnd('Crawl')

console.log(res)

function generateRandomID(length) {
  const characters = '0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }

  return result
}
