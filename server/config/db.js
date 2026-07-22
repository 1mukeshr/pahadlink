import mongoose from 'mongoose'
import { fileUserStore } from '../store/fileUserStore.js'

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/Pahadi_link'
const DEFAULT_DB_NAME = 'Pahadi_link'

export function getMongoUri() {
  return process.env.MONGODB_URI || DEFAULT_URI
}

export function getMongoDbName() {
  return process.env.MONGODB_DB || DEFAULT_DB_NAME
}

export function isFileDbMode() {
  return fileUserStore.enabled
}

/**
 * Connect to MongoDB. In production, fall back to file DB if Mongo is unreachable
 * so login/register still work on hosted API without Atlas.
 */
export async function connectDB() {
  const forceFile =
    process.env.USE_FILE_DB === '1' ||
    process.env.USE_FILE_DB === 'true'

  if (forceFile) {
    fileUserStore.enable()
    console.warn('USE_FILE_DB=true — using file user store (orders need Mongo).')
    return null
  }

  const uri = getMongoUri()
  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(uri, {
      dbName: getMongoDbName(),
      serverSelectionTimeoutMS: 8000,
    })

    const { host, port, name } = mongoose.connection
    console.log(`MongoDB connected → ${host}:${port}/${name}`)

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err.message)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
    })

    return mongoose.connection
  } catch (error) {
    const allowFallback =
      process.env.ALLOW_FILE_DB_FALLBACK !== '0' &&
      process.env.ALLOW_FILE_DB_FALLBACK !== 'false'

    if (allowFallback) {
      console.warn(`MongoDB unavailable (${error.message}). Falling back to file user store.`)
      fileUserStore.enable()
      return null
    }

    throw error
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
