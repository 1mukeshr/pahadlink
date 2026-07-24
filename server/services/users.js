import mongoose from 'mongoose'
import UserModel from '../models/User.js'
import { fileUserStore } from '../store/fileUserStore.js'

/**
 * Prefer a live Mongo connection whenever available.
 * File store is only used when Mongo is down and fallback was enabled —
 * otherwise register/login can "succeed" in a local file and never hit Atlas.
 */
function usingFileStore() {
  if (mongoose.connection.readyState === 1) return false
  return fileUserStore.enabled
}

export function getAuthStoreMode() {
  if (mongoose.connection.readyState === 1) return 'mongo'
  if (fileUserStore.enabled) return 'file'
  return 'unavailable'
}

export const users = {
  async findOne(query, options = {}) {
    if (usingFileStore()) {
      return fileUserStore.findOne(query)
    }
    let q = UserModel.findOne(query)
    if (options.select) q = q.select(options.select)
    return q
  },

  async findById(id) {
    if (usingFileStore()) {
      return fileUserStore.findById(id)
    }
    return UserModel.findById(id)
  },

  async create(payload) {
    if (usingFileStore()) {
      return fileUserStore.create(payload)
    }
    return UserModel.create(payload)
  },

  async findAllSorted() {
    if (usingFileStore()) {
      const list = await fileUserStore.find()
      return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    }
    return UserModel.find().sort({ createdAt: -1 })
  },

  async findByIdAndUpdate(id, update) {
    if (usingFileStore()) {
      const user = await fileUserStore.findById(id)
      if (!user) return null
      Object.assign(user, update)
      user.updatedAt = new Date().toISOString()
      await user.save()
      return user
    }
    return UserModel.findByIdAndUpdate(id, update, { new: true })
  },
}
