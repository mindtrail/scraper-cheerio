import http from 'http'

const hostname = '127.0.0.1'
const port = 3000

const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Hello World')
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})

export { server }

// console.log('Hello world')
// import puppeteer from 'puppeteer'

// const browser = await puppeteer.launch({
//   executablePath: '/usr/bin/google-chrome',
//   headless: true,
//   args: ['--no-sandbox', '--disable-setuid-sandbox'],
// })

// const URL = 'https://amazon.com'
// const page = await browser.newPage()
// //
// console.log(`Go to ${URL}`)
// //
// await page.goto(URL)
