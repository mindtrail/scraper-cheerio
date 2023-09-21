import express from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'

import { scrapeWebsite, fetchLinks } from './scraper.js'

dotenv.config()

const PORT = 80
const app = express()
app.use(bodyParser.json())

app.post('/', async (req, res) => {
  const payload = await req.body
  const { urls } = payload

  console.log('Payload', payload)

  if (!urls?.length) {
    console.log('Missing urls', urls)
    return res.status(400).json({
      message: 'Missing urls',
    })
  }

  res.json({
    message: `Scraping started on: ${urls}`,
  })

  await scrapeWebsite(payload)
})

app.get('/links', async (req, res) => {
  // Get req params
  const { url } = req.query

  if (!url) {
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
