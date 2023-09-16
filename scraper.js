import os from 'os'
import dotenv from 'dotenv'
import { Storage } from '@google-cloud/storage'
import { PlaywrightCrawler, Configuration, downloadListOfUrls } from 'crawlee'

dotenv.config()

const projectId = process.env.GCLOUD_PROJECT_ID
const bucketName = process.env.GCLOUD_STORAGE_BUCKET

const storage = new Storage({ projectId })
const bucket = storage.bucket(bucketName)

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

export async function fetchLinks(url) {
  const domainName = extractDomain(url)
  const links = (await downloadListOfUrls({ url })).filter((link) =>
    link.includes(domainName),
  )

  console.log(links)
  return links
}

export async function scrapeWebsite(urls, limit, dataStoreId) {
  const reqLimit = parseInt(limit) || 10

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

        const url = new URL(request.url)
        const hostname = url.hostname
        const pathname =
          url.pathname.substring(1).replace(/\s+|\//g, '-') || 'index'

        const fileName = `${dataStoreId}/${hostname}/${pathname}`
        const newFile = bucket.file(fileName)

        await newFile.save(pageContent, {
          metadata: {
            dataStoreId,
            contentType: 'text/html',
          },
        })

        await enqueueLinks({
          limit: 30,
        })
        return pageContent
      },
    },
    config,
  )

  console.log(urls)
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

function extractHostname(url) {
  // The regular expression to match the hostname in a URL
  const regex = /^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i

  // Executing the regex on the given URL
  const match = url.match(regex)

  // Extracting the match if it exists
  if (match && match[1]) {
    return match[1]
  } else {
    return null
  }
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

function removeHttp(url) {
  return url.replace(/^https?:\/\//, '')
}
