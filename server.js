import express from 'express'

import { scrapeWebsite, fetchLinks } from './scraper.js'

// Constants
const PORT = 80

// App
const app = express()

app.get('/', async (req, res) => {
  // Get req params
  const { url, limit } = req.query
  console.log(url)

  // if valid url -> otherwise add https://
  if (url) {
    const result = await scrapeWebsite(url, limit)
  }

  res.send('Hello World - ' + url)
})

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`)
})
