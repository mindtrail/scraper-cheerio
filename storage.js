import { Storage } from '@google-cloud/storage'
import dotenv from 'dotenv'

dotenv.config()

const bucketName = process.env.GCLOUD_STORAGE_BUCKET

// If ran outside of GCP, project ID is required - probably it would work locally..
const storage = new Storage()
const bucket = storage.bucket(bucketName)

export async function storeToGCS(props) {
  const { html, userId, url: requestUrl, ...metadata } = props

  if (!html || !userId || !requestUrl) {
    return
  }

  console.log('Storing to GCS', requestUrl)

  try {
    const url = new URL(requestUrl)
    const hostname = url.hostname
    let pathname = url.pathname.substring(1).replace(/\s+|\//g, '-') || 'index'
    pathname = pathname.endsWith('-') ? pathname.slice(0, -1) : pathname

    if (!hostname) {
      return
    }

    const gcFile = `${userId}/${hostname}/${pathname}`
    const newFile = bucket.file(gcFile)

    await newFile.save(html)
    await newFile.setMetadata({
      contentType: 'text/html',
      metadata: {
        ...metadata,
        url: requestUrl,
      },
    })

    // We return the file name to be sent back to the App
    return gcFile
  } catch (err) {
    console.log(err)
    return null
  }
}
