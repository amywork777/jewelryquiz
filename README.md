# Custom Charm Design Questionnaire

An interactive questionnaire that guides users through creating custom jewelry charms with AI-powered image generation.

## 🚀 Quick Fix for Vercel Deployment

**If image generation is not working in Vercel, follow these steps:**

### 1. Set Environment Variable in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add a new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key (starts with `sk-`)
   - **Environment:** Production (and Preview if needed)
5. Click "Save"
6. Redeploy your project

### 2. Get an OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 3. Verify the Fix
After setting the environment variable and redeploying:
1. Complete the questionnaire
2. Check browser console for "Config loaded successfully from server"
3. Image generation should work at the end

## 🛠 Local Development

### Prerequisites
- Modern web browser
- OpenAI API key (for image generation)

### Setup
1. Clone the repository
2. Create a `config.js` file in the root directory:
```javascript
window.CONFIG = {
    OPENAI_API_KEY: 'your-openai-api-key-here'
};
```
3. Open `index.html` in your browser

**Note:** Never commit `config.js` with real API keys to version control.

## 📁 Project Structure

```
├── index.html          # Main questionnaire application
├── api/
│   └── config.js       # Serverless function for secure API key delivery
├── vercel.json         # Vercel configuration for routing
├── config.js           # Local development config (gitignored)
├── config.template.js  # Template for local config
└── DEPLOYMENT.md       # Detailed deployment guide
```

## 🔧 How It Works

### Architecture
- **Frontend:** Single-page HTML application with vanilla JavaScript
- **Backend:** Vercel serverless function for secure API key management
- **AI Integration:** OpenAI API for custom charm image generation

### Security
- API keys are stored as environment variables in Vercel
- No sensitive data exposed in client-side code
- Secure serverless function delivers configuration

### Features
- **Adaptive Questionnaire:** Different paths based on user needs
- **Image Upload:** Support for reference images and inspiration
- **AI Image Generation:** Custom charm designs based on responses
- **Responsive Design:** Works on desktop and mobile
- **Graceful Fallbacks:** Manual design process when AI is unavailable

## 🎨 Customization

### Styling
The application uses a clean, minimal design with:
- Custom CSS variables for easy theming
- Responsive layout with mobile-first approach
- Smooth animations and transitions

### Questionnaire Flow
The questionnaire adapts based on user responses:
- **Path A:** Exploratory (needs help with ideas)
- **Path B:** Idea refinement (has rough concept)
- **Path C:** Direct creation (knows exactly what they want)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set the `OPENAI_API_KEY` environment variable
3. Deploy automatically

### Other Platforms
The application can be deployed to any static hosting platform, but you'll need to:
1. Implement your own API key management
2. Modify the configuration loading logic
3. Ensure CORS is properly configured

## 🐛 Troubleshooting

### Image Generation Not Working
1. **Check Environment Variable:** Ensure `OPENAI_API_KEY` is set in Vercel
2. **Check API Key:** Verify the key is valid and has sufficient credits
3. **Check Console:** Look for error messages in browser developer tools
4. **Fallback Mode:** The app gracefully falls back to manual design creation

### Common Issues
- **404 on /config.js:** Environment variable not set in Vercel
- **CORS errors:** API key configuration issue
- **Blank images:** Invalid or expired API key

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Ensure all environment variables are properly set
4. Contact support with specific error messages 