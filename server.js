import express from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'

import { scrapeWebsite, fetchLinks } from './scraper.js'

dotenv.config()

const EMBEDI_API_URL =
  process.env.NODE_ENV === 'development'
    ? process.env.LOCAL_EMBEDDING_ENDPOINT
    : process.env.EMBEDDING_ENDPOINT

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

  try {
    const scrapingResult = await scrapeWebsite(payload)

    const response = callEmbedingService(scrapingResult)

    console.log(EMBEDI_API_URL)
    console.log(await response.json())
  } catch (e) {
    console.log(e)
  }
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
  // get actual app url
  console.log(`Running on port:${PORT}`)
})

async function callEmbedingService(scrapingResult) {
  return await fetch(EMBEDI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Secret': process.env.EMBEDDING_SECRET,
    },
    body: JSON.stringify(scrapingResult),
  })
}
