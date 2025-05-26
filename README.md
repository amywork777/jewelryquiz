# Custom Charm Design Questionnaire

A beautiful, interactive questionnaire that helps users design custom jewelry charms with AI-powered image generation.

## Features

- Interactive multi-step questionnaire with branching logic
- Professional UI with smooth animations
- AI-powered custom charm image generation using GPT Image 1
- Responsive design for all devices
- Email and phone collection for follow-up

## Setup

### API Key Configuration

1. Copy the template config file:
   ```bash
   cp config.template.js config.js
   ```

2. Edit `config.js` and replace `'your-openai-api-key-here'` with your actual OpenAI API key:
   ```javascript
   window.CONFIG = {
       OPENAI_API_KEY: 'sk-proj-your-actual-api-key-here'
   };
   ```

3. The `config.js` file is automatically ignored by git for security.

### Running the Application

Simply open `index.html` in a web browser. The application will:
- Load your API key from `config.js` automatically
- Fall back to prompting for the API key if the config file is missing
- Generate custom charm images using OpenAI's latest GPT Image 1 model

## Technology Stack

- Pure HTML, CSS, and JavaScript (no frameworks required)
- OpenAI GPT Image 1 API for image generation
- Responsive design with modern CSS animations
- Progressive enhancement for optimal user experience

## Security Notes

- The `config.js` file containing your API key is excluded from version control
- In production environments, API keys should be handled server-side
- Never commit actual API keys to public repositories

## Image Generation

The application uses OpenAI's latest **GPT Image 1** model, which provides:
- Superior instruction following
- Better text rendering
- More detailed editing capabilities
- Real-world knowledge integration
- Higher quality image generation compared to DALL-E models

## Customization

The questionnaire flow and styling can be easily customized by modifying:
- Question content and options in the HTML
- Styling in the CSS section
- Logic flow in the JavaScript functions
- Image generation prompts in the `generatePromptFromResponses()` function 