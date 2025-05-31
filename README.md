# 🐕 Taiyaki Dog Charm Quiz

A complete AI-powered pipeline that transforms dog photos into custom jewelry designs and Shopify products.

## ✨ Features

- **Photo Upload**: Upload dog photos via web interface
- **AI Design Generation**: Create custom charm designs using OpenAI DALL-E 3
- **Shopify Integration**: Automatically create products with checkout links
- **Email Notifications**: Send beautiful emails with charm previews and buy buttons
- **Firebase Storage**: Secure photo and design storage
- **Real-time Processing**: Complete pipeline from photo to purchasable product

## 🚀 The Taiyaki Flow

1. **Upload** → Photo uploaded to Firebase Storage, Firestore document created
2. **Render** → AI generates custom charm design based on dog photo and preferences
3. **Shopify** → Product created with design image and metadata
4. **Email** → Customer receives notification with preview and purchase link

## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: OpenAI DALL-E 3 for design generation
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **E-commerce**: Shopify Admin API
- **Email**: Gmail SMTP via Nodemailer

## 📋 Prerequisites

- Node.js 18+
- Firebase project with Storage and Firestore enabled
- OpenAI API key
- Shopify store with Admin API access
- Gmail account with app password

## ⚙️ Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/taiyaki-dog-charm-quiz.git
   cd taiyaki-dog-charm-quiz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env.local` with your credentials:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id

   # OpenAI Configuration
   OPENAI_API_KEY=sk-proj-your_openai_key

   # Shopify Configuration
   SHOPIFY_STORE_URL=your_store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=shpat_your_access_token

   # Gmail Configuration
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   FROM_EMAIL=your_from_email@domain.com
   ```

4. **Start development server**
   ```bash
   npx vercel dev --listen 3000
   ```

5. **Test the flow**
   Open `http://localhost:3000/test-taiyaki-flow.html`

## 📁 Project Structure

```
├── api/
│   ├── upload-design.js      # Step 1: Photo upload
│   ├── render-design.js      # Step 2: AI design generation
│   ├── create-shopify-product.js  # Step 3: Shopify product creation
│   ├── send-email.js         # Step 4: Email notification
│   └── process-complete-flow.js   # Complete pipeline orchestrator
├── firebase-config.js        # Firebase initialization
├── test-taiyaki-flow.html   # Testing interface
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Complete Flow
- `POST /api/process-complete-flow` - Runs entire pipeline

### Individual Steps
- `POST /api/upload-design` - Upload photo and create design document
- `POST /api/render-design` - Generate AI charm design
- `POST /api/create-shopify-product` - Create Shopify product
- `POST /api/send-email` - Send notification email

## 🎨 Customization

### AI Prompt Customization
Modify the prompt generation in `api/render-design.js` to adjust design style:

```javascript
let prompt = `Create a beautiful, elegant dog charm design featuring ${dog_name}. `;
// Add your custom styling instructions
```

### Email Templates
Customize email design in `api/send-email.js`:

```javascript
function generateEmailTemplate(designData) {
  // Modify HTML template
}
```

### Shopify Product Configuration
Adjust product settings in `api/create-shopify-product.js`:

```javascript
const productData = {
  product: {
    title: `Custom Dog Charm – ${dog_name}`,
    // Customize product details
  }
};
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run deploy
```

### Manual Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

## 🔒 Security

- Environment variables are never committed to git
- Firebase Security Rules should be configured for production
- Shopify webhook signatures should be verified in production
- Rate limiting should be implemented for API endpoints

## 📊 Monitoring

- Check Vercel function logs for API errors
- Monitor Firebase usage in Firebase Console
- Track Shopify API rate limits
- Monitor email delivery rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the [Issues](https://github.com/your-username/taiyaki-dog-charm-quiz/issues) page
- Email: support@taiyaki.ai

---

Made with ❤️ by Taiyaki Custom Charms 