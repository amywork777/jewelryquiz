# 🚀 Supabase Integration for Taiyaki Dog Charm Quiz

This guide explains the complete Supabase integration that tracks ALL parts of the quiz and design process.

## 📋 What's Been Integrated

### ✅ Complete Tracking System
- **Quiz Sessions**: Every user journey from start to finish
- **Individual Responses**: Each quiz answer tracked separately  
- **User Analytics**: Button clicks, form inputs, page interactions
- **Design Iterations**: AI generation attempts and results
- **Error Tracking**: Failed attempts with detailed error messages
- **Performance Metrics**: Generation times, completion rates

### ✅ Database Schema
- `quiz_sessions` - Main table tracking complete user journeys
- `quiz_responses` - Individual quiz answers breakdown
- `user_analytics` - User behavior and interaction events
- `design_iterations` - AI design generation tracking
- Pre-built analytics views for insights

### ✅ API Endpoints
- `/api/supabase-complete-flow` - Main flow with full Supabase tracking
- `/api/track-analytics` - Real-time user interaction tracking

### ✅ Client-Side Analytics
- Automatic tracking of all user interactions
- Real-time event batching and sending
- Error handling and retry logic

## 🛠 Setup Instructions

### 1. Database Setup (Already Done)
Your Supabase project is configured with:
- **URL**: `https://hsigcnuiekahlgnzxxqh.supabase.co`
- **Anon Key**: Already in `env.local`
- **Schema**: Run `supabase-schema.sql` in your Supabase SQL Editor

### 2. Install Dependencies (Already Done)
```bash
npm install @supabase/supabase-js
```

### 3. Apply Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase-schema.sql`
4. Paste and run the SQL

### 4. Test the Integration
1. Open `test-supabase-integration.html` in your browser
2. Run all the tests to verify everything works
3. Check your Supabase dashboard for data

## 🔄 How to Use

### Option 1: Replace Current Flow (Recommended)
Update your main quiz to use the new Supabase-tracked endpoint:

```javascript
// In your quiz submission function, change:
const response = await fetch('/api/process-complete-flow', {
    // ... existing code
});

// To:
const response = await fetch('/api/supabase-complete-flow', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        formData: formData,
        imageGenerationPrompts: {
            designPrompt: prompt
        }
    })
});
```

### Option 2: Add Analytics to Existing Flow
Include the analytics script in your main `index.html`:

```html
<!-- Add before closing </body> tag -->
<script src="supabase-analytics.js"></script>
```

This will automatically track:
- Page loads and navigation
- Button clicks and option selections
- Form input changes
- File uploads
- Quiz completion events

## 📊 Analytics Dashboard

### View Quiz Sessions
```sql
SELECT 
    email,
    dog_name,
    status,
    created_at,
    completed_at
FROM quiz_sessions 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Completion Rates
```sql
SELECT * FROM quiz_completion_stats;
```

### Popular Quiz Responses
```sql
SELECT * FROM popular_quiz_responses;
```

### User Journey Funnel
```sql
SELECT * FROM user_journey_funnel;
```

### Real-time Analytics
```sql
SELECT 
    event_type,
    COUNT(*) as count,
    DATE(timestamp) as date
FROM user_analytics 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type, DATE(timestamp)
ORDER BY count DESC;
```

## 🔍 What Gets Tracked

### Quiz Session Data
- **Basic Info**: Email, dog name, materials choice
- **Status Tracking**: started → photo_uploaded → design_generated → product_created → completed
- **Timestamps**: When each stage was completed
- **URLs**: Photo URL, render URL, product URL, checkout URL
- **Shopify Integration**: Product ID, variant ID
- **Email Delivery**: Whether confirmation email was sent
- **Error Handling**: Error messages and timestamps

### Individual Quiz Responses
- Every question and answer pair
- Timestamps for each response
- Linked to the main session

### User Behavior Analytics
- Page loads and navigation
- Button clicks and interactions
- Form input changes (without storing sensitive data)
- File upload events
- Time spent on each question
- Drop-off points

### Design Generation Tracking
- AI prompts used
- Generation success/failure
- Generation time in milliseconds
- Multiple iterations if user regenerates
- User feedback on designs

## 🚨 Error Tracking

All errors are automatically tracked with:
- Error type and message
- Context (what the user was doing)
- Session information
- Timestamp
- Stack trace (in development)

## 📈 Benefits Over Firebase

### ✅ Better Analytics
- Built-in SQL queries for complex analytics
- Real-time dashboards
- Custom views and aggregations

### ✅ Cost Effective
- More predictable pricing
- Better free tier limits
- No surprise bills

### ✅ Performance
- Faster queries with proper indexing
- Real-time subscriptions
- Edge functions for global performance

### ✅ Flexibility
- Full SQL access for complex queries
- Easy data export
- Integration with BI tools

## 🔧 Customization

### Add Custom Events
```javascript
// Track custom events
window.taiyakiAnalytics.track('custom_event', {
    custom_data: 'value',
    timestamp: new Date().toISOString()
});
```

### Add Custom Quiz Fields
Update the schema to track additional form fields:

```sql
-- Add new column to quiz_sessions
ALTER TABLE quiz_sessions 
ADD COLUMN new_field TEXT;

-- Track in quiz_responses
INSERT INTO quiz_responses (session_id, question_key, question_value)
VALUES (session_id, 'new_field', value);
```

## 🛡 Security

### Row Level Security (RLS)
- Service role (backend) has full access
- Anonymous users can only insert new records
- No direct read access from frontend

### Data Privacy
- No sensitive data stored in analytics events
- Email addresses are the only PII tracked
- User can request data deletion

## 🚀 Next Steps

1. **Test the Integration**: Use `test-supabase-integration.html`
2. **Update Main Quiz**: Switch to `/api/supabase-complete-flow`
3. **Add Analytics Script**: Include `supabase-analytics.js` in main page
4. **Monitor Dashboard**: Check Supabase for incoming data
5. **Set Up Alerts**: Configure notifications for errors

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables are set
3. Test with the integration test page
4. Check Supabase dashboard for error logs

## 🎯 Success Metrics

With this integration, you can now track:
- **Conversion Rate**: % of visitors who complete the quiz
- **Drop-off Points**: Where users abandon the process
- **Popular Choices**: Most selected materials, options
- **Performance**: How long each step takes
- **Errors**: What's causing failures
- **User Behavior**: How people interact with the quiz

This comprehensive tracking will help you optimize the quiz experience and improve conversion rates! 🎉 