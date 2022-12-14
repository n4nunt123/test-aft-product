const { MongoClient } = require('mongodb')

const url = process.env.MONGODB_ATLAS
const dbName = 'testAseanFT'
let dbConnection

const client = new MongoClient(url)

const connection = async () => {
  try {
    await client.connect()
    const database = client.db(dbName)
    dbConnection = database
    return database
  } catch (err) {
    await client.close()
    return err
  }
}

const connectdb = () => {
  return dbConnection
}

module.exports = { connectdb, connection }
