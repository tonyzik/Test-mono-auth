import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.withmono.com/v2/accounts";
/**
 * 🧠 Central logger (clean + structured)
 */
function log(step, data) {
  console.log(`\n========== ${step} ==========\n`);
  console.log(data);
  console.log(`\n=============================\n`);
}


/**
 * 🔁 Exchange + Fetch account + transactions
 */
app.post("/exchange", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "Missing authorization code"
    });
  }

  try {
    log("STEP 1 - Received Code", code);

    // 🔁 Exchange code → account ID
    const exchangeRes = await axios.post(
      `${BASE_URL}/initiate`,
      {"scope":"auth", "redirect_url": "https://mono.co" },
      {
        headers: {
          "Content-Type": "application/json",
          "mono-sec-key": process.env.MONO_SECRET_KEY
        }
      }
    );

    log("STEP 2 - Exchange Response", exchangeRes.data);

    // 📊 Fetch account details
    const getAccountID = await axios.post(
      `${BASE_URL}/auth`, {code},
      {
        headers: {
          "Content-Type": "application/json",
          "mono-sec-key": process.env.MONO_SECRET_KEY
        }
      }
    );

    const accountId =
      getAccountID.data?.id ||
      getAccountID.data?.data?.id;

    if (!accountId) {
      throw new Error("Account ID not returned from Mono exchange");
    }

    log("STEP 3 - Extracted Account ID", accountId);

    // 📊 Fetch account details
    const accountRes = await axios.get(
      `${BASE_URL}/${accountId}`,
      {
        headers: {
          "mono-sec-key": process.env.MONO_SECRET_KEY
        }
      }
    );

    log("STEP 4 - Account Response", accountRes.data);

    // 📜 Fetch transactions
    const txRes = await axios.get(
      `${BASE_URL}/${accountId}/transactions`,
      {
        headers: {
          "mono-sec-key": process.env.MONO_SECRET_KEY
        }
      }
    );

    log("STEP 5 - Transactions Response", txRes.data);

    return res.json({
      account: accountRes.data,
      transactions: txRes.data?.data || []
    });

  } catch (err) {
    // 🔥 FULL ERROR TRACE
    console.log("\n🔥🔥🔥 ERROR CAUGHT 🔥🔥🔥");

    console.log("Message:", err.message);
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
    console.log("Headers:", err.response?.headers);

    return res.status(500).json({
      error: "Failed to fetch Mono data",
      debug: {
        message: err.message,
        status: err.response?.status || null,
        monoResponse: err.response?.data || null
      }
    });
  }
});

/**
 * ❤️ Health check route
 */
app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    time: new Date().toISOString()
  });
});

/**
 * 🚀 Start server
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}\n`);
});