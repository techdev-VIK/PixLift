const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
require('dotenv').config(); // Make sure .env is loaded

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/api/ask', async (req, res) => {
  const { text } = req.body;

  console.log('🔔 Received text for AI cleanup:', text);

  const agent = new https.Agent({ rejectUnauthorized: false }); // 👈 bypass SSL validation

  try {
    const response = await axios.post(
      'https://<your-resource-name>.openai.azure.com/openai/deployments/<your-deployment-name>/chat/completions?api-version=2023-03-15-preview',
      {
        messages: [
          {
            role: 'system',
            content:
              'You are a cheque validation assistant. From raw OCR text, extract structured fields (Payee, Amount, Date, Bank) and point out unclear/missing data.',
          },
          {
            role: 'user',
            content: `Here is the raw OCR text from a cheque:\n\n"${text}"\n\nPlease return:\n1. Cleaned structured fields in JSON\n2. Comments about issues (e.g., missing/unclear data)`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.OPENAI_API_KEY, // 🔐 Set this in .env
        },
        httpsAgent: agent, // 👈 Use custom agent here
      }
    );

    console.log('✅ GPT response received');
    console.log(response.data);

    const message = response.data?.choices?.[0]?.message?.content;
    res.json({ message });
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error.message);
    console.error(error.response?.data || error);

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        'Something went wrong calling the AI service.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
