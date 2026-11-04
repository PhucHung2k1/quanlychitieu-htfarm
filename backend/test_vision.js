const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function testVision() {
  const apiKey = 'AQ.Ab8RN6IiVUTd_X81AR7FySZ6MOOWpJ7S6HCzL43lRpJsk4zWsQ';
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use the test image
  const imgPath = 'D:\\Projects\\QuanLyChiTieu\\backend\\uploads\\test_bill.png';
  const base64Data = fs.readFileSync(imgPath).toString('base64');
  
  const modelsToTry = [
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-pro-latest',
    'gemini-3.8-flash'
  ];

  for (const mName of modelsToTry) {
    console.log(`\n--- Testing model: ${mName} ---`);
    const start = Date.now();
    try {
      const model = genAI.getGenerativeModel({ 
        model: mName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent([
        'Trích xuất số tiền trong ảnh dạng JSON: {"amount": 0}',
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png'
          }
        }
      ]);
      console.log(`Success with ${mName} in ${Date.now() - start}ms:`);
      console.log(result.response.text());
      return;
    } catch (err) {
      console.log(`Failed with ${mName} in ${Date.now() - start}ms:`, err.message);
    }
  }
}

testVision();
