import mongoose from 'mongoose'

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/Pahadi_link'

export function getMongoUri() {
  return process.env.MONGODB_URI || DEFAULT_URI
}

export async function connectDB() {
  const uri = getMongoUri()

  mongoose.set('strictQuery', true)

  await mongoose.connect(uri)

  const { host, port, name } = mongoose.connection
  console.log(`MongoDB connected → ${host}:${port}/${name}`)

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })

  return mongoose.connection
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
