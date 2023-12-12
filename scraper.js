import { CheerioCrawler, Configuration, downloadListOfUrls } from 'crawlee'
import { storeToGCS } from './storage.js'

const SITEMAP_DEFAULT_LOCATION = '/sitemap.xml'
const MAX_LIMIT = 9999

export async function scrapeWebsite({
  urls,
  limit,
  userId,
  autoDetectSitemap = true,
}) {
  const reqLimit = parseInt(limit) || MAX_LIMIT
  let scrapingIndex = 0

  const scrappedWebsites = []

  const config = new Configuration({
    // IMPORTANT for running on AWS / EC2 / Gcloud... etc
    disableBrowserSandbox: true,
    defaultRequestQueueId: generateRandomID(10), // Add a new queue avoid conflicts
    persistStateIntervalMillis: 1000 * 5, // 5 seconds
    availableMemoryRatio: 0.85,
  })

  const crawler = new CheerioCrawler(
    {
      maxRequestRetries: 1,
      maxRequestsPerCrawl: reqLimit,
      requestHandler: async ({ crawler, request, $, enqueueLinks }) => {
        const { url } = request

        // Even if the crawler reaches the reqeust limit, it still processes queued request.
        if (scrapingIndex >= reqLimit) {
          return
        }

        scrapingIndex++

        if (scrapingIndex % 20 === 0) {
          console.log('--- >', url)
        }

        const title = $('head title')?.text()
        const description = $('meta[name="description"]')?.attr('content')
        const image = $('meta[property="og:image"]')?.attr('content')

        const html = $('html')?.html()

        if (!title) {
          const titleSimple = $('title')?.text()

          if (!titleSimple || titleSimple.includes('404')) {
            console.log('404 - Not scraping')
            return
          }
        }

        const payload = {
          description,
          image,
          title,
          url,
        }

        if (html) {
          const fileOnGCS = await storeToGCS({ userId, html, ...payload })

          if (fileOnGCS) {
            scrappedWebsites.push({
              fileName: fileOnGCS,
              metadata: payload,
            })
          }
        }

        await enqueueLinks({
          strategy: 'same-domain',
        })

        // For sitemaps, we need to extract the links as the crawler doesn't enqueue them automatically
        if (url.includes('sitemap')) {
          const sitemapLinks = await getLinksFromSitemap(url)

          if (sitemapLinks?.length) {
            console.log('Sitemap links', sitemapLinks)
            await crawler.addRequests(sitemapLinks)
          }
        }
      },
    },
    config,
  )

  await crawler.addRequests(urls)

  if (autoDetectSitemap && reqLimit === MAX_LIMIT) {
    const sitemapLocations = getSitemapLocations(urls)
    await crawler.addRequests(sitemapLocations)
  }

  // Add first URL to the queue and start the crawl.
  console.time(`Crawl duration ${urls.join('&')}`)
  await crawler.run()
  await crawler.requestQueue.drop()
  console.timeEnd(`Crawl duration ${urls.join('&')}`)

  return scrappedWebsites
}

function getSitemapLocations(urls) {
  const sitemapLocations = []
  urls.forEach((url) => {
    const { origin } = new URL(url)
    sitemapLocations.push(`${origin}${SITEMAP_DEFAULT_LOCATION}`)
  })

  return sitemapLocations
}

async function getLinksFromSitemap(url) {
  const { hostname } = new URL(url)

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
