import { scrapeWebsite } from './scraper.js'

const urls = ['https://webflow.com']
const limit = 10
scrapeWebsite({ urls, limit, userId: 'test-123', dataStoreId: 5555 })
