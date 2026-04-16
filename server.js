import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.withmono.com";

// 🔁 Exchange code → account ID
app.post("/exchange", async (req, res) => {
  const { code } = req.body;

  try {
    const exchangeRes = await axios.post(
      `${BASE_URL}/account/auth`,
      { code },
      {
        headers: {
          "mono-sec-key": process.env.MONO_SECRET_KEY
        }
      }
    );

    const accountId = exchangeRes.data.id;

    // 📊 Fetch account details
    const accountRes = await axios.get(
      `${BASE_URL}/accounts/${accountId}`,
      {
        headers: {
          "mono-sec-key": process.env.MONO_SECRET_KEY
        }
      }
    );

    // 📜 Fetch transactions
    const txRes = await axios.get(
      `${BASE_URL}/accounts/${accountId}/transactions`,
      {
        headers: {
          "mono-sec-key": process.env.MONO_SECRET_KEY
        }
      }
    );

    res.json({
      account: accountRes.data,
      transactions: txRes.data.data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Mono data" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});