#!/usr/bin/env node

// Quick test to see available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GOOGLE_GEMINI_API_KEY not set in environment');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
    console.log('Testing Gemini API connection...\n');
    
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-pro',
        'gemini-pro-vision',
    ];
    
    for (const modelName of models) {
        try {
            console.log(`Testing: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const result = await model.generateContent('Hello, what is 2+2?');
            const text = result.response.text();
            
            console.log(`✅ ${modelName} - WORKS`);
            console.log(`   Response: ${text.substring(0, 50)}...\n`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`❌ ${modelName} - FAILED`);
            console.log(`   Error: ${errorMsg.substring(0, 100)}...\n`);
        }
    }
}

testModels().catch(console.error);
