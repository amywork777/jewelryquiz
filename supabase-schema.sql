-- Supabase Database Schema for Taiyaki Dog Charm Quiz
-- This schema tracks all parts of the quiz and design process

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main table for tracking each user's complete journey
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT UNIQUE NOT NULL,
    design_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    dog_name TEXT,
    status TEXT NOT NULL DEFAULT 'started',
    form_data JSONB,
    photo_url TEXT,
    render_url TEXT,
    ai_prompt TEXT,
    shopify_product_id TEXT,
    shopify_variant_id TEXT,
    product_url TEXT,
    checkout_url TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_id TEXT,
    error_message TEXT,
    
    -- Timestamps for each stage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    photo_uploaded_at TIMESTAMP WITH TIME ZONE,
    design_generated_at TIMESTAMP WITH TIME ZONE,
    shopify_created_at TIMESTAMP WITH TIME ZONE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional tracking
    user_agent TEXT,
    ip_address INET,
    referrer TEXT
);

-- Detailed breakdown of individual quiz answers
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL REFERENCES quiz_sessions(session_id),
    question_key TEXT NOT NULL,
    question_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user behavior and interactions
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT REFERENCES quiz_sessions(session_id),
    event_type TEXT NOT NULL,
    event_data JSONB,
    page_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track design generation and regenerations
CREATE TABLE design_iterations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL REFERENCES quiz_sessions(session_id),
    iteration_number INTEGER NOT NULL DEFAULT 1,
    prompt_used TEXT,
    render_url TEXT,
    generation_time_ms INTEGER,
    user_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quiz_sessions_email ON quiz_sessions(email);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_quiz_sessions_created_at ON quiz_sessions(created_at);
CREATE INDEX idx_quiz_responses_session_id ON quiz_responses(session_id);
CREATE INDEX idx_user_analytics_session_id ON user_analytics(session_id);
CREATE INDEX idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX idx_design_iterations_session_id ON design_iterations(session_id);

-- Row Level Security (RLS) policies
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_iterations ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend API) full access
CREATE POLICY "Service role can do everything" ON quiz_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON quiz_responses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON user_analytics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON design_iterations
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous users to insert new records only
CREATE POLICY "Anonymous can insert quiz sessions" ON quiz_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can insert quiz responses" ON quiz_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can insert user analytics" ON user_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can insert design iterations" ON design_iterations
    FOR INSERT WITH CHECK (true);

-- Analytics views for easy querying
CREATE VIEW quiz_completion_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as error_sessions,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as completion_rate
FROM quiz_sessions 
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE VIEW popular_quiz_responses AS
SELECT 
    question_key,
    question_value,
    COUNT(*) as response_count,
    ROUND(
        COUNT(*)::DECIMAL / 
        (SELECT COUNT(DISTINCT session_id) FROM quiz_responses)::DECIMAL * 100, 2
    ) as percentage
FROM quiz_responses 
WHERE question_value IS NOT NULL
GROUP BY question_key, question_value
ORDER BY question_key, response_count DESC;

CREATE VIEW user_journey_funnel AS
SELECT 
    'Started Quiz' as stage,
    COUNT(*) as users,
    100.0 as percentage
FROM quiz_sessions
UNION ALL
SELECT 
    'Uploaded Photo' as stage,
    COUNT(*) as users,
    ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM quiz_sessions)::DECIMAL * 100, 2) as percentage
FROM quiz_sessions 
WHERE photo_uploaded_at IS NOT NULL
UNION ALL
SELECT 
    'Generated Design' as stage,
    COUNT(*) as users,
    ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM quiz_sessions)::DECIMAL * 100, 2) as percentage
FROM quiz_sessions 
WHERE design_generated_at IS NOT NULL
UNION ALL
SELECT 
    'Created Product' as stage,
    COUNT(*) as users,
    ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM quiz_sessions)::DECIMAL * 100, 2) as percentage
FROM quiz_sessions 
WHERE shopify_created_at IS NOT NULL
UNION ALL
SELECT 
    'Completed Flow' as stage,
    COUNT(*) as users,
    ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM quiz_sessions)::DECIMAL * 100, 2) as percentage
FROM quiz_sessions 
WHERE completed_at IS NOT NULL
ORDER BY 
    CASE stage
        WHEN 'Started Quiz' THEN 1
        WHEN 'Uploaded Photo' THEN 2
        WHEN 'Generated Design' THEN 3
        WHEN 'Created Product' THEN 4
        WHEN 'Completed Flow' THEN 5
    END; 