const express = require('express');
const cors = require('cors');
const stripe = require("stripe")('sk_test_51MjcDPGSr2sfwj4uHEv5sZm7YgqXB7mygZ6Rchh44MkObrEJSxuyRsmNshG8EvvJfyg2tnwrLt404yYd6VGgIVJV00j2FEZRh3');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
//sportsUser
//E3TkCWxfAgPkzVfG


const uri = "mongodb+srv://sportsUser:E3TkCWxfAgPkzVfG@cluster0.iikigzo.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const categoryCollection = client.db('sports').collection('category');
        const productCollection = client.db('sports').collection('products');
        const userCollection = client.db('sports').collection('users');
        const bookingCollection = client.db('sports').collection('booking');
        const paymentCollection = client.db('sports').collection('payment');

        //category api
        app.get('/category', async (req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const objectId = new ObjectId(id);
            const query = { _id: objectId }
            const result = await categoryCollection.findOne(query)
            res.send(result);
        })

        //products api

        app.get('/product', async (req, res) => {
            let query = {}
            if (req.query.productCat) {
                query = {
                    productCat: req.query.productCat
                }
            }
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        app.get('/myproducts', async (req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email };
            const phones = await productCollection.find(query).toArray();
            res.send(phones);
        })

        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id
            const objectId = new ObjectId(id)
            const filter = { _id: objectId };
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        })



        //users api
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        })

        app.get('/seller', async (req, res) => {
            const query = { category: 'seller' };
            const seller = await userCollection.find(query).toArray();
            res.send(seller);
        })

        app.get('/buyer', async (req, res) => {
            const query = { category: 'buyer' };
            const seller = await userCollection.find(query).toArray();
            res.send(seller);
        })

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const user = await userCollection.findOne(query)
            res.send({ isBuyer: user?.category === 'buyer' })
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const user = await userCollection.findOne(query)
            res.send({ isSeller: user?.category === 'seller' })
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const user = await userCollection.findOne(query)
            res.send({ isAdmin: user?.category === 'admin' })
        })

        // app.put('/users/admin/:id', verifyJWT, async (req, res) => {
        //     const decodedEmail = req.decoded.email;
        //     const query = { email: decodedEmail }
        //     const user = await userCollection.findOne(query)
        //     if (user.category !== 'admin') {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }
        //     const id = req.params.id;
        //     const objectId = new ObjectId(id)
        //     const filter = { _id: objectId }
        //     const options = { upsert: true };
        //     const UpdateDoc = {
        //         $set: {
        //             category: 'admin'
        //         }
        //     }
        //     const result = await userCollection.updateOne(filter, UpdateDoc, options);
        //     res.send(result);
        // })

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })
        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment)
            const id = payment.bookingId
            const objectId = new ObjectId(id)
            const filter = { _id: objectId }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            console.log(user);
            res.status(403).send({ token: '' })
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const objectId = new ObjectId(id)
            const filter = { _id: objectId };
            const result = await userCollection.deleteOne(filter);
            res.send(result);
        })


        //booking api

        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })

        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id
            const objectId = new ObjectId(id)
            const query = { _id: objectId };
            const booking = await bookingCollection.findOne(query)
            res.send(booking)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(error => console.error(error))

app.get('/', (req, res) => {
    res.send('Sports gadget server is running')
})

app.listen(port, () => {
    console.log(`Sports gadget server running on port ${port}`)
})