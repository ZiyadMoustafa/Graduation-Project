const { GoogleGenAI } = require('@google/genai');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.chatWithGemini = catchAsync(async (req, res, next) => {
  try {
    const userMessage = req.body.message;

    // send msg and recieve res
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
    });

    // send reply
    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error.message);

    return next(new AppError(error.message || 'Gemini error', 500));
  }
});
