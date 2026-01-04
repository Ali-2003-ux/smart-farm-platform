import requests
import os

# Configuration (defaults from old app or env vars)
# In production, use environment variables!
TG_TOKEN = os.getenv("TG_TOKEN", "8547357116:AAHn643JaXRWsvA6t7XjegyGswanx-R20U8")
TG_CHAT_ID = os.getenv("TG_CHAT_ID", "636689846")

def send_telegram_alert(message: str, image_path: str = None):
    """
    Sends a text message (and optional image) to the configured Telegram chat.
    """
    if not TG_TOKEN or not TG_CHAT_ID:
        print("Telegram Config Missing")
        return False, "Missing Config"

    base_url = f"https://api.telegram.org/bot{TG_TOKEN}"
    
    try:
        # Send Text
        payload = {"chat_id": TG_CHAT_ID, "text": message}
        requests.post(f"{base_url}/sendMessage", json=payload)
        
        # Send Image if provided
        if image_path and os.path.exists(image_path):
            with open(image_path, 'rb') as img_file:
                files = {'photo': img_file}
                data = {'chat_id': TG_CHAT_ID}
                requests.post(f"{base_url}/sendPhoto", data=data, files=files)
                
        return True, "Message sent successfully"
    except Exception as e:
        print(f"Telegram Notification Failed: {e}")
        return False, f"Error: {str(e)}"
