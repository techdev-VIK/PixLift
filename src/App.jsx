import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImageURL(URL.createObjectURL(file)); // for displaying image
    setOcrText('');
    setCleanedText('');
    setAiAnalysis('');
  };

  const handleProcessCheque = async () => {
    if (!image) return;
    setLoading(true);

    // --- Step 1: OCR with Tesseract ---
    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(image);
    await worker.terminate();

    setOcrText(text);

    // --- Step 2: GPT AI Cleanup & Smart Analysis ---
    try {
      const response = await axios.post(
        'https://YOUR_AZURE_ENDPOINT/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions?api-version=2023-03-15-preview',
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
            'api-key': 'YOUR_AZURE_API_KEY',
          },
        }
      );

      const aiOutput = response.data.choices[0].message.content;

      // Split structured fields and analysis based on line breaks (if structured that way)
      const parts = aiOutput.split(/\n\s*\n/); // split on empty lines
      setCleanedText(parts[0]);
      setAiAnalysis(parts.slice(1).join('\n\n'));
    } catch (error) {
      console.error('GPT API Error:', error);
      setAiAnalysis('Failed to get AI cleanup.');
    }

    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">🧠 AI-Powered Cheque Reader</h2>

      <input type="file" className="form-control mb-3" onChange={handleImageUpload} />

      <button className="btn btn-primary mb-4" onClick={handleProcessCheque} disabled={loading}>
        {loading ? 'Processing...' : 'Extract & Analyze Cheque'}
      </button>

      {imageURL && (
        <div className="mb-4 text-center">
          <h5>📷 Uploaded Cheque Preview</h5>
          <img src={imageURL} alt="Cheque Preview" style={{ maxWidth: '100%', maxHeight: 300 }} className="img-thumbnail" />
        </div>
      )}

      {ocrText && (
        <div className="mb-4">
          <h5>📝 Raw OCR Text</h5>
          <pre className="bg-light p-3">{ocrText}</pre>
        </div>
      )}

      {cleanedText && (
        <div className="mb-4">
          <h5>✅ Cleaned & Structured (AI)</h5>
          <pre className="bg-success text-white p-3">{cleanedText}</pre>
        </div>
      )}

      {aiAnalysis && (
        <div className="mb-4">
          <h5>🧠 AI Insights</h5>
          <pre className="bg-warning p-3">{aiAnalysis}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
