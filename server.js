const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const AZURE_API_KEY = 'your-azure-api-key';
const AZURE_ENDPOINT = 'https://<your-resource-name>.openai.azure.com';
const DEPLOYMENT_NAME = '<your-deployment-name>';
const API_VERSION = '2023-03-15-preview';

app.post('/api/ask', async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await axios.post(
      `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`,
      {
        messages,
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
    console.error('❌ Backend error calling GPT:', error.response?.data || error.message);
    res.status(500).json({ error: 'GPT backend error', detail: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend proxy running on http://localhost:${PORT}`);
});
