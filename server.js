import express from 'express'
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} from 'firebase-admin/firestore'

import { scrapeWebsite, fetchLinks } from './scraper.js'

// Constants
const PORT = 80
const WEBSITES_COLLECTION = 'scraped-websites'

// App
const app = express()
initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()

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

  const result = await scrapeWebsite(payload)
  await db
    .collection(WEBSITES_COLLECTION)
    .doc(dataStoreId)
    .set({ ...payload, result, created: new Date(), status: 'synched' })

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

  // Add the collection to the database
})

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`)
})
