# Supabase Integration Setup Guide

This guide will help you set up comprehensive tracking of every question response and photo upload per user session using Supabase.

## 🎯 What This Integration Tracks

### Session Data
- ✅ Unique session ID for each user
- ✅ Start time, completion time, and duration
- ✅ Current question and progress percentage
- ✅ User agent, screen resolution, and timezone
- ✅ Complete form data as JSON

### Question Responses
- ✅ Every single question response with timestamps
- ✅ Response type (text, option, email, phone)
- ✅ Question order and timing
- ✅ Real-time saving as users type (debounced)

### Photo Uploads
- ✅ All user-uploaded photos with metadata
- ✅ AI-generated images with prompts
- ✅ File size, type, and storage URLs
- ✅ Organized by session and question

## 🚀 Setup Steps

### 1. Create Supabase Database Tables

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to create all tables, indexes, and views

### 2. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create Bucket**
3. Name it `quiz-photos`
4. Make it **Public** (for easy access to uploaded images)
5. Click **Create**

### 3. Set Up Storage Policies

In the SQL Editor, run these commands to allow public uploads:

```sql
-- Allow public uploads to quiz-photos bucket
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'quiz-photos');

-- Allow public downloads from quiz-photos bucket
CREATE POLICY "Allow public downloads" ON storage.objects
    FOR SELECT USING (bucket_id = 'quiz-photos');
```

### 4. Verify Environment Variables

Make sure your `env.local` file has the correct Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Test the Integration

1. Open your quiz in a browser
2. Open Developer Tools (F12)
3. Go to the **Console** tab
4. You should see these messages:
   ```
   🟢 Supabase Quiz Integration loaded successfully!
   🟢 Supabase client initialized successfully
   🟢 Supabase quiz session initialized: quiz_1234567890_abcdef123
   ✅ Session record created in Supabase
   ```

## 📊 Data Structure

### quiz_sessions Table
```sql
session_id          | TEXT    | Unique identifier for each quiz session
started_at          | TIMESTAMP | When the session began
completed_at        | TIMESTAMP | When the session was completed (null if incomplete)
current_question    | TEXT    | Current question ID (Q1, Q2, materials, etc.)
status              | TEXT    | 'in_progress', 'completed', or 'abandoned'
progress_percentage | INTEGER | 0-100 completion percentage
form_data          | JSONB   | Complete form data as JSON
user_agent         | TEXT    | Browser/device information
screen_resolution  | TEXT    | Screen size (e.g., "1920x1080")
timezone           | TEXT    | User's timezone
```

### quiz_responses Table
```sql
session_id     | TEXT    | Links to quiz_sessions
question_id    | TEXT    | Question identifier (Q1, Q2, materials, contact_email, etc.)
response       | TEXT    | The actual response/answer
response_type  | TEXT    | 'text', 'option', 'email', 'phone', 'file'
question_order | INTEGER | Order in which question was answered
answered_at    | TIMESTAMP | When the response was given
```

### quiz_photos Table
```sql
session_id        | TEXT    | Links to quiz_sessions
question_id       | TEXT    | Which question the photo belongs to
file_name         | TEXT    | Storage filename
file_url          | TEXT    | Public URL to access the photo
file_size         | BIGINT  | File size in bytes
file_type         | TEXT    | MIME type (image/jpeg, image/png, etc.)
generation_prompt | TEXT    | AI prompt used (for generated images)
uploaded_at       | TIMESTAMP | When the photo was uploaded
```

## 🔍 Analytics Views

The integration includes pre-built analytics views:

### session_analytics
- Session duration, completion rates
- Device and browser statistics
- Photo and response counts per session

### question_analytics
- Response patterns by question
- Most/least answered questions
- Average question order

## 📈 Monitoring and Analytics

### View Session Data
```sql
-- Recent sessions
SELECT * FROM session_analytics 
ORDER BY started_at DESC 
LIMIT 10;

-- Completion rate
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM quiz_sessions 
GROUP BY status;
```

### View Question Performance
```sql
-- Most answered questions
SELECT * FROM question_analytics 
ORDER BY response_count DESC;

-- Average session duration
SELECT 
    AVG(session_duration_seconds) as avg_duration_seconds,
    AVG(session_duration_seconds) / 60 as avg_duration_minutes
FROM session_analytics 
WHERE status = 'completed';
```

### View Photo Uploads
```sql
-- Photo upload statistics
SELECT 
    question_id,
    COUNT(*) as photo_count,
    AVG(file_size) as avg_file_size,
    COUNT(DISTINCT session_id) as unique_sessions
FROM quiz_photos 
GROUP BY question_id
ORDER BY photo_count DESC;
```

## 🔧 How It Works

### Real-time Tracking
- **Session Creation**: Automatic when page loads
- **Question Responses**: Saved immediately when answered
- **Text Input**: Debounced saving (1 second after typing stops)
- **Photo Uploads**: Uploaded to Supabase Storage immediately
- **Progress Updates**: Real-time progress percentage tracking

### Function Hooks
The integration hooks into existing quiz functions:
- `selectOption()` - Saves option selections
- `handleFileUpload()` - Uploads photos to Supabase
- `submitForm()` - Saves complete form data
- `generateImage()` - Saves AI-generated images

### Error Handling
- Graceful fallbacks if Supabase is unavailable
- Console logging for debugging
- Non-blocking - quiz continues even if tracking fails

## 🛡️ Security

### Row Level Security (RLS)
- Enabled on all tables
- Public policies for quiz functionality
- Can be customized for stricter access control

### Data Privacy
- No personally identifiable information stored by default
- Email/phone stored only when user provides them
- Session IDs are unique but not personally identifiable

## 🚨 Troubleshooting

### Common Issues

**"Supabase client not initialized"**
- Check your SUPABASE_URL and SUPABASE_ANON_KEY
- Verify the Supabase CDN script is loading

**"Error creating session record"**
- Ensure the database tables are created
- Check RLS policies are set up correctly

**"Error uploading photo"**
- Verify the `quiz-photos` storage bucket exists
- Check storage policies allow public uploads

**"No responses being saved"**
- Check browser console for JavaScript errors
- Verify the integration script is loaded before the quiz

### Debug Mode
Add this to your browser console to enable detailed logging:
```javascript
window.SupabaseQuizIntegration.debug = true;
```

## 📋 Next Steps

1. **Run the SQL schema** in your Supabase dashboard
2. **Create the storage bucket** and policies
3. **Test the integration** with a complete quiz session
4. **Monitor the data** in your Supabase dashboard
5. **Set up analytics dashboards** using the provided views

Your quiz will now track every single interaction, providing comprehensive insights into user behavior and completion patterns! 🎉 