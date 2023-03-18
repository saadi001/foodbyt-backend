const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const items = require('./data/Items.json')
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.biy4zxs.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
     try {
          const itemsCollection = client.db('foodbyt').collection('items')



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
     }
     finally {

     }
}
run().catch(err => console.error(err))


app.get('/', async (req, res) => {
     res.send('server is running')
})


app.listen(port, () => {
     console.log(`server is running at ${port} port`)
})