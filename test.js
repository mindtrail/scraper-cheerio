import { scrapeWebsite } from './scraper.js'

const urls = [
  'https://www.fuer-gruender.de/sitemap.xml?page=1&sitemap=pages&cHash=701d4ab979e9dec0bc1b934d14c4da77',
]
const limit = 1000
scrapeWebsite({ urls, limit, userId: 'test-123', dataStoreId: 5555 })
