# FAQ Bot with Google Gemini

A smart customer support bot that uses Google's Gemini AI to answer questions based on your FAQ document.

## Features

- 📄 Reads FAQ documents (txt, md, or any text format)
- 🤖 Uses Google Gemini AI for intelligent responses
- 💬 Interactive chat interface
- ✅ Answers only based on FAQ content
- 🔒 Secure API key handling

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 3. Set Environment Variable

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

**Windows Command Prompt:**
```cmd
set GEMINI_API_KEY=your-api-key-here
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY="your-api-key-here"
```

### 4. Customize Your FAQ

Edit `faq.txt` with your business's frequently asked questions and answers.

## Usage

### Run the Bot

```bash
python main.py
```

### Example Interaction

```
Welcome to the FAQ Bot!
Ask any questions about our business. Type 'exit' to quit.
============================================================

You: What are your business hours?

Bot: We are open Monday to Friday from 9:00 AM to 6:00 PM, and Saturday from 10:00 AM to 4:00 PM. We're closed on Sundays and public holidays.

You: Do you ship internationally?

Bot: Yes, we ship to most countries worldwide. The shipping cost varies depending on your destination and will be calculated at checkout.

You: exit

Thank you for using the FAQ Bot! Goodbye!
```

## Using in Your Code

```python
from main import FAQBot

# Initialize the bot
bot = FAQBot(faq_file_path="faq.txt")

# Ask a question
response = bot.ask("What is your return policy?")
print(response)

# Start interactive chat
bot.chat()
```

## Configuration

You can customize the bot by:

1. **Change the AI model**: Edit the model name in `main.py`:
   ```python
   self.model = genai.GenerativeModel('gemini-1.5-pro')  # Use Pro instead of Flash
   ```

2. **Modify the system prompt**: Edit the `system_prompt` in `main.py` to change the bot's behavior

3. **Use different FAQ formats**: The bot supports any text-based format (txt, md, csv, etc.)

## Troubleshooting

### Import Error
If you get `Import "google.generativeai" could not be resolved`, install the package:
```bash
pip install google-generativeai
```

### API Key Error
Make sure your GEMINI_API_KEY environment variable is set correctly.

### FAQ File Not Found
Ensure `faq.txt` exists in the same directory as `main.py`, or provide the full path.

## License

This project is open source and available for your business use.
