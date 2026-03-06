// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const { MongoClient } = require("mongodb");

const uri = process.env.DB_URL;

const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("MongoDB connected");
    } catch (err) {
        console.error(err);
    }
}

connectDB();


const app = express();

// Enable CORS for your frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || "*" // Use "*" if you want open access
}));

// Parse JSON bodies
app.use(express.json());

// Initialize Donation
app.post("/initialize-donation", async (req, res) => {
    const { email, amount } = req.body;

    if (!email || !amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ error: "Invalid email or amount" });
    }

    try {
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: amount * 100, // Paystack uses kobo
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
        res.status(500).json({ error: "Failed to initialize donation" });
    }
});

// Verify Donation
app.get("/verify-donation/:reference", async (req, res) => {
    const { reference } = req.params;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Failed to verify donation" });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});