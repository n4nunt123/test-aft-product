const { ObjectId } = require('mongodb')
const { connectdb } = require("./config/config")
const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const { Server } = require('socket.io')
const http = require('http');
const { connection } = require('./config/config');
const route = require('./routes/route')

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS']
  }
})

connection()
  .then(() => {
    app.use(route)
    io.on('connection', (socket) => {
      console.log('connected with socket')

      // Transfer data product
      socket.on('send:product', async (data) => {
        try {
          const { productName, quantity, senderId, receiverId } = data
          const sender = await connectdb().collection('test_users_product').findOne({ _id: ObjectId(senderId) })
          const receiver = await connectdb().collection('test_users_product').findOne({ _id: ObjectId(receiverId) })
          if(!sender) throw { message: "Please login first" }
          if(!receiver) throw { message: "Account destination doesn't exist, please try again" }
      
          let itemSender = []
          let itemReceiver = []
          let transferedItem = []
          let isDupe = false
      
          sender.list_products.forEach(el => {
            if(el.quantity < quantity) throw { message: "You don't have enough items" }
            if(el.name === productName) {
              el.quantity = el.quantity - quantity
              if(el.quantity != 0) {
                itemSender.push(el)
                transferedItem.push({ name: el.name, quantity })
              } else {
                transferedItem.push({ name: el.name, quantity })
              }
            } else {
              itemSender.push(el)
            }
          })
      
          if(transferedItem.length === 0) throw { message: "Item doesn't exist" }
      
          receiver.list_products.forEach((el, i) => {
            if(el.name === transferedItem[0].name) {
              el.quantity = el.quantity + transferedItem[0].quantity
              itemReceiver.push(el)
              isDupe = true
            } else {
              itemReceiver.push(el)
            }
          })
      
          if(!isDupe) {
            itemReceiver = itemReceiver.concat(transferedItem)
          }
      
          await connectdb().collection('test_users_product').updateOne(
            { _id: ObjectId(senderId) }, 
            { $set: { list_products: itemSender } }
          )
          await connectdb().collection('test_users_product').updateOne(
            { _id: ObjectId(receiverId) }, 
            { $set: { list_products: itemReceiver } }
          )

          const message = { message: 'Transfer product success' }
          socket.broadcast.emit('receive:product', message)
        } catch (err) {
          socket.broadcast.emit('receive:product', err.message)
        }
      })

      socket.on("disconnect", () => {
        console.log(`connection with socket disconnected`);
      })
    })
    
    server.listen(port, () => console.log('server listening on...', port))
  })
  .catch((err) => {
    console.log('Server refused to connect')
  })