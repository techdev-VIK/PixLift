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

    console.log('🧠 Starting OCR...');
    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (m) => console.log('📝 Tesseract Log:', m),
      });

      const extractedText = result.data.text;
      console.log('✅ OCR Extracted Text:', extractedText);
      setOcrText(extractedText);

      handleGPTCleanup(extractedText); // Pass OCR text to AI
    } catch (error) {
      console.error('❌ OCR Failed:', error);
      setOcrText('❌ Failed to extract text.');
    }
  };

  const handleGPTCleanup = async (text) => {
    setAiAnalysis('⏳ Sending to AI...');

    try {
      console.log('📡 Sending POST request to backend...');
      const response = await axios.post('http://localhost:5000/api/ask', { text });

      const message = response.data?.choices?.[0]?.message?.content;
      console.log('✅ AI Response:', message);

      if (message) {
        setAiAnalysis(message);
      } else {
        setAiAnalysis('⚠️ Empty AI response.');
      }
    } catch (error) {
      console.error('❌ GPT Backend Error:', error);
      setAiAnalysis(
        '❌ GPT Error: ' +
        (error.response?.data?.error?.message || error.message || 'Unknown error')
      );
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">🧾 Cheque AI Analyzer</h2>

      <div className="mb-3">
        <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
      </div>

      {image && (
        <div className="text-center mb-4">
          <img src={image} alt="Uploaded" className="img-thumbnail" style={{ maxWidth: '100%', maxHeight: 300 }} />
        </div>
      )}

      <button className="btn btn-primary w-100 mb-3" onClick={handleExtractText}>
        📤 Extract & Analyze Cheque
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
