import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/User.js'

async function seed() {
  await connectDB()

  const email = process.env.SELLER_EMAIL || 'seller@pahadlink.com'
  const username = process.env.SELLER_USERNAME || 'seller'
  const password = process.env.SELLER_PASSWORD || 'seller123'

  let user = await User.findOne({ $or: [{ email }, { username }] })

  if (user) {
    user.role = 'seller'
    user.password = password
    await user.save()
    console.log(`Updated existing user to seller: ${username}`)
  } else {
    user = await User.create({
      name: 'PahadLink Seller',
      email,
      username,
      password,
      role: 'seller',
    })
    console.log(`Created seller user: ${username}`)
  }

  console.log({
    database: 'Pahadi_link_DB',
    email,
    username,
    password,
    role: user.role,
  })

  await disconnectDB()
}

seed().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
