require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL
}));

app.use(express.json());

/* ---------------- MONGODB CONNECTION ---------------- */

const client = new MongoClient(process.env.MONGO_URL);

let contactCollection;

async function connectDB() {
    await client.connect();

    const db = client.db("rcmi");

    contactCollection = db.collection("contacts");

    console.log("MongoDB connected");
}

connectDB();

/* ---------------- CONTACT FORM ---------------- */

app.post("/contact", async (req, res) => {

    const { name, email, message } = req.body;

    try {

        if (!name || !email || !message) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        await contactCollection.insertOne({
            name,
            email,
            message,
            date: new Date()
        });

        res.json({
            success: true,
            message: "Message received"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to send message"
        });

    }

});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});