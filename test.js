import { PlaywrightCrawler, Configuration } from 'crawlee'

const congig = Configuration.getGlobalConfig()
// MOST IMPORTANT THING FOR RUNNING ON AWS LAMBDA / EC2 / FARGATE (Docker)
congig.set({ disableBrowserSandbox: true })

const crawler = new PlaywrightCrawler({
  launchContext: {
    launchOptions: {
      headless: true,
      executablePath: '/usr/bin/brave-browser',
    },
  },
  // Use the requestHandler to process each of the crawled pages.
  requestHandler: async ({ request, page, enqueueLinks, log }) => {
    const title = await page.title()

    const pageContent = await page.content()
    log.info(`Title of ${request.loadedUrl} is '${title}'`)

    return pageContent
  },
})

console.time('Crawl')
// Add first URL to the queue and start the crawl.
const res = await crawler.run(['https://teleporthq.io'])
console.timeEnd('Crawl')

console.log(res)
