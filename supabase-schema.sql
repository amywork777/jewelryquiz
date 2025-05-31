-- Supabase Database Schema for Quiz Tracking
-- Run these commands in your Supabase SQL Editor

-- Table for quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    current_question TEXT,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    progress_percentage INTEGER DEFAULT 0,
    form_data JSONB,
    user_agent TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for individual question responses
CREATE TABLE IF NOT EXISTS quiz_responses (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES quiz_sessions(session_id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    response TEXT,
    response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'option', 'email', 'phone', 'file')),
    question_order INTEGER,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for photo uploads
CREATE TABLE IF NOT EXISTS quiz_photos (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES quiz_sessions(session_id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    generation_prompt TEXT, -- For AI-generated images
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_session_id ON quiz_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started_at ON quiz_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_session_id ON quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question_id ON quiz_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_answered_at ON quiz_responses(answered_at);

CREATE INDEX IF NOT EXISTS idx_quiz_photos_session_id ON quiz_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_photos_question_id ON quiz_photos(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_photos_uploaded_at ON quiz_photos(uploaded_at);

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public insert on quiz_sessions" ON quiz_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on quiz_sessions" ON quiz_sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow public update on quiz_sessions" ON quiz_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on quiz_responses" ON quiz_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on quiz_responses" ON quiz_responses
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on quiz_photos" ON quiz_photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on quiz_photos" ON quiz_photos
    FOR SELECT USING (true);

-- Create storage bucket for photos (run this in the Supabase dashboard Storage section)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('quiz-photos', 'quiz-photos', true);

-- Create storage policy for photos
-- CREATE POLICY "Allow public uploads" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'quiz-photos');

-- CREATE POLICY "Allow public downloads" ON storage.objects
--     FOR SELECT USING (bucket_id = 'quiz-photos');

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on quiz_sessions
CREATE TRIGGER update_quiz_sessions_updated_at 
    BEFORE UPDATE ON quiz_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View for session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    qs.session_id,
    qs.started_at,
    qs.completed_at,
    qs.status,
    qs.progress_percentage,
    qs.user_agent,
    qs.screen_resolution,
    qs.timezone,
    COUNT(qr.id) as total_responses,
    COUNT(qp.id) as total_photos,
    EXTRACT(EPOCH FROM (COALESCE(qs.completed_at, qs.last_activity) - qs.started_at)) as session_duration_seconds
FROM quiz_sessions qs
LEFT JOIN quiz_responses qr ON qs.session_id = qr.session_id
LEFT JOIN quiz_photos qp ON qs.session_id = qp.session_id
GROUP BY qs.session_id, qs.started_at, qs.completed_at, qs.status, qs.progress_percentage, 
         qs.user_agent, qs.screen_resolution, qs.timezone;

-- View for question analytics
CREATE OR REPLACE VIEW question_analytics AS
SELECT 
    question_id,
    response_type,
    COUNT(*) as response_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(question_order) as avg_question_order
FROM quiz_responses
GROUP BY question_id, response_type
ORDER BY avg_question_order, question_id;

-- Comments for documentation
COMMENT ON TABLE quiz_sessions IS 'Tracks individual quiz sessions with metadata and completion status';
COMMENT ON TABLE quiz_responses IS 'Stores individual question responses with timestamps and types';
COMMENT ON TABLE quiz_photos IS 'Tracks all photo uploads including user photos and AI-generated images';
COMMENT ON VIEW session_analytics IS 'Provides analytics data for quiz sessions including duration and completion rates';
COMMENT ON VIEW question_analytics IS 'Provides analytics data for individual questions and response patterns'; 