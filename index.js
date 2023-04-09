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

async function run() {
     try {
          const itemsCollection = client.db('foodbyt').collection('items')
          const usersCollection = client.db('foodbyt').collection('users')
          const ordersCollection = client.db('foodbyt').collection('orders')
          const shopCollection = client.db('foodbyt').collection('shop')


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

          app.get('/orders', async(req, res)=>{
               const query = {}
               const orders = await ordersCollection.find(query).toArray()
               res.send(orders)
          })

          app.get('/shops', async(req, res)=>{
               const query = {}
               const shops = await shopCollection.find(query).toArray()
               res.send(shops)
          })

          // getting pending order by email 
          app.get('/pendingOrders', async(req, res)=>{
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

          app.get('/pendingOrderForAdmin', async(req, res)=>{
               let query = {}
               if(req.query.order){
                    query = {
                         order: 'pending'
                    }
               }
               const pendingOrders = await ordersCollection.find(query).toArray()
               res.send(pendingOrders)
          })

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

          // getting jwt token 
          app.get('/jwt', async(req, res)=>{
               const email = req.query.email;
               const query = {email: email}
               const user = await usersCollection.findOne(query)
               if(user){
                    const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
                    return res.send({accessToken: token})
               }
               res.status(403).send({accessToken: 'token'})
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