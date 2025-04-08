const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Replace with your actual Azure values
const AZURE_URL = 'https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name/chat/completions?api-version=2023-03-15-preview';
const AZURE_API_KEY = 'your-azure-api-key';

app.post('/api/ask', async (req, res) => {
  const { text } = req.body;

  try {
    const response = await axios.post(
      AZURE_URL,
      {
        messages: [
          {
            role: 'system',
            content:
              'You are a cheque validation assistant. From raw OCR text, extract structured fields (Payee, Amount, Date, Bank) and also point out any unclear or possibly missing information.',
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
          'api-key': AZURE_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ Azure GPT Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'GPT API failed', details: error.response?.data || error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
