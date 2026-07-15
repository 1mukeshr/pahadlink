import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'

async function seed() {
  await connectDB()

  const email = process.env.ADMIN_EMAIL || 'admin@pahadlink.com'
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  let user = await User.findOne({ $or: [{ email }, { username }] })

  if (user) {
    user.role = 'admin'
    user.password = password
    await user.save()
    console.log(`Updated existing user to admin: ${username}`)
  } else {
    user = await User.create({
      name: 'PahadLink Admin',
      email,
      username,
      password,
      role: 'admin',
    })
    console.log(`Created admin user: ${username}`)
  }

  console.log({
    database: 'Pahadi_link',
    email,
    username,
    password,
    role: user.role,
  })

  await disconnectDB()
}

seed().catch((err) => {
  console.error(err.message || err)
  console.error('Tip: Make sure MongoDB is running on your PC.')
  process.exit(1)
})
