import express from 'express'
import dotenv from 'dotenv'

import { scrapeWebsite, fetchLinks } from './scraper.js'

dotenv.config()

const env = process.env.NODE_ENV

const PORT = 80
const EMBEDDING_SECRET = process.env.EMBEDDING_SECRET

const EMBEDDING_ENDPOINT =
  env === 'development'
    ? process.env.LOCAL_EMBEDDING_ENDPOINT
    : process.env.EMBEDDING_ENDPOINT

// App
const app = express()

app.get('/', async (req, res) => {
  // Get req params
  const { urls, limit, dataStoreId, userId } = req.query
  const urlsToScrape = typeof urls === 'string' ? [urls] : urls

  // if valid url -> otherwise add https://
  if (!urlsToScrape?.length) {
    // 400 Bad Request
    return res.status(400).json({
      message: 'Missing url query parameter',
    })
  }

  const payload = {
    urls: urlsToScrape,
    limit,
    dataStoreId,
    userId,
  }

  res.json({
    message: `Scraping started on ${urlsToScrape}`,
  })

  await scrapeWebsite(payload)

  const result = await fetch(EMBEDDING_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Secret': EMBEDDING_SECRET, // Custom header
    },
  })

  console.log('Embed API call - App Chat', await result.json())
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

  // Add the collection to the database
})

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`)
})
