import dotenv from 'dotenv'
import { Storage } from '@google-cloud/storage'

dotenv.config()

const bucketName = process.env.GCLOUD_STORAGE_BUCKET

// If ran outside of GCP, project ID is required - probably it would work locally..
const storage = new Storage()
const bucket = storage.bucket(bucketName)

export async function storeToGCS(props) {
  const { pageContent, userId, dataStoreId, requestUrl } = props

  const url = new URL(requestUrl)
  const hostname = url.hostname
  const pathname = url.pathname.substring(1).replace(/\s+|\//g, '-') || 'index'

  const fileName = `${userId}/${dataStoreId}/${hostname}/${pathname}`
  const newFile = bucket.file(fileName)

  try {
    await newFile.save(pageContent)
    await newFile.setMetadata({
      metadata: {
        hostname,
        userId,
        dataStoreId,
      },
    })
  } catch (err) {
    console.log(err)
  }
}
