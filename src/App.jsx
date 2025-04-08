import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      console.log('📸 Image selected:', file.name);
    }
  };

  const handleExtractText = async () => {
    if (!image) {
      alert('Please upload an image first!');
      return;
    }

    setOcrText('🔄 Processing with OCR...');
    setAiAnalysis('');

    console.log('🧠 Starting Tesseract OCR...');
    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (m) => console.log('📝 Tesseract Log:', m),
      });

      console.log('✅ OCR result:', result.data.text);
      setOcrText(result.data.text);
      handleGPTCleanup(result.data.text);
    } catch (error) {
      console.error('❌ OCR Error:', error);
      setOcrText('❌ Failed to extract text.');
    }
  };

  const handleGPTCleanup = async (text) => {
    setAiAnalysis('⏳ Sending to AI for cleanup...');

    try {
      console.log('📤 Sending request to Azure OpenAI API...');
      console.log('🔤 OCR Text:', text);

      const response = await axios.post(
        'https://<your-resource-name>.openai.azure.com/openai/deployments/<your-deployment-name>/chat/completions?api-version=2023-03-15-preview',
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
            'api-key': '<your-azure-api-key>',
          },
        }
      );

      console.log('✅ GPT Response:', response.data);

      const message = response.data?.choices?.[0]?.message?.content;
      if (message) {
        setAiAnalysis(message);
      } else {
        setAiAnalysis('⚠️ AI response was empty.');
      }
    } catch (error) {
      console.error('❌ GPT API Error:', error);
      console.error('📄 Error Response:', error.response?.data || error.message);

      setAiAnalysis(
        '❌ GPT Error: ' +
          (error.response?.data?.error?.message || error.message || 'Unknown error')
      );
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">🧾 Cheque AI Analyzer</h2>

      <div className="mb-3">
        <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
      </div>

      {image && (
        <div className="text-center mb-4">
          <img src={image} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: 300 }} className="img-thumbnail" />
        </div>
      )}

      <button className="btn btn-primary w-100 mb-3" onClick={handleExtractText}>
        📤 Extract & Clean Text
      </button>

      <div className="row">
        <div className="col-md-6">
          <h5>🧾 Raw OCR Text</h5>
          <pre className="bg-light p-3 rounded" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {ocrText}
          </pre>
        </div>
        <div className="col-md-6">
          <h5>🤖 AI-Cleaned Output</h5>
          <pre className="bg-light p-3 rounded" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {aiAnalysis}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App;
