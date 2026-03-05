import { MongoClient, Db } from 'mongodb'

const uri = process.env.DATABASE_URL || ''

console.log('uri', uri);

const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(new Error('DATABASE_URL is not set. Add MongoDB URI to .env.local'))
  }
  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }
    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    return globalWithMongo._mongoClientPromise
  }
  if (!clientPromise) {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
  return clientPromise
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise()
  const dbName = uri.split('/').pop()?.split('?')[0] || 'job-portel'
  return client.db(dbName)
}
