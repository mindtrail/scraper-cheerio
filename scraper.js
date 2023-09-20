import os from 'os'
import { PlaywrightCrawler, Configuration, downloadListOfUrls } from 'crawlee'
import { storeToGCS } from './storage.js'

export async function fetchLinks(url) {
  const domainName = extractDomain(url)
  const links = (await downloadListOfUrls({ url })).filter((link) =>
    link.includes(domainName),
  )

  console.log('URLS TO SCRAPE -- ', links)
  return links
}

export async function scrapeWebsite({ urls, limit, dataStoreId, userId }) {
  const reqLimit = parseInt(limit) || 15

  const config = new Configuration({
    // MOST IMPORTANT THING FOR RUNNING ON AWS LAMBDA / EC2 / FARGATE (Docker)
    disableBrowserSandbox: true,
    defaultRequestQueueId: generateRandomID(10),
    persistStateIntervalMillis: 1000 * 5, // 5 seconds
    availableMemoryRatio: 0.85,
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

      maxRequestsPerCrawl: reqLimit,
      // Use the requestHandler to process each of the crawled pages.
      requestHandler: async ({ request, page, enqueueLinks }) => {
        const pageContent = await page.content()

        console.log('---', page.requestUrl)
        // Store the page content to GCS
        await storeToGCS({
          pageContent,
          userId,
          dataStoreId,
          requestUrl: request.url,
        })

        await enqueueLinks()
        return pageContent
      },
    },
    config,
  )

  await crawler.addRequests(urls)

  // Add first URL to the queue and start the crawl.
  console.time('Crawl')
  const res = await crawler.run()
  await crawler.requestQueue.drop()
  console.timeEnd('Crawl')

  return res
}

function generateRandomID(length) {
  const characters = '0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }

  return result
}

function extractDomain(url) {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?((?:[^\.\/]+\.)*([^\/\.]{2,}\.\w+))/i

  const match = url.match(regex)

  if (match && match[2]) {
    return match[2]
  } else {
    return null
  }
}

// Sitemap possible locations
// /sitemap-index.xml
// /sitemap.php
// /sitemap.txt
// /sitemap.xml.gz
// /sitemap/
// /sitemap/sitemap.xml
// /sitemapindex.xml
// /sitemap/index.xml
// /sitemap1.xml
// /sitemap_index.xml
// /sitemap.xml
