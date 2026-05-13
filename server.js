import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

/* =========================
   CORS CONFIG
   (NO CHANGE - already correct)
========================= */
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://rcmi.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */

const client = new MongoClient(process.env.MONGO_URI);

let db;

/* CHANGED: wrapped connect in safe function instead of top-level await
   WHY: Render + Node 20 sometimes behaves unpredictably with top-level await
*/
async function connectDB() {
    try {
        await client.connect();
        db = client.db("rcmi_database");
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

/* CHANGED: proper startup sequence instead of await at top level */
connectDB();

/* =========================
   HEALTH CHECK (NEW - optional but useful)
========================= */
app.get("/", (req, res) => {
    res.send("RCMI API running");
});

/* =========================
   CONTACT ROUTE
========================= */

app.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        /* CHANGED: safety check (prevents crash if DB not ready yet) */
        if (!db) {
            return res.status(500).json({ error: "Database not ready" });
        }

        await db.collection("messages").insertOne({
            name,
            email,
            message,
            createdAt: new Date()
        });

        res.status(200).json({ message: "Message saved successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save message" });
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

        /* CHANGED: DB safety check */
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

        res.status(200).json({ message: "Subscribed successfully" });

    } catch (error) {
        console.error(error);
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

/* ❌ REMOVED:
   console.log(process.env.MONGO_URI);

   WHY:
   - exposes sensitive DB string in logs (bad for production)
   - not needed once connection works
*/