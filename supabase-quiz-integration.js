// Supabase Quiz Integration
// Tracks every question response and photo upload per user session

(function() {
    'use strict';

    // Supabase configuration
    const SUPABASE_URL = 'https://shesgtnhozprxtztouih.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZXNndG5ob3pwcnh0enRvdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NTk3NjMsImV4cCI6MjA2NDIzNTc2M30.Mf5UU8Cut5lOxULfLAc6C0fTnAt3nbLfCp6Tkk1WEbI';

    // Initialize Supabase client
    let supabase;
    
    // Session management
    let currentSessionId = null;
    let sessionStartTime = null;

    // Initialize Supabase
    function initSupabase() {
        try {
            // Import Supabase from CDN
            if (typeof window.supabase === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = function() {
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    console.log('🟢 Supabase client initialized successfully');
                    initializeSession();
                };
                document.head.appendChild(script);
            } else {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('🟢 Supabase client initialized successfully');
                initializeSession();
            }
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
        }
    }

    // Initialize a new quiz session
    function initializeSession() {
        currentSessionId = generateSessionId();
        sessionStartTime = new Date().toISOString();
        
        console.log('🟢 Supabase quiz session initialized:', currentSessionId);
        
        // Create initial session record
        createSessionRecord();
    }

    // Generate unique session ID
    function generateSessionId() {
        return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Create session record in Supabase
    async function createSessionRecord() {
        if (!supabase || !currentSessionId) {
            console.error('❌ Cannot create session: supabase or sessionId missing');
            return;
        }

        try {
            console.log('🔄 Creating session record with ID:', currentSessionId);
            
            const sessionData = {
                session_id: currentSessionId,
                current_question: 'Q1',
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            console.log('📝 Session data to insert:', sessionData);

            const { data, error } = await supabase
                .from('quiz_sessions')
                .insert([sessionData]);

            if (error) {
                console.error('❌ Error creating session record:', error);
                console.error('❌ Error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
            } else {
                console.log('✅ Session record created in Supabase');
                console.log('✅ Session data:', data);
            }
        } catch (error) {
            console.error('❌ Exception creating session record:', error);
            console.error('❌ Exception details:', error.message, error.stack);
        }
    }

    // Save question response to Supabase
    async function saveQuestionResponse(questionId, response, responseType = 'text') {
        if (!supabase || !currentSessionId) return;

        try {
            const responseData = {
                session_id: currentSessionId,
                question_id: questionId,
                response: typeof response === 'object' ? JSON.stringify(response) : response,
                response_type: responseType,
                answered_at: new Date().toISOString(),
                question_order: window.currentQuestionIndex || 0
            };

            const { data, error } = await supabase
                .from('quiz_responses')
                .insert([responseData]);

            if (error) {
                console.error('❌ Error saving question response:', error);
            } else {
                console.log(`✅ Saved ${questionId} response to Supabase:`, response);
            }

            // Also update the session record with current progress
            await updateSessionProgress(questionId);

        } catch (error) {
            console.error('❌ Error saving question response:', error);
        }
    }

    // Update session progress
    async function updateSessionProgress(currentQuestion) {
        if (!supabase || !currentSessionId) return;

        try {
            const { data, error } = await supabase
                .from('quiz_sessions')
                .update({
                    current_question: currentQuestion,
                    last_activity: new Date().toISOString(),
                    progress_percentage: calculateProgress()
                })
                .eq('session_id', currentSessionId);

            if (error) {
                console.error('❌ Error updating session progress:', error);
            }
        } catch (error) {
            console.error('❌ Error updating session progress:', error);
        }
    }

    // Calculate progress percentage
    function calculateProgress() {
        if (!window.questionFlow || !window.currentQuestionIndex) return 0;
        return Math.round((window.currentQuestionIndex / window.questionFlow.length) * 100);
    }

    // Upload photo to Supabase Storage
    async function uploadPhoto(file, questionId) {
        if (!supabase || !currentSessionId || !file) return null;

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentSessionId}/${questionId}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('quiz-photos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Error uploading photo:', error);
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('quiz-photos')
                .getPublicUrl(fileName);

            const photoUrl = urlData.publicUrl;

            // Save photo record to database
            await savePhotoRecord(questionId, fileName, photoUrl, file);

            console.log('✅ Photo uploaded to Supabase:', photoUrl);
            return photoUrl;

        } catch (error) {
            console.error('❌ Error uploading photo:', error);
            return null;
        }
    }

    // Save photo record to database
    async function savePhotoRecord(questionId, fileName, photoUrl, file) {
        if (!supabase || !currentSessionId) return;

        try {
            const photoData = {
                session_id: currentSessionId,
                question_id: questionId,
                file_name: fileName,
                file_url: photoUrl,
                file_size: file.size,
                file_type: file.type,
                uploaded_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('quiz_photos')
                .insert([photoData]);

            if (error) {
                console.error('❌ Error saving photo record:', error);
            } else {
                console.log('✅ Photo record saved to Supabase');
            }
        } catch (error) {
            console.error('❌ Error saving photo record:', error);
        }
    }

    // Save complete form data
    async function saveCompleteFormData(formData) {
        if (!supabase || !currentSessionId) return;

        try {
            const { data, error } = await supabase
                .from('quiz_sessions')
                .update({
                    form_data: formData,
                    completed_at: new Date().toISOString(),
                    status: 'completed'
                })
                .eq('session_id', currentSessionId);

            if (error) {
                console.error('❌ Error saving complete form data:', error);
            } else {
                console.log('✅ Complete form data saved to Supabase');
            }
        } catch (error) {
            console.error('❌ Error saving complete form data:', error);
        }
    }

    // Save generated image
    async function saveGeneratedImage(imageData, prompt) {
        if (!supabase || !currentSessionId) return;

        try {
            // Convert base64 to blob
            const response = await fetch(imageData);
            const blob = await response.blob();

            // Upload image
            const fileName = `${currentSessionId}/generated_${Date.now()}.png`;
            const { data, error } = await supabase.storage
                .from('quiz-photos')
                .upload(fileName, blob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Error uploading generated image:', error);
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('quiz-photos')
                .getPublicUrl(fileName);

            const imageUrl = urlData.publicUrl;

            // Save generated image record
            const imageRecord = {
                session_id: currentSessionId,
                question_id: 'generated_image',
                file_name: fileName,
                file_url: imageUrl,
                file_type: 'image/png',
                generation_prompt: prompt,
                uploaded_at: new Date().toISOString()
            };

            await supabase
                .from('quiz_photos')
                .insert([imageRecord]);

            console.log('✅ Generated image saved to Supabase:', imageUrl);
            return imageUrl;

        } catch (error) {
            console.error('❌ Error saving generated image:', error);
            return null;
        }
    }

    // Hook into existing quiz functions
    function setupQuizHooks() {
        // Hook into option selection
        const originalSelectOption = window.selectOption;
        window.selectOption = function(element, value) {
            console.log('🎯 Option selected:', value);
            
            // Call original function
            if (originalSelectOption) {
                originalSelectOption(element, value);
            }

            // Save to Supabase
            const questionContainer = element.closest('.question-container');
            const questionId = questionContainer ? questionContainer.dataset.question : 'unknown';
            console.log('💾 Saving option response:', questionId, value);
            saveQuestionResponse(questionId, value, 'option');
        };

        // Hook into nextQuestion function to capture when questions change
        const originalNextQuestion = window.nextQuestion;
        window.nextQuestion = function() {
            console.log('🔄 Next question called');
            
            // Call original function first
            if (originalNextQuestion) {
                originalNextQuestion();
            }

            // Capture any form data that might have been entered
            setTimeout(() => {
                captureCurrentQuestionData();
            }, 100);
        };

        // Function to capture current question data
        function captureCurrentQuestionData() {
            const activeQuestion = document.querySelector('.question-container.active');
            if (!activeQuestion) return;

            const questionId = activeQuestion.dataset.question;
            console.log('📝 Capturing data for question:', questionId);

            // Check for text inputs in current question
            const textInputs = activeQuestion.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
            textInputs.forEach(input => {
                if (input.value && input.value.trim() !== '') {
                    console.log('💾 Saving text input:', input.id, input.value);
                    saveQuestionResponse(questionId, input.value, input.type === 'email' ? 'email' : input.type === 'tel' ? 'phone' : 'text');
                }
            });

            // Check for selected options
            const selectedOptions = activeQuestion.querySelectorAll('.option.selected');
            selectedOptions.forEach(option => {
                const value = option.textContent || option.dataset.value;
                if (value) {
                    console.log('💾 Saving selected option:', questionId, value);
                    saveQuestionResponse(questionId, value, 'option');
                }
            });

            // Check for file uploads
            const fileInputs = activeQuestion.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
                if (input.files && input.files.length > 0) {
                    console.log('📸 Found uploaded file:', input.files[0].name);
                    uploadPhoto(input.files[0], questionId);
                }
            });
        }

        // Hook into text input changes with a simpler approach
        function setupTextInputHooks() {
            // Add listeners to all text inputs
            const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
            allInputs.forEach(input => {
                if (!input.dataset.supabaseListenerAdded) {
                    input.addEventListener('input', debounce(function() {
                        if (this && this.value !== undefined && this.value.trim() !== '') {
                            const questionContainer = this.closest('.question-container');
                            const questionId = questionContainer ? questionContainer.dataset.question : this.id;
                            console.log('💾 Saving text input (live):', questionId, this.value);
                            saveQuestionResponse(questionId, this.value, this.type === 'email' ? 'email' : this.type === 'tel' ? 'phone' : 'text');
                        }
                    }, 1000));
                    input.dataset.supabaseListenerAdded = 'true';
                    console.log(`✅ Added listener for ${input.id || input.type}`);
                }
            });
        }

        // Hook into file upload
        const originalHandleFileUpload = window.handleFileUpload;
        window.handleFileUpload = async function(inputId) {
            console.log('📸 File upload triggered for:', inputId);
            
            // Call original function
            if (originalHandleFileUpload) {
                originalHandleFileUpload(inputId);
            }

            // Upload to Supabase
            const input = document.getElementById(inputId);
            const file = input && input.files ? input.files[0] : null;
            if (file) {
                const questionContainer = input.closest('.question-container');
                const questionId = questionContainer ? questionContainer.dataset.question : 'Q1';
                console.log('📸 Uploading photo to Supabase:', file.name, 'for question:', questionId);
                await uploadPhoto(file, questionId);
            }
        };

        // Hook into form submission
        const originalSubmitForm = window.submitForm;
        window.submitForm = function() {
            // Save complete form data
            saveCompleteFormData(window.formData);

            // Call original function
            if (originalSubmitForm) {
                originalSubmitForm();
            }
        };

        // Hook into image generation
        const originalGenerateImage = window.generateImage;
        window.generateImage = async function(prompt, photoData) {
            let result = null;
            
            // Call original function
            if (originalGenerateImage) {
                result = await originalGenerateImage(prompt, photoData);
            }

            // Save generated image to Supabase
            if (result) {
                await saveGeneratedImage(result, prompt);
            }

            return result;
        };

        // Setup text input hooks after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupTextInputHooks);
        } else {
            setupTextInputHooks();
        }

        // Also retry setting up hooks after a delay in case elements are added dynamically
        setTimeout(() => {
            console.log('🔄 Retrying text input hooks setup...');
            setupTextInputHooks();
        }, 2000);

        // Set up a mutation observer to catch dynamically added elements
        if (document.body) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Element node
                                const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea') : [];
                                if (inputs.length > 0) {
                                    console.log('🔄 New form elements detected, setting up hooks...');
                                    setupTextInputHooks();
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // If document.body doesn't exist yet, wait for it
            document.addEventListener('DOMContentLoaded', () => {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach((node) => {
                                if (node.nodeType === 1) { // Element node
                                    const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea') : [];
                                    if (inputs.length > 0) {
                                        console.log('🔄 New form elements detected, setting up hooks...');
                                        setupTextInputHooks();
                                    }
                                }
                            });
                        }
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }

    // Debounce function for text inputs
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Check integration status
    async function checkIntegrationStatus() {
        const status = {
            supabaseConnected: !!supabase,
            sessionId: currentSessionId,
            sessionStartTime: sessionStartTime,
            errors: []
        };

        if (supabase && currentSessionId) {
            try {
                // Test if we can read from the session
                const { data, error } = await supabase
                    .from('quiz_sessions')
                    .select('*')
                    .eq('session_id', currentSessionId)
                    .single();

                if (error) {
                    status.errors.push(`Session read error: ${error.message}`);
                    status.sessionExists = false;
                } else {
                    status.sessionExists = true;
                    status.sessionData = data;
                }
            } catch (error) {
                status.errors.push(`Exception checking session: ${error.message}`);
            }
        }

        return status;
    }

    // Public API
    window.SupabaseQuizIntegration = {
        saveQuestionResponse,
        uploadPhoto,
        saveCompleteFormData,
        saveGeneratedImage,
        getCurrentSessionId: () => currentSessionId,
        checkStatus: checkIntegrationStatus
    };

    // Initialize when script loads
    initSupabase();
    setupQuizHooks();

    console.log('🟢 Supabase Quiz Integration loaded successfully!');

})(); 