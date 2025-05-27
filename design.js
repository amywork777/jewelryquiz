// Design page JavaScript
let selectedDesignNumber = null;
let selectedMaterial = 'sterling-silver';

// Get form data from URL parameters or localStorage
function getFormData() {
    const urlParams = new URLSearchParams(window.location.search);
    const formDataParam = urlParams.get('data');
    
    if (formDataParam) {
        try {
            return JSON.parse(decodeURIComponent(formDataParam));
        } catch (error) {
            console.error('Error parsing form data from URL:', error);
        }
    }
    
    // Fallback to localStorage
    const storedData = localStorage.getItem('jewelryQuizData');
    if (storedData) {
        try {
            return JSON.parse(storedData);
        } catch (error) {
            console.error('Error parsing stored form data:', error);
        }
    }
    
    return null;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const formData = getFormData();
    
    if (!formData) {
        showError('No design data found. Please complete the quiz first.');
        return;
    }
    
    console.log('Form data loaded:', formData);
    generateCharmImage(formData);
});

function showError(message) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="error-container">
            <h2>Oops!</h2>
            <p>${message}</p>
            <a href="/" style="color: #000000; text-decoration: underline;">Return to Quiz</a>
        </div>
    `;
}

// Material selection functions
function selectMaterial(material) {
    selectedMaterial = material;
    
    document.querySelectorAll('.material-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById(`material-${material}`).classList.add('selected');
    
    updateMainPrice();
    updateSelectionStatus();
    updateBuyButton();
}

function selectDesign(designNumber) {
    selectedDesignNumber = designNumber;
    
    document.querySelectorAll('.select-image-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.textContent = 'Select This Design';
    });
    
    document.querySelectorAll('.product-image-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedBtn = document.getElementById(`select-btn-${designNumber}`);
    const selectedCard = document.getElementById(`image-card-${designNumber}`);
    
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
        selectedBtn.textContent = 'Selected ✓';
    }
    
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    updateSelectionStatus();
    updateBuyButton();
}

function updateSelectionStatus() {
    const statusDiv = document.getElementById('selection-status');
    const designText = document.getElementById('selected-design-text');
    const materialText = document.getElementById('selected-material-text');
    
    if (designText) {
        if (selectedDesignNumber) {
            const designType = selectedDesignNumber === 1 ? 'Classic Elegant' : 'Modern Sculptural';
            designText.textContent = `Design ${selectedDesignNumber} (${designType})`;
        } else {
            designText.textContent = 'Not selected';
        }
    }
    
    if (materialText) {
        const materialNames = {
            'sterling-silver': 'Sterling Silver',
            'gold-plated': 'Gold-Plated',
            '14k-gold': '14K Gold'
        };
        materialText.textContent = materialNames[selectedMaterial] || 'Sterling Silver';
    }
    
    if (statusDiv) {
        if (selectedDesignNumber && selectedMaterial) {
            statusDiv.classList.add('has-selection');
        } else {
            statusDiv.classList.remove('has-selection');
        }
    }
}

function updateBuyButton() {
    const buyButton = document.getElementById('main-buy-button');
    
    if (selectedDesignNumber && selectedMaterial) {
        buyButton.classList.add('enabled');
        buyButton.textContent = 'Buy Now';
        buyButton.removeAttribute('disabled');
    } else {
        buyButton.classList.remove('enabled');
        buyButton.textContent = 'Select a Design to Continue';
        buyButton.setAttribute('disabled', 'true');
    }
}

function updateMainPrice() {
    const priceDisplay = document.getElementById('main-price-display');
    
    const prices = {
        'sterling-silver': '$50',
        'gold-plated': '$50',
        '14k-gold': '$200'
    };
    
    if (priceDisplay) {
        priceDisplay.textContent = prices[selectedMaterial];
    }
}

function toggleRefineSection(designNumber) {
    const content = document.getElementById(`refine-content-${designNumber}`);
    const arrow = document.getElementById(`refine-arrow-${designNumber}`);
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        if (arrow) arrow.textContent = '▲';
    } else {
        content.style.display = 'none';
        if (arrow) arrow.textContent = '▼';
    }
}

function purchaseSelectedDesign() {
    if (!selectedDesignNumber) {
        alert('Please select a design first.');
        return;
    }
    
    if (!selectedMaterial) {
        alert('Please select a material first.');
        return;
    }
    
    purchaseSpecificDesign(selectedDesignNumber, selectedMaterial);
}

function purchaseSpecificDesign(designNumber, material) {
    const formData = getFormData();
    
    const purchaseData = {
        designNumber: designNumber,
        material: material,
        email: formData.email,
        phone: formData.phone,
        designResponses: formData,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('jewelryPurchaseData', JSON.stringify(purchaseData));
    
    const stripeUrls = {
        'sterling-silver': 'https://buy.stripe.com/14AbJ05fH2R3ffwadNbEA01',
        'gold-plated': 'https://buy.stripe.com/fZueVc23vdvH2sK85FbEA02',
        '14k-gold': 'https://buy.stripe.com/bJe8wObE5crD8R84TtbEA03'
    };
    
    const materialNames = {
        'sterling-silver': 'Sterling Silver ($50)',
        'gold-plated': 'Gold-Plated Silver ($50)',
        '14k-gold': '14K Gold ($200)'
    };
    
    const confirmed = confirm(`Purchase: Design ${designNumber} in ${materialNames[material]}\n\nFree shipping included\n30-day guarantee\nSecure Stripe checkout\n\nProceed to checkout?`);
    
    if (confirmed) {
        window.open(stripeUrls[material], '_blank');
        showPurchaseInitiatedMessage(material, designNumber);
    }
}

function showPurchaseInitiatedMessage(material, designNumber) {
    const materialNames = {
        'sterling-silver': 'Sterling Silver',
        'gold-plated': 'Gold-Plated Silver', 
        '14k-gold': '14K Gold'
    };
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border: 2px solid #000000; text-align: center; max-width: 550px; margin: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <h3 style="margin: 0 0 15px 0; color: #000; font-size: 26px; font-weight: 500;">Purchase Initiated!</h3>
            <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                <p style="margin: 0; color: #000000; font-size: 16px; font-weight: 500;">
                    Custom Charm Design ${designNumber}<br>
                    <span style="color: #666; font-weight: 400;">${materialNames[material]}</span>
                </p>
            </div>
            <p style="margin: 0 0 25px 0; color: #000000; font-size: 16px; line-height: 1.5; font-weight: 300;">
                Complete your secure checkout in the window that just opened.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; text-align: left;">
                <div style="background: #e8f5e8; padding: 12px; border: 1px solid #28a745;">
                    <div style="font-size: 14px; font-weight: 500; color: #155724; margin-bottom: 4px;">Free Shipping</div>
                    <div style="font-size: 12px; color: #155724;">No additional costs</div>
                </div>
                <div style="background: #e8f5e8; padding: 12px; border: 1px solid #28a745;">
                    <div style="font-size: 14px; font-weight: 500; color: #155724; margin-bottom: 4px;">Fast Delivery</div>
                    <div style="font-size: 12px; color: #155724;">5-7 business days</div>
                </div>
            </div>
            
            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 15px 25px; background: #000000; color: #ffffff; border: none; font-size: 16px; cursor: pointer; transition: all 0.3s ease; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;" onmouseover="this.style.background='#333333';" onmouseout="this.style.background='#000000';">
                Continue Shopping
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 10000);
}

// Main image generation function
async function generateCharmImage(responses) {
    try {
        console.log('=== Starting generateCharmImage ===');
        console.log('window.CONFIG:', window.CONFIG);
        console.log('window.OPENAI_API_KEY:', window.OPENAI_API_KEY);
        
        const promptData = generatePromptFromResponses(responses);
        
        // Check if we have uploaded images to incorporate
        const hasUploadedImages = responses.uploaded_images?.Q2_images?.length > 0 || 
                                responses.uploaded_images?.Q7_images?.length > 0 || 
                                responses.uploaded_images?.Q9_images?.length > 0;
        
        let promptText = buildPromptText(responses, promptData, hasUploadedImages);
        
        console.log('Generated prompt:', promptText);
        console.log('Has uploaded images:', hasUploadedImages);
        
        // Get API key
        let apiKey = window.CONFIG?.OPENAI_API_KEY || window.OPENAI_API_KEY;
        console.log('API key available:', !!apiKey);
        
        if (!apiKey) {
            throw new Error('API key not available');
        }
        
        // Generate images
        const data = await generateImages(promptText, hasUploadedImages, responses, apiKey);
        
        if (data && data.output && data.output.length > 0) {
            displayResults(data, responses, hasUploadedImages);
        } else {
            throw new Error('No images generated');
        }
        
    } catch (error) {
        console.error('Error generating image:', error);
        showError('Image generation temporarily unavailable. We\'ll still create your custom design manually!');
    }
}

function buildPromptText(responses, promptData, hasUploadedImages) {
    if (hasUploadedImages) {
        if (responses.uploaded_images?.Q2_images?.length > 0) {
            return `Transform this image into a single ${promptData.material} charm with a jump ring. Create two distinct design variations: 

DESIGN 1 - Classic Elegant: Create the main subject/object from the image as a refined relief design with elegant, sophisticated details. Use clean lines, smooth surfaces, and subtle dimensional variations. The design should have a timeless, traditional jewelry aesthetic with polished, refined forms. Focus on graceful proportions and classic beauty that would appeal to traditional jewelry lovers.

DESIGN 2 - Modern Sculptural: Transform the subject/object from the image into a bold, contemporary 3D sculptural charm with dramatic dimensional presence. Use chunky, artistic forms with interesting textures and bold geometric shapes. Make it statement-making and eye-catching with strong sculptural qualities. Focus on modern, artistic interpretation that would appeal to fashion-forward individuals.

${promptData.manufacturing_rules}

DESIGN 1 should have a classic, refined jewelry aesthetic with elegant details. DESIGN 2 should be bold, modern, and sculptural with strong 3D presence. Both must have a jump ring for attachment. ${promptData.lighting}. ${promptData.background}. ${promptData.presentation}. ${promptData.camera}.`;
        } else {
            // Build detailed user preferences
            let detailedPreferences = `
USER SURVEY RESPONSES TO INCORPORATE:
- Material: ${promptData.material}
- Style: ${promptData.style}
- Subject/Theme: ${promptData.subject}`;

            if (responses.inspiration) detailedPreferences += `\n- Story/Inspiration: ${responses.inspiration}`;
            if (responses.all_text_responses?.Q6_symbols) detailedPreferences += `\n- Meaningful Symbols/Elements: ${responses.all_text_responses.Q6_symbols}`;
            if (responses.all_text_responses?.Q8_idea_description) detailedPreferences += `\n- User's Idea Description: ${responses.all_text_responses.Q8_idea_description}`;
            if (responses.style_vibes?.length > 0) detailedPreferences += `\n- Style Vibes: ${responses.style_vibes.join(', ')}`;
            if (responses.size_presence) detailedPreferences += `\n- Size Preference: ${responses.size_presence}`;
            if (responses.all_text_responses?.Q13_special_details) detailedPreferences += `\n- Special Details/Requests: ${responses.all_text_responses.Q13_special_details}`;
            if (responses.recipient) detailedPreferences += `\n- Recipient: ${responses.recipient}`;

            return `Create a single ${promptData.subject} charm with a jump ring, combining the user's specific survey responses with inspiration from the reference image(s). Generate 2 distinct style variations:

${detailedPreferences}

DESIGN 1 - Classic Elegant: Create a refined interpretation that incorporates ALL the user's survey responses above with elegant, sophisticated details. Use clean lines, smooth surfaces, and subtle dimensional variations. The design should have a timeless, traditional jewelry aesthetic with polished, refined forms. Focus on graceful proportions and classic beauty while incorporating the requested symbols, story elements, and style preferences.

DESIGN 2 - Modern Sculptural: Transform the concept into a bold, contemporary 3D sculptural charm with dramatic dimensional presence, incorporating ALL the user's survey responses. Use chunky, artistic forms with interesting textures and bold geometric shapes. Make it statement-making and eye-catching with strong sculptural qualities. Focus on modern, artistic interpretation of the user's requests.

${promptData.manufacturing_rules}

Both designs must incorporate ALL the user's stated survey responses while drawing visual inspiration from the reference images. DESIGN 1 = classic, refined jewelry aesthetic, DESIGN 2 = bold, modern sculptural style. ${promptData.lighting}. ${promptData.background}. ${promptData.presentation}. ${promptData.camera}.`;
        }
    } else {
        // Text-only prompt
        let textOnlyDetails = '';
        if (responses.all_text_responses?.Q6_symbols) textOnlyDetails += ` Incorporate meaningful symbols/elements: ${responses.all_text_responses.Q6_symbols}.`;
        if (responses.all_text_responses?.Q8_idea_description) textOnlyDetails += ` User's idea: ${responses.all_text_responses.Q8_idea_description}.`;
        if (responses.all_text_responses?.Q13_special_details) textOnlyDetails += ` Special requests: ${responses.all_text_responses.Q13_special_details}.`;
        if (responses.style_vibes?.length > 0) textOnlyDetails += ` Style vibes: ${responses.style_vibes.join(', ')}.`;
        
        return `Create a single ${promptData.subject} with ${promptData.style} styling. Material: ${promptData.material}.${textOnlyDetails} 

${promptData.manufacturing_rules}

${promptData.lighting}. ${promptData.background}. ${promptData.presentation}. ${promptData.detail}. ${promptData.camera}. Generate 2 different design variations.`;
    }
}

async function generateImages(promptText, hasUploadedImages, responses, apiKey) {
    const design1Prompt = hasUploadedImages ? 
        promptText.replace('Generate 2 distinct style variations', 'Create Design 1 - Classic Elegant only') :
        promptText.replace('Generate 2 different design variations', 'Create a classic, elegant design');
    
    const design2Prompt = hasUploadedImages ?
        promptText.replace('Generate 2 distinct style variations', 'Create Design 2 - Modern Sculptural only') :
        promptText.replace('Generate 2 different design variations', 'Create a modern, sculptural design');
    
    const promises = [];
    
    [design1Prompt, design2Prompt].forEach(prompt => {
        let requestBody = {
            model: "gpt-4.1-mini",
            tools: [{
                type: "image_generation",
                quality: "high",
                size: "1024x1024",
                background: "opaque"
            }]
        };
        
        if (hasUploadedImages) {
            const inputContent = [{
                "type": "input_text",
                "text": prompt
            }];
            
            // Add images
            const allImages = [
                ...(responses.uploaded_images?.Q2_images || []),
                ...(responses.uploaded_images?.Q7_images || []),
                ...(responses.uploaded_images?.Q9_images || [])
            ];
            
            allImages.forEach(imageBase64 => {
                inputContent.push({
                    "type": "input_image",
                    "image_url": imageBase64
                });
            });
            
            requestBody.input = [{
                "role": "user",
                "content": inputContent
            }];
        } else {
            requestBody.input = prompt;
        }
        
        promises.push(fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(requestBody)
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }));
    });
    
    const results = await Promise.all(promises);
    console.log('Generation results:', results);
    
    const combinedData = { output: [] };
    
    results.forEach((result, index) => {
        if (result.output && Array.isArray(result.output)) {
            const imageCall = result.output.find(output => output.type === "image_generation_call");
            if (imageCall) {
                combinedData.output.push(imageCall);
            }
        }
    });
    
    return combinedData;
}

function displayResults(data, responses, hasUploadedImages) {
    const mainContent = document.getElementById('main-content');
    const imageGenerationCalls = data.output?.filter(output => output.type === "image_generation_call") || [];
    
    if (imageGenerationCalls.length === 0) {
        throw new Error('No valid images generated');
    }
    
    const imageTypeText = hasUploadedImages ? 
        (responses.uploaded_images?.Q2_images?.length > 0 ? 
            'Based on your uploaded design' : 
            'Inspired by your reference images') : 
        'Generated from your preferences';
    
    // Create ecommerce layout
    const ecommerceContainer = document.createElement('div');
    ecommerceContainer.className = 'ecommerce-layout';
    
    // Left side: Product images
    const imagesSection = document.createElement('div');
    imagesSection.className = 'product-images-section';
    imagesSection.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="font-size: 24px; font-weight: 500; color: #000000; margin: 0 0 8px 0;">Your Custom Charm Designs</h2>
            <p style="font-size: 14px; color: #666666; margin: 0;">${imageTypeText} • Choose your favorite style</p>
        </div>
    `;
    
    const imageGrid = document.createElement('div');
    imageGrid.className = 'product-image-grid';
    
    // Display images
    const imagesToDisplay = imageGenerationCalls.slice(0, 2);
    
    imagesToDisplay.forEach((call, index) => {
        if (call.result) {
            const base64Data = call.result;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const imageUrl = URL.createObjectURL(blob);
            
            const designType = index === 0 ? 'Classic Elegant' : 'Modern Sculptural';
            const imageCard = document.createElement('div');
            imageCard.className = 'product-image-card';
            imageCard.id = `image-card-${index + 1}`;
            imageCard.innerHTML = `
                <div class="image-container">
                    <div class="image-badge">Design ${index + 1}</div>
                    <img src="${imageUrl}" alt="Generated charm design ${index + 1}" class="product-image" data-version="1">
                </div>
                
                <div class="image-info">
                    <h3 class="image-title">${designType}</h3>
                    <p class="image-subtitle">Custom charm design</p>
                    
                    <button class="select-image-btn" onclick="selectDesign(${index + 1})" id="select-btn-${index + 1}">
                        Select This Design
                    </button>
                    
                    <div class="refine-section">
                        <button class="refine-toggle" onclick="toggleRefineSection(${index + 1})">
                            <span>Need changes? (Optional)</span>
                            <span id="refine-arrow-${index + 1}">▼</span>
                        </button>
                        
                        <div class="refine-content" id="refine-content-${index + 1}">
                            <textarea 
                                class="refine-textarea"
                                id="feedback-${index + 1}" 
                                placeholder="Quick changes... (e.g., more delicate, add details)"
                            ></textarea>
                            <button 
                                class="refine-button"
                                onclick="regenerateDesign(${index + 1})"
                            >
                                Update Design ${index + 1}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            imageGrid.appendChild(imageCard);
            
            // Generate story for this design
            setTimeout(() => generateDesignStory(index + 1, responses, designType), 100);
        }
    });
    
    imagesSection.appendChild(imageGrid);
    
    // Right side: Purchase sidebar
    const purchaseSidebar = document.createElement('div');
    purchaseSidebar.className = 'purchase-sidebar';
    purchaseSidebar.innerHTML = `
        <div class="purchase-header">
            <h2 class="purchase-title">Complete Your Order</h2>
            <p class="purchase-subtitle">Select design and material to continue</p>
        </div>
        
        <div class="selection-status" id="selection-status">
            <div style="font-size: 14px; color: #666;">
                <div>Design: <span id="selected-design-text">Not selected</span></div>
                <div>Material: <span id="selected-material-text">Sterling Silver</span></div>
            </div>
        </div>
        
        <div class="material-section">
            <div class="section-label">Choose Material</div>
            <div class="material-grid">
                <div class="material-option" onclick="selectMaterial('sterling-silver')" id="material-sterling-silver">
                    <div class="material-name">Sterling Silver</div>
                    <div class="material-price">$50</div>
                </div>
                <div class="material-option" onclick="selectMaterial('gold-plated')" id="material-gold-plated">
                    <div class="material-name">Gold-Plated</div>
                    <div class="material-price">$50</div>
                </div>
                <div class="material-option" onclick="selectMaterial('14k-gold')" id="material-14k-gold">
                    <div class="material-name">14K Gold</div>
                    <div class="material-price">$200</div>
                </div>
            </div>
        </div>
        
        <div class="price-summary">
            <div class="price-details">
                <div class="price-label">Total:</div>
                <div class="price-amount" id="main-price-display">$50</div>
            </div>
            <div class="shipping-info">
                <div style="font-weight: 500; margin-bottom: 2px;">Free shipping</div>
                <div>Ships in 5-7 days</div>
            </div>
        </div>
        
        <button 
            class="buy-button"
            id="main-buy-button"
            onclick="purchaseSelectedDesign()"
        >Select a Design to Continue</button>
        
        <div class="trust-signals">
            30-day guarantee • Secure Stripe checkout • Gift ready packaging
        </div>
    `;
    
    // Add both sections to the ecommerce container
    ecommerceContainer.appendChild(imagesSection);
    ecommerceContainer.appendChild(purchaseSidebar);
    
    // Design summary section at the bottom
    const summarySection = document.createElement('div');
    summarySection.className = 'design-summary-section';
    summarySection.innerHTML = `
        <h3 style="font-size: 20px; font-weight: 500; color: #000000; margin: 0 0 20px 0; text-align: center;">Design Stories & Details</h3>
        <div class="summary-grid" id="summary-grid">
            <!-- Stories will be populated here -->
        </div>
    `;
    
    // Replace loading content with results
    mainContent.innerHTML = '';
    mainContent.appendChild(ecommerceContainer);
    mainContent.appendChild(summarySection);
    
    // Set default material selection
    setTimeout(() => {
        const userMaterialChoice = responses.material || 'sterling-silver';
        selectMaterial(userMaterialChoice);
    }, 100);
}

// Helper functions
function generatePromptFromResponses(responses) {
    let objectDescription = 'elegant charm';
    
    if (responses.symbols) {
        objectDescription = responses.symbols.toLowerCase();
    } else if (responses.inspiration) {
        if (responses.inspiration.includes('moment')) objectDescription = 'commemorative medallion';
        else if (responses.inspiration.includes('person')) objectDescription = 'heart-shaped pendant';
        else if (responses.inspiration.includes('place')) objectDescription = 'compass or map-inspired charm';
        else if (responses.inspiration.includes('curious')) objectDescription = 'geometric charm';
    }
    
    let materialType = 'polished reflective gold metal';
    if (responses.material === 'sterling-silver') {
        materialType = 'polished reflective silver metal';
    } else if (responses.material === 'gold-plated') {
        materialType = 'gold-plated silver with warm reflective finish';
    }
    
    let styleAdjustment = 'high-gloss 3D sculptural metal';
    if (responses.size_presence === 'subtle') {
        styleAdjustment = 'delicate high-gloss 3D sculptural metal with fine details';
    } else if (responses.size_presence === 'bold-sculptural') {
        styleAdjustment = 'bold high-gloss 3D sculptural metal with dramatic presence';
    }
    
    let vibeAdjustment = '';
    if (responses.style_vibes && responses.style_vibes.length > 0) {
        if (responses.style_vibes.includes('elegant')) vibeAdjustment += ', elegant and refined';
        if (responses.style_vibes.includes('bold')) vibeAdjustment += ', bold and confident';
        if (responses.style_vibes.includes('playful')) vibeAdjustment += ', playful and whimsical';
        if (responses.style_vibes.includes('spiritual')) vibeAdjustment += ', meaningful and symbolic';
        if (responses.style_vibes.includes('sweet')) vibeAdjustment += ', sweet and sentimental';
    }

    return {
        "subject": `a single ${materialType.includes('gold') ? 'gold' : 'silver'} charm in the shape of ${objectDescription}${vibeAdjustment}`,
        "style": styleAdjustment,
        "material": materialType,
        "lighting": "studio lighting with soft reflections and minimal shadows",
        "background": "clean off-white or cream gradient",
        "presentation": "floating product shot, single charm with jump ring attached, angled to show volume and shine",
        "detail": "smooth, rounded surfaces with subtle contours, includes a jump ring for attachment, no engraving or texture",
        "camera": "close-up, eye-level with a slight tilt",
        "manufacturing_rules": `
CRITICAL 3D DESIGN RULES:
- Focus entirely on the main subject (people, animals, objects, food, plants, fantasy creatures, etc.)
- NO background elements, bases, scenery, or frames — only the subject
- For people and animals: Simplify faces into soft, minimal features (small eyes, subtle nose/mouth, no exaggerated expressions), avoid cartoon exaggeration — aim for natural, serene, or affectionate emotion
- For objects/food/plants/buildings: Keep forms bold, simple, iconic, and easily recognizable
- Strongly emphasize smooth, rounded volumes and bold silhouettes with deeper grooves, softly padded surfaces, and clean flowing curves to enhance the 3D feel
- Simplify all textures: NO fine patterns, tiny folds, or mechanical details — only large, clear shapes
- Prioritize maximum readability

MEDALLION RULES:
- If the subject has thin, fragile, or widely spread parts (e.g., arms, tails, wings), contain the design inside a soft organic circular or oval medallion for strength
- If the subject is naturally compact and sturdy, leave it free-floating and self-contained without a background frame

MANUFACTURING CONSTRAINTS:
- No full 3D bodies: All parts must rise smoothly from a single, slightly curved back surface (true 2.5D relief)
- No rings, loops, or holes for attachments — design should be clean; attachment rings added manually later
- All outer edges must be softly rounded and thick enough to ensure durability
- Create significant dimensional depth with varying heights across the surface - NOT flat engravings`
    };
}

async function generateDesignStory(designNumber, responses, designType) {
    try {
        let apiKey = window.CONFIG?.OPENAI_API_KEY || window.OPENAI_API_KEY;
        if (!apiKey) {
            console.log('No API key available for story generation');
            addFallbackStory(designNumber, responses, designType);
            return;
        }
        
        const hasUploadedImages = responses.uploaded_images?.Q2_images?.length > 0 || 
                                responses.uploaded_images?.Q7_images?.length > 0 || 
                                responses.uploaded_images?.Q9_images?.length > 0;
        
        let messages = [];
        
        if (hasUploadedImages) {
            const imageAnalysisPrompt = `Look at this image and write exactly 1-2 simple, heartfelt sentences about what this would mean as a custom charm.

Focus on the emotional significance, memories, and personal connection this image represents. Use warm, simple language. Avoid mentioning materials or technical details.

Consider what story this image tells and why someone would want to carry it as a charm close to their heart.`;
            
            const messageContent = [{ "type": "text", "text": imageAnalysisPrompt }];
            
            const allImages = [
                ...(responses.uploaded_images?.Q2_images || []),
                ...(responses.uploaded_images?.Q7_images || []),
                ...(responses.uploaded_images?.Q9_images || [])
            ];
            
            allImages.forEach(imageBase64 => {
                messageContent.push({
                    "type": "image_url",
                    "image_url": { "url": imageBase64 }
                });
            });
            
            messages = [{ "role": "user", "content": messageContent }];
        } else {
            // Build emotional story from text responses
            let emotionalStory = buildEmotionalStory(responses);
            let storyPrompt = `Write exactly 1-2 simple, heartfelt sentences about this custom charm's emotional meaning.

The person is ${emotionalStory}

Focus on feelings, memories, and personal connection. Use warm, simple language. Avoid mentioning materials or technical details.`;
            
            messages = [{ "role": "user", "content": storyPrompt }];
        }
        
        const model = hasUploadedImages ? "gpt-4o" : "gpt-4o-mini";
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 120,
                temperature: 0.8
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const story = data.choices[0].message.content.trim();
            addStoryToSummary(designNumber, designType, story);
        } else {
            throw new Error('Invalid response from story generation API');
        }
        
    } catch (error) {
        console.error('Error generating design story:', error);
        addFallbackStory(designNumber, responses, designType);
    }
}

function buildEmotionalStory(responses) {
    let emotionalStory = '';
    
    if (responses.journey_type === 'A') {
        if (responses.inspiration?.includes('moment')) {
            emotionalStory = 'celebrating a milestone that changed everything';
        } else if (responses.inspiration?.includes('person')) {
            emotionalStory = 'honoring someone who means the world to you';
        } else if (responses.inspiration?.includes('place')) {
            emotionalStory = 'preserving memories of somewhere that shaped you';
        } else {
            emotionalStory = 'expressing your unique spirit and creativity';
        }
    } else if (responses.journey_type === 'B') {
        if (responses.all_text_responses?.Q8_idea_description) {
            emotionalStory = `bringing your vision to life: "${responses.all_text_responses.Q8_idea_description}"`;
        } else {
            emotionalStory = 'turning inspiration into something deeply personal';
        }
    } else {
        emotionalStory = 'preserving something precious in permanent form';
    }
    
    return emotionalStory;
}

function addStoryToSummary(designNumber, designType, story) {
    const summaryGrid = document.getElementById('summary-grid');
    if (summaryGrid) {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'summary-card';
        summaryCard.id = `summary-card-${designNumber}`;
        summaryCard.innerHTML = `
            <h4 class="summary-title">Design ${designNumber}: ${designType}</h4>
            <div class="story-content">
                <div class="story-label">The Story</div>
                <p class="story-text">${story}</p>
            </div>
        `;
        summaryGrid.appendChild(summaryCard);
    }
}

function addFallbackStory(designNumber, responses, designType) {
    const summaryGrid = document.getElementById('summary-grid');
    if (summaryGrid) {
        let fallbackStory = '';
        
        if (responses.journey_type === 'A') {
            if (responses.inspiration?.includes('moment')) {
                fallbackStory = 'This charm captures the joy and pride of your special moment, keeping its magic close to your heart every day.';
            } else if (responses.inspiration?.includes('person')) {
                fallbackStory = 'This charm carries the love and connection you share with someone special, keeping them close no matter the distance.';
            } else if (responses.inspiration?.includes('place')) {
                fallbackStory = 'This charm holds the spirit of a place that shaped you, bringing its memories and meaning into your everyday life.';
            } else {
                fallbackStory = 'This charm reflects your unique spirit and creativity, celebrating the beauty of who you are.';
            }
        } else if (responses.journey_type === 'B') {
            if (responses.all_text_responses?.Q8_idea_description) {
                fallbackStory = 'This charm brings your personal vision to life, turning your dreams into something you can touch and treasure.';
            } else {
                fallbackStory = 'This charm transforms your inspiration into something deeply personal, carrying your story wherever you go.';
            }
        } else {
            fallbackStory = 'This charm preserves something precious to you, turning cherished memories into a keepsake you can always carry.';
        }
        
        if (responses.all_text_responses?.Q6_symbols || responses.all_text_responses?.Q13_special_details) {
            fallbackStory += ' Every detail holds meaning that\'s uniquely yours.';
        }
        
        addStoryToSummary(designNumber, designType, fallbackStory);
    }
}

// Regeneration function (simplified for now)
async function regenerateDesign(designNumber) {
    const feedbackTextarea = document.getElementById(`feedback-${designNumber}`);
    const feedback = feedbackTextarea.value.trim();
    
    if (!feedback) {
        alert('Please provide feedback about what you\'d like to change in this design.');
        return;
    }
    
    // For now, just show a message that this feature is coming soon
    alert('Design refinement feature coming soon! Your feedback has been noted.');
    feedbackTextarea.value = '';
} 