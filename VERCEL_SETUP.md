# Vercel Deployment Fix - Quick Checklist

## ❌ Problem
Image generation is not working in Vercel. Console shows:
- `window.CONFIG: undefined`
- `window.OPENAI_API_KEY: undefined`
- `Failed to fetch config: 404`
- `API key not available`

## ✅ Solution

### Step 1: Add Environment Variable in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** tab
4. Click **Environment Variables** in the sidebar
5. Click **Add New**
6. Enter:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (your OpenAI API key)
   - **Environments:** Check "Production" (and "Preview" if needed)
7. Click **Save**

### Step 2: Redeploy
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 3: Test
1. Visit your deployed site
2. Complete the questionnaire
3. Check browser console (F12) for:
   - ✅ `Config loaded successfully from server`
   - ✅ Image generation should work

## 🔑 Getting an OpenAI API Key

If you don't have an OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Click your profile → **View API keys**
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)
6. Add billing information if required

## 🚨 Important Notes

- **Never commit API keys to Git**
- The key should start with `sk-`
- Make sure you have credits in your OpenAI account
- The environment variable name must be exactly `OPENAI_API_KEY`

## 🐛 Still Not Working?

Check the browser console for specific error messages:

1. **404 on /config.js** → Environment variable not set correctly
2. **API key not configured** → Environment variable missing
3. **Invalid API key** → Check the key format and validity
4. **Insufficient credits** → Add billing to your OpenAI account

## 📞 Need Help?

If you're still having issues:
1. Check the full error message in browser console
2. Verify the environment variable is set correctly
3. Ensure the API key is valid and has credits
4. Try redeploying after setting the environment variable 