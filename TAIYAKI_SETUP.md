# Taiyaki Dog Charm Flow Setup Guide

This guide will help you set up the complete Taiyaki flow: **Dog Photo → AI Design → Shopify Product → Email Checkout**

## 🎯 Overview

The Taiyaki flow consists of 4 main steps:
1. **Upload**: User submits photo → Firebase Storage + Firestore
2. **Render**: AI generates charm design → Firebase Storage  
3. **Shopify**: Create product with metafields → Get checkout URL
4. **Email**: Send notification with preview + buy button

## 📋 Prerequisites

- Firebase project with Firestore and Storage enabled
- Shopify store with Admin API access
- Email service (Postmark recommended)
- OpenAI API key
- Vercel account (for deployment)

## 🔧 Setup Steps

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Firestore Database**
4. Enable **Storage**
5. Get your config from Project Settings → General → Your apps

### 2. Shopify Setup

1. Go to your Shopify Admin → Apps → Develop apps
2. Create a private app with these permissions:
   - `write_products`
   - `write_inventory`
   - `write_product_listings`
3. Copy the Admin API access token

### 3. Email Service Setup (Postmark)

1. Sign up at [Postmark](https://postmarkapp.com/)
2. Create a server
3. Get your Server API Token
4. Verify your sender domain/email

### 4. Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
# Firebase
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id

# OpenAI
OPENAI_API_KEY=sk-proj-your-key

# Shopify
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-access-token

# Email
POSTMARK_API_TOKEN=your-postmark-token
FROM_EMAIL=designs@yourdomain.com
```

### 5. Install Dependencies

```bash
npm install
```

## 🚀 API Endpoints

### Complete Flow (Recommended)
- **POST** `/api/process-complete-flow`
- Runs entire pipeline in one call
- Input: `{ photo, email, dog_name, designData }`

### Individual Steps (For debugging)
- **POST** `/api/upload-design` - Step 1: Upload photo
- **POST** `/api/render-design` - Step 2: Generate AI render  
- **POST** `/api/create-shopify-product` - Step 3: Create Shopify product
- **POST** `/api/send-email` - Step 4: Send notification email

## 📱 Frontend Integration

Update your form submission to use the complete flow:

```javascript
async function submitDesign(formData) {
  const response = await fetch('/api/process-complete-flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photo: formData.photo, // base64 string
      email: formData.email,
      dog_name: formData.dogName,
      designData: formData.quizResponses
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Complete flow finished!');
    console.log('Checkout URL:', result.checkout_url);
    console.log('Product URL:', result.product_url);
  }
}
```

## 🔄 Flow Diagram

```
User submits form
       ↓
📸 Upload photo to Firebase Storage
       ↓  
📄 Create Firestore document (status: pending)
       ↓
🎨 Generate AI charm design with OpenAI
       ↓
📁 Upload render to Firebase Storage  
       ↓
📝 Update Firestore (status: rendered)
       ↓
🛒 Create Shopify product with metafields
       ↓
🔗 Generate checkout URL
       ↓
📝 Update Firestore (status: ready)
       ↓
📧 Send email with preview + checkout link
       ↓
📝 Update Firestore (email_sent: true)
       ↓
✅ Complete!
```

## 🗄️ Firestore Schema

Each design document in the `designs` collection contains:

```javascript
{
  design_id: "uuid-string",
  email: "user@example.com", 
  dog_name: "Mochi",
  photo_url: "https://firebase-storage-url",
  render_url: "https://firebase-storage-url", 
  shopify_product_id: "123456789",
  shopify_variant_id: "987654321",
  product_url: "https://store.myshopify.com/products/...",
  checkout_url: "https://store.myshopify.com/cart/...",
  status: "ready", // pending → rendered → ready → error
  email_sent: true,
  created_at: timestamp,
  rendered_at: timestamp,
  shopify_created_at: timestamp,
  email_sent_at: timestamp,
  designData: { /* quiz responses */ }
}
```

## 🛍️ Shopify Product Structure

Products are created with:
- **Title**: "Custom Dog Charm – {dog_name}"
- **Price**: $100.00
- **SKU**: "DOG-CHARM-{design_id}"
- **Images**: AI-generated render
- **Metafields**: Customer email, dog name, design ID, original photo

## 📧 Email Template

The email includes:
- Beautiful header with dog's name
- AI-generated charm preview image
- Prominent "View & Buy Now" button → checkout URL
- Product details and pricing
- Secondary link to product page

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

### Manual Deployment

```bash
npm run deploy
```

## 🧪 Testing

Test the complete flow:

```bash
curl -X POST http://localhost:3000/api/process-complete-flow \
  -H "Content-Type: application/json" \
  -d '{
    "photo": "data:image/jpeg;base64,/9j/4AAQ...",
    "email": "test@example.com",
    "dog_name": "Buddy",
    "designData": {
      "responses": {
        "material": "sterling_silver",
        "size_presence": "delicate_minimal"
      }
    }
  }'
```

## 🔍 Monitoring

Check logs for each step:
- Firebase Console → Firestore (design documents)
- Shopify Admin → Products (created products)
- Postmark Dashboard → Activity (sent emails)
- Vercel Dashboard → Functions (API logs)

## 🆘 Troubleshooting

### Common Issues

1. **Firebase permissions**: Ensure Storage and Firestore rules allow writes
2. **Shopify API limits**: Rate limit is 40 requests/app/minute  
3. **OpenAI quota**: Check your usage limits
4. **Email delivery**: Verify sender domain in Postmark

### Error Handling

The flow includes comprehensive error handling:
- Failed steps update Firestore with error status
- Partial completion allows manual retry of remaining steps
- All errors are logged with context

## 📞 Support

For issues with this implementation:
1. Check the logs in Vercel Functions
2. Verify all environment variables are set
3. Test each API endpoint individually
4. Check Firebase, Shopify, and email service dashboards

---

🎉 **You're all set!** Your Taiyaki flow is ready to turn dog photos into purchasable charm designs! 