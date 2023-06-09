const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const items = require('./data/Items.json')
const fakeData = require('./data/DemoData2.json')
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.biy4zxs.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
     const authHeader = req.headers.authorization;
     if(!authHeader){
          return res.status(401).send('unauthorized access')
     }
     const token = authHeader.split(' ')[1]
     jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
          if(err){
               return res.status(403).send({message: 'forbidden access'})
          }
          req.decoded = decoded
          next()
     })
}

async function run() {
     try {
          const itemsCollection = client.db('foodbyt').collection('items')
          const usersCollection = client.db('foodbyt').collection('users')
          const ordersCollection = client.db('foodbyt').collection('orders')
          const shopCollection = client.db('foodbyt').collection('shop')
          const adCollection = client.db('foodbyt').collection('advertisement')


          app.get('/items', async(req, res)=>{
               const query = {}
               const items = await itemsCollection.find(query).toArray()
               res.send(items)
          })

          app.get("/items/:id", async(req, res)=>{
               const id = req.params.id
               const query = {_id: ObjectId(id)}
               const itemsByid = await itemsCollection.findOne(query)
               res.send(itemsByid)
          })

          app.get("/users", async(req, res)=>{
               const query = {}
               const users = await usersCollection.find(query).toArray()
               res.send(users)
          })

          app.get('/orders',verifyJWT, async(req, res)=>{
               const query = {}
               const orders = await ordersCollection.find(query).toArray()
               res.send(orders)
          })

          app.get('/shops', async(req, res)=>{
               const query = {}
               const shops = await shopCollection.find(query).toArray()
               res.send(shops)
          })

          app.get('/advertisement', async(req, res)=>{
               const query = {}
               const ads = await adCollection.find(query).toArray()
               res.send(ads)
          })

          // getting pending order by email 
          app.get('/pendingOrders',verifyJWT, async(req, res)=>{
               const email = req.query.email;
               const decodedEmail = req.decoded.email;
               if(email != decodedEmail){
                    return res.status(403).send({message: 'forbidden access'})
               }
               let query = {}
               if(req.query.email){
                    query = {
                         email: req.query.email,
                         order: 'pending'
                    }
               }
               const pendingOrders = await ordersCollection.find(query).toArray()
               res.send(pendingOrders)
          })

          // all pending orders for admin 
          app.get('/pendingOrderForAdmin',verifyJWT, async(req, res)=>{               
               let query = {}
               if(req.query.order){
                    query = {
                         order: 'pending'
                    }
               }
               const pendingOrders = await ordersCollection.find(query).toArray()
               res.send(pendingOrders)
          })

          // all completed orders for admin 
          app.get('/completedOrderForAdmin', async(req, res)=>{
               let query = {}
               if(req.query.order){
                    query = {
                         order: 'completed'
                    }
               }
               const completedOrders = await ordersCollection.find(query).toArray()
               res.send(completedOrders)
          })

          app.get('/completedOrder', async(req, res)=>{
               let query ={}
               if(req.query.email){
                    query = {
                         email: req.query.email,
                         order: 'completed'
                    }
               }
               const completedOrders = await ordersCollection.find(query).toArray()
               res.send(completedOrders)
          })

          app.get('/user/admin/:email', async(req, res)=>{
               const email = req.params.email;
               const query = {email}
               const user = await usersCollection.findOne(query)
               res.send({isAdmin: user?.role === "admin"})
          })

          // getting jwt token 
          app.get('/jwt', async(req, res)=>{
               const email = req.query.email;
               const query = {email: email}
               const user = await usersCollection.findOne(query)
               if(user){
                    const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
                    return res.send({accessToken: token})
               }g
               res.status(403).send({accessToken: ''})
          })

          app.post('/users', async(req, res)=>{
               const users = req.body;
               const query = {
                    email : users.email
               }
               const alreadyRegister = await usersCollection.find(query).toArray()
               if(alreadyRegister.length){
                    const message = `Welcome back`
                    return res.send({acknowledged: false, message})
               }
               const result = await usersCollection.insertOne(users)
               res.send(result)
          })   

          app.post('/orders', async(req, res)=>{
               const query = req.body;
               const result = await ordersCollection.insertOne(query)
               res.send(result)
          })

          app.put('/orders/:id', async(req, res)=>{
               const id = req.params.id;
               const filter = {_id:ObjectId(id)}
               const option = {upsert: true}
               const updatedDoc = {
                    $set: {
                         order: 'completed'
                    }
               }
               const result = await ordersCollection.updateOne(filter, updatedDoc, option)
               res.send(result)
          })

          app.put('/makePendingOrder', async(req, res)=>{
               const id = req.params.id;
               const filter = {_id: ObjectId(id)}
               const option = {upsert: true}
               const updatedDoc = {
                    $set: {
                         order: 'pending'
                    }
               }
               const result = await ordersCollection.updateOne(filter, updatedDoc, option)
               res.send(result)
          })

          app.put('/user/admin/:id',verifyJWT, async(req, res)=>{
               const decodedEmail = req.decoded.email;
               const query = {email: decodedEmail}
               const user = await usersCollection.findOne(query)
               if(user?.role !== 'admin'){
                    return res.status(403).send({message: 'forbidden access'})
               }
               const id = req.params.id;
               const filter = {_id: ObjectId(id)}
               const option = {upsert: true}
               const updatedDoc = {
                    $set: {
                         role: 'admin'
                    }
               }
               const result = await usersCollection.updateOne(filter, updatedDoc, option)
               res.send(result)
          })

          app.put('/user/makeUser/:id',verifyJWT, async(req, res)=>{
               const decodedEmail = req.decoded.email;
               const query = {email: decodedEmail}
               const user = await usersCollection.findOne(query)
               if(user?.role !== 'admin'){
                    return res.status(403).send({message: 'forbidden access'})
               }
               const id = req.params.id;
               const filter = {_id: ObjectId(id)}
               const option = {upsert: true}
               const updatedDoc = {
                    $set: {
                         role: 'user'
                    }
               }
               const result = await usersCollection.updateOne(filter, updatedDoc, option)
               res.send(result)
          })
     }
     finally {

     }
}
run().catch(err => console.error(err))


app.get('/', async (req, res) => {
     res.send('server is running')
})

app.get('/itemManually', async(req, res)=>{
     res.send(items)
})

app.get('/fakeData', async(req, res)=>{
     res.send(fakeData)
})

app.listen(port, () => {
     console.log(`server is running at ${port} port`)
})