import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

/* =========================
   CORS (PRODUCTION SAFE FIX)
========================= */

const allowedOrigins = [
    "http://localhost:5173",
    "https://www.rcmi.org.ng",
    "https://rcmi.org.ng"
];

const corsOptions = {
    origin: function (origin, callback) {
        // allow mobile apps, curl, postman (no origin)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

/* ❌ REMOVED: app.options("*", cors())
   WHY: crashes Express 5 / path-to-regexp in production (Render) */

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */

const client = new MongoClient(process.env.MONGO_URI);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("rcmi_database");
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectDB();

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
    res.send("RCMI API running");
});

/* =========================
   CONTACT ROUTE
========================= */

/* ❌ REMOVED: app.options("/contact", cors());
   WHY: unnecessary — handled globally by app.use(cors()) */

app.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (!db) {
            return res.status(500).json({ error: "Database not ready" });
        }

        await db.collection("messages").insertOne({
            name,
            email,
            message,
            createdAt: new Date()
        });

        return res.status(200).json({ message: "Message saved successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to save message" });
    }
});

/* =========================
   SUBSCRIBE ROUTE
========================= */

app.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        if (!db) {
            return res.status(500).json({ error: "Database not ready" });
        }

        const existing = await db.collection("subscribers").findOne({ email });

        if (existing) {
            return res.status(400).json({ message: "Already subscribed" });
        }

        await db.collection("subscribers").insertOne({
            email,
            createdAt: new Date()
        });

        return res.status(200).json({ message: "Subscribed successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Subscription failed" });
    }
});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/* ❌ REMOVED:
   - wildcard app.options("*") that crashed Render
   - unnecessary debug logs exposing env values
*/