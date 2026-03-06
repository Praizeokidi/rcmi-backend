require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL
}));

app.use(express.json());

/* ---------------- MONGODB CONNECTION ---------------- */

const client = new MongoClient(process.env.MONGO_URL);

let donationsCollection;

async function connectDB() {
    await client.connect();
    const db = client.db("rcmi");
    donationsCollection = db.collection("donations");
    console.log("MongoDB connected");
}

connectDB();

/* ---------------- INITIALIZE DONATION ---------------- */

app.post("/initialize-donation", async (req, res) => {

    const { email, amount } = req.body;

    try {

        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: amount * 100,
                callback_url: `${process.env.FRONTEND_URL}/donation-success`
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json(response.data);

    } catch (error) {

        console.error(error.response?.data || error.message);

        res.status(500).json({
            error: "Donation initialization failed"
        });

    }

});

/* ---------------- VERIFY PAYMENT ---------------- */

app.get("/verify-donation/:reference", async (req, res) => {

    const reference = req.params.reference;

    try {

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const data = response.data.data;

        if (data.status === "success") {

            await donationsCollection.insertOne({
                email: data.customer.email,
                amount: data.amount / 100,
                reference: data.reference,
                date: new Date()
            });

        }

        res.json(response.data);

    } catch (error) {

        console.error(error.response?.data || error.message);

        res.status(500).json({
            error: "Verification failed"
        });

    }

});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});