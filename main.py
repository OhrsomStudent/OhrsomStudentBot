import os
import google.generativeai as genai
from pathlib import Path

class FAQBot:
    def __init__(self, faq_file_path, api_key=None):
        """
        Initialize the FAQ Bot with Gemini AI
        
        Args:
            faq_file_path: Path to the FAQ document (txt, md, etc.)
            api_key: Google Gemini API key (if not provided, uses GEMINI_API_KEY env variable)
        """
        # Configure Gemini API
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("API key required. Set GEMINI_API_KEY environment variable or pass api_key parameter")
        
        genai.configure(api_key=self.api_key)
        
        # Initialize the Gemini model
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Load FAQ document
        self.faq_content = self.load_faq(faq_file_path)
        
        # Create system prompt with FAQ context
        self.system_prompt = f"""You are a helpful customer support bot for a business. 
Your role is to answer customer questions based ONLY on the information provided in the FAQ document below.

FAQ DOCUMENT:
{self.faq_content}

INSTRUCTIONS:
- Answer questions accurately based on the FAQ content
- If the question is not covered in the FAQ, politely inform the customer and suggest contacting support
- Be friendly, professional, and concise
- Format your responses clearly and helpfully
"""
    
    def load_faq(self, faq_file_path):
        """Load the FAQ document from file"""
        try:
            with open(faq_file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            print(f"✓ Successfully loaded FAQ from: {faq_file_path}")
            return content
        except FileNotFoundError:
            raise FileNotFoundError(f"FAQ file not found: {faq_file_path}")
        except Exception as e:
            raise Exception(f"Error loading FAQ file: {str(e)}")
    
    def ask(self, question):
        """
        Ask a question to the bot
        
        Args:
            question: User's question
            
        Returns:
            Bot's response
        """
        try:
            # Combine system prompt with user question
            full_prompt = f"{self.system_prompt}\n\nCUSTOMER QUESTION: {question}\n\nYour response:"
            
            # Generate response using Gemini
            response = self.model.generate_content(full_prompt)
            
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def chat(self):
        """Start an interactive chat session"""
        print("\n" + "="*60)
        print("Welcome to the FAQ Bot!")
        print("Ask any questions about our business. Type 'exit' to quit.")
        print("="*60 + "\n")
        
        while True:
            question = input("\nYou: ").strip()
            
            if question.lower() in ['exit', 'quit', 'bye']:
                print("\nThank you for using the FAQ Bot! Goodbye!")
                break
            
            if not question:
                continue
            
            print("\nBot: ", end="")
            response = self.ask(question)
            print(response)


def main():
    """Main function to run the bot"""
    # Path to your FAQ document
    faq_file = "faq.txt"  # Change this to your FAQ file path
    
    # You can set your API key here or use environment variable
    # api_key = "your-api-key-here"  # Uncomment and add your key
    
    try:
        # Initialize the bot
        bot = FAQBot(faq_file_path=faq_file)
        
        # Start interactive chat
        bot.chat()
        
    except Exception as e:
        print(f"Error: {str(e)}")
        print("\nMake sure:")
        print("1. You have set the GEMINI_API_KEY environment variable")
        print("2. Your FAQ file exists in the correct location")
        print("3. You have installed required packages: pip install google-generativeai")


if __name__ == "__main__":
    main()
