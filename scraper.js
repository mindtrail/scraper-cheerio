import { CheerioCrawler, Configuration, downloadListOfUrls } from 'crawlee'
import { storeToGCS } from './storage.js'

export async function scrapeWebsite({ urls, limit, dataStoreId, userId }) {
  const reqLimit = parseInt(limit) || 9999
  let scrapingIndex = 0

  const config = new Configuration({
    // IMPORTANT for running on AWS / EC2 / Gcloud... etc
    disableBrowserSandbox: true,
    defaultRequestQueueId: generateRandomID(10), // Add a new queue avoid conflicts
    persistStateIntervalMillis: 1000 * 5, // 5 seconds
    availableMemoryRatio: 0.85,
  })

  const crawler = new CheerioCrawler(
    {
      maxRequestsPerCrawl: reqLimit,
      requestHandler: async ({ crawler, request, $, enqueueLinks }) => {
        const { url: requestUrl } = request

        // Even if the crawler reaches the reqeust limit, it still processes queued request.
        if (scrapingIndex > reqLimit) {
          return
        }
        scrapingIndex++

        if (scrapingIndex % 10 === 0) {
          console.log('--->', requestUrl)
        }

        const pageTitle = $('title').text()
        const metaDescription = $('meta[name="description"]').attr('content')

        const content = $('html').html()

        if (content) {
          await storeToGCS({
            content,
            userId,
            dataStoreId,
            requestUrl,
            pageTitle,
            metaDescription,
          })
        }

        await enqueueLinks({
          strategy: 'same-domain',
        })

        // For sitemaps, we need to extract the links as the crawler doesn't enqueue them automatically
        if (requestUrl.includes('sitemap')) {
          const sitemapLinks = await getSitemapLinks(requestUrl)

          if (sitemapLinks?.length) {
            await crawler.addRequests(sitemapLinks)
          }
        }

        return content
      },
    },
    config,
  )

  await crawler.addRequests(urls)

  // Add first URL to the queue and start the crawl.
  console.time(`Crawl duration ${urls.join('&')}`)
  const res = await crawler.run()
  await crawler.requestQueue.drop()
  console.timeEnd(`Crawl duration ${urls.join('&')}`)

  return res
}

async function getSitemapLinks(url) {
  const hostname = new URL(url).hostname
  const links = (await downloadListOfUrls({ url })).filter((link) =>
    link.includes(hostname),
  )

  return links
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

export async function fetchLinks(url) {
  const hostname = new URL(url).hostname
  const links = (await downloadListOfUrls({ url })).filter((link) =>
    link.includes(hostname),
  )

  return links
}

// Sitemap possible locations
const SITEMAP_POSSIBLE_LOCATIONS = [
  '/sitemap.xml',
  '/sitemap/',
  '/sitemap-index.xml',
  '/sitemap_index.xml',
  '/sitemap/sitemap.xml',
  '/sitemapindex.xml',
  '/sitemap/index.xml',
  '/sitemap1.xml',
  '/sitemap.xml.gz',
  '/sitemap.php',
  '/sitemap.txt',
]
