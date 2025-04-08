import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
    setOcrText('');
    setCleanedText('');
  };

  const handleOCR = async () => {
    if (!image) return;

    setLoading(true);
    const worker = await createWorker('eng');

    const {
      data: { text },
    } = await worker.recognize(image);

    setOcrText(text);
    await worker.terminate();

    // Now call Azure GPT API to clean this up
    try {
      const response = await axios.post(
        'https://YOUR_AZURE_ENDPOINT/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions?api-version=2023-03-15-preview',
        {
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant who cleans OCR cheque data.',
            },
            {
              role: 'user',
              content: `Clean and extract structured data from this cheque OCR result:\n\n${text}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 200,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': 'YOUR_AZURE_API_KEY',
          },
        }
      );

      setCleanedText(response.data.choices[0].message.content);
    } catch (error) {
      console.error('GPT API Error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Cheque OCR + AI Cleanup</h2>

      <input type="file" className="form-control mb-3" onChange={handleImageUpload} />

      <button className="btn btn-primary mb-4" onClick={handleOCR} disabled={loading}>
        {loading ? 'Processing...' : 'Extract & Clean Text'}
      </button>

      {ocrText && (
        <div className="mb-4">
          <h5>🔍 Raw OCR Text</h5>
          <pre className="bg-light p-3">{ocrText}</pre>
        </div>
      )}

      {cleanedText && (
        <div>
          <h5>✅ Cleaned Info (by GPT)</h5>
          <pre className="bg-success text-white p-3">{cleanedText}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
