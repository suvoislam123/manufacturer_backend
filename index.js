const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { response } = require('express');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();
app.use(cors())
app.use(express.json())
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zfajy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);
async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('SyndicutX_Shop').collection('products');
        const ordersCollection = client.db('SyndicutX_Shop').collection('orders');
        const messagesCollection = client.db('SyndicutX_Shop').collection('messages');
        //Authentication API
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        });
        // Services API for Products
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        });
        app.post('/products', async (req, res) => {
            const product = req.body;
            const data = await productsCollection.insertOne(product);
            res.send(data);

        });
        app.post('/updateproduct/:id', async (req, res) => {
            const updateproduct = req.body;
            console.log(updateproduct)
            console.log(updateproduct);
            const product_id = req.params.id;
            const query = { _id: ObjectId(product_id) };
            const product = await productsCollection.findOne(query);
            console.log(product);
            //jodi product null hoi tar mane product ta deleted
            const result = await productsCollection.updateOne(
                { _id: ObjectId(product_id) },
                {
                    $set:
                    {
                        name: updateproduct.name,
                        image: updateproduct.image,
                        price: updateproduct.price,
                        quantity: updateproduct.quantity,
                        supplier_name: updateproduct.supplier_name,
                        short_description: updateproduct.short_description,
                        catagory: updateproduct.catagory

                    }

                }
            );
            res.send(result);
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        });
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        });
        //API for orders
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const data = await ordersCollection.insertOne(order);
            res.send(data);
        });
        app.get('/orders', async (req, res) => {
            const query = {};
            const cursor = ordersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.send(order);
        }, [])
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = ordersCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })
        //API for message
        app.post('/message/:email', async (req, res) => {
            //I will do it later
        });
        //API for update Quantity
        app.post('/updatequantity', async (req, res) => {
            const orderedQuantity = req.body.quantity;
            const product_id = req.body.product_id;
            const query = { _id: ObjectId(product_id) };
            const product = await productsCollection.findOne(query);
            console.log(product);
            //jodi product null hoi tar mane product ta deleted
            const result = await productsCollection.updateOne(
                { _id: ObjectId(product_id) },
                {
                    $set:
                    {
                        quantity: product.quantity - orderedQuantity
                    }

                }
            );
            res.send(result);
        });

        //Messages API 
        app.post('/messages', async (req, res) => {
            const message = req.body;
            const result = await messagesCollection.insertOne(message);
            res.send(result);

        });
        app.delete('/orders/:id', async (req, res) => {
            const order_id = req.params.id;
            const query = { _id: ObjectId(order_id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        });

    } finally {
        
    }
    

}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('The warehouse server is running');
});
app.listen(port, () => {
    console.log(`The warehouse server is listening on port ${port}`);
})