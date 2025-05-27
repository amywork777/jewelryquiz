# Deployment Guide

## Vercel Deployment Setup

### 1. Environment Variables
In your Vercel dashboard, add the following environment variable:

**Variable Name:** `OPENAI_API_KEY`
**Value:** Your OpenAI API key (starts with sk-...)

### 2. Deployment Steps
1. Connect your GitHub repository to Vercel
2. Add the environment variable in Vercel dashboard
3. Deploy!

### 3. Local Development
Create a `.env.local` file in the root directory:
```
OPENAI_API_KEY=your-openai-api-key-here
```

### 4. How it works
- The `api/config.js` serverless function serves the API key securely
- Environment variables are only accessible server-side
- The client-side code loads the config from `/config.js` endpoint
- No API keys are exposed in the client-side code

### 5. Security Notes
- Never commit `.env.local` or `config.js` with real API keys
- Always use environment variables in production
- The API key is served through a secure serverless function 