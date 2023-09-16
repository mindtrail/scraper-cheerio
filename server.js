import express from 'express'

import { scrapeWebsite, fetchLinks } from './scraper.js'

// Constants
const PORT = 80

// App
const app = express()

app.get('/', async (req, res) => {
  // Get req params
  const { urls, limit, dataStoreId } = req.query

  const urlsToScrape = typeof urls === 'string' ? [urls] : urls

  console.log(1112222, urlsToScrape)
  // if valid url -> otherwise add https://
  if (!urlsToScrape?.length) {
    // 400 Bad Request
    return res.status(400).json({
      message: 'Missing url query parameter',
    })
  }

  const result = await scrapeWebsite(urlsToScrape, limit, dataStoreId)
  res.json({
    message: `Scraped ${urlsToScrape}`,
    data: result,
  })
})

app.get('/links', async (req, res) => {
  // Get req params
  const { url } = req.query

  // if valid url -> otherwise add https://
  if (!url) {
    // 400 Bad Request
    return res.status(400).json({
      message: 'Missing url query parameter',
    })
  }

  const result = await fetchLinks(url)
  res.json({
    message: `Fetched links from ${url}`,
    data: result,
  })
})

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`)
})
