import express from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'

import { scrapeWebsite, fetchLinks } from './scraper.js'

dotenv.config()

const DATA_SOURCE_URL =
  process.env.NODE_ENV === 'development'
    ? process.env.LOCAL_DATA_SOURCE_URL
    : process.env.DATA_SOURCE_URL

const PORT = 80
const app = express()

app.use(bodyParser.json())

app.post('/', async (req, res) => {
  const body = await req.body
  const { urls, userId, collectionId } = body

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
    const scrapingResult = await scrapeWebsite(body)

    if (!scrapingResult?.length) {
      console.log('No scraping result')
      return
    }

    const dataSourcesPayload = {
      userId,
      collectionId,
      websites: scrapingResult,
    }

    console.log('---- Result to Embed ---- ', dataSourcesPayload)
    createDataSources(dataSourcesPayload)
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

async function createDataSources(scrapingResult) {
  return await fetch(DATA_SOURCE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Secret': process.env.SECRET,
    },
    body: JSON.stringify(scrapingResult),
  })
}
