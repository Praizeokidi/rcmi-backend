require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

let db;

async function connectDB() {
    try {
        await client.connect();

        db = client.db("rcmi_database");
        // CHANGE: ensure this matches your MongoDB Atlas database name

        console.log("MongoDB connected");

    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectDB();



/* =========================
   CONTACT FORM ROUTE
========================= */

app.post("/contact", async (req, res) => {

    try {

        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const messageData = {
            name,
            email,
            message,
            createdAt: new Date(),
        };

        await db.collection("messages").insertOne(messageData);

        res.status(200).json({ message: "Message saved successfully" });

    } catch (error) {

        console.error(error); // NEW: helpful debugging

        res.status(500).json({ error: "Failed to save message" });

    }

});



/* =========================
   NEWSLETTER SUBSCRIBE ROUTE
========================= */

app.post("/subscribe", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // NEW: prevent duplicate subscriptions
        const existing = await db.collection("subscribers").findOne({ email });

        if (existing) {
            return res.status(400).json({ message: "Already subscribed" });
        }

        const subscriber = {
            email,
            createdAt: new Date()
        };

        await db.collection("subscribers").insertOne(subscriber);

        res.status(200).json({ message: "Subscribed successfully" });

    } catch (error) {

        console.error(error); // NEW: log errors

        res.status(500).json({ error: "Subscription failed" });

    }

});



/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});