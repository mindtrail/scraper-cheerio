import { Storage } from '@google-cloud/storage'
import dotenv from 'dotenv'

dotenv.config()

const bucketName = process.env.GCLOUD_STORAGE_BUCKET

// If ran outside of GCP, project ID is required - probably it would work locally..
const storage = new Storage()
const bucket = storage.bucket(bucketName)

export async function storeToGCS(props) {
  const { content, userId, dataStoreId, requestUrl, ...rest } = props

  const url = new URL(requestUrl)
  const hostname = url.hostname
  let pathname = url.pathname.substring(1).replace(/\s+|\//g, '-') || 'index'
  pathname = pathname.endsWith('-') ? pathname.slice(0, -1) : pathname

  if (!hostname) {
    return
  }

  const fileName = `${userId}/${dataStoreId}/${hostname}/${pathname}`
  const newFile = bucket.file(fileName)

  try {
    await newFile.save(content)
    await newFile.setMetadata({
      contentType: 'text/html',
      metadata: {
        hostname,
        userId,
        dataStoreId,
        ...rest,
      },
    })
  } catch (err) {
    console.log(err)
  }
}
