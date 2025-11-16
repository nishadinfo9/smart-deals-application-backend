const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

//firebase admin
const admin = require("firebase-admin");
const serviceAccount = require("./smart-deals-application.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

const verifyFireBaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(400).send({ message: "authorization access" });
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send("token does not exist");
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log(decoded);
    next();
  } catch (error) {
    return res.status(400, "unauthorize access");
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@apiproject.u4eps.mongodb.net/?appName=ApiProject`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Backend Running");
});

async function server() {
  try {
    await client.connect();

    const db = client.db("smart_deals");
    const bidsCollection = db.collection("bids");
    const productCollection = db.collection("product");

    app.post("/bids/create", async (req, res) => {
      const newUser = req.body;
      const createBids = await bidsCollection.insertOne(newUser);
      res.send(createBids);
    });

    app.patch("/bids/update/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;

      if (!id) return;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          bid_price: updateData.bid_price,
          status: updateData.status,
        },
      };
      const updateBids = await bidsCollection.updateOne(query, update);
      if (!updateBids) return;
      res.send(updateBids);
    });

    app.delete("/bids/delete/:id", async (req, res) => {
      const id = req.params.id;
      if (!id) return;
      const query = { _id: new ObjectId(id) };
      const deletedBids = await bidsCollection.deleteOne(query);
      if (!deletedBids) return;
      res.send(deletedBids);
    });

    app.get("/bids/:id", async (req, res) => {
      const id = req.params.id;
      if (!id) return;
      const query = { _id: new ObjectId(id) };
      const getBids = await bidsCollection.findOne(query);
      if (!getBids) return;
      res.send(getBids);
    });

    app.get("/bids", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = {};
      if (email) {
        query.buyer_email = email;
      }

      const cursor = bidsCollection.find(query).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/latest", async (req, res) => {
      const cursor = bidsCollection.find().sort({ createdAt: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myBids", verifyFireBaseToken, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = {};
      if (email) {
        query.buyer_email = email;
      }
      console.log(query);

      const cursor = bidsCollection.find(query).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    // bids related apis
    // app.get("/bids", async (req, res) => {
    //   const email = req.query.email;
    //   const query = {};
    //   if (email) {
    //     query.buyer_email = email;
    //   }

    //   const cursor = bidsCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // app.get("/products/bids/:productId", async (req, res) => {
    //   const productId = req.params.productId;
    //   const query = { product: productId };
    //   const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // app.get("/bids", async (req, res) => {
    //   const query = {};
    //   if (query.email) {
    //     query.buyer_email = email;
    //   }

    //   const cursor = bidsCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // app.post("/bids", async (req, res) => {
    //   const newBid = req.body;
    //   const result = await bidsCollection.insertOne(newBid);
    //   res.send(result);
    // });

    // app.delete("/bids/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await bidsCollection.deleteOne(query);
    //   res.send(result);
    // });
  } finally {
  }
}

server().catch(console.dir);

app.listen(port, () => {
  console.log(`localhost Running port on: ${port}`);
});

client
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running now on port: ${port}`);
    });
  })
  .catch(console.dir);
