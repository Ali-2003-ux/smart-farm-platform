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

    # Direct IP for api.telegram.org to bypass DNS issues
    # IP: 149.154.167.220 is a common Telegram API endpoint
    TELEGRAM_IP = "149.154.167.220"
    base_url = f"https://{TELEGRAM_IP}/bot{TG_TOKEN}"
    headers = {"Host": "api.telegram.org"}

    try:
        # Send Text
        payload = {"chat_id": TG_CHAT_ID, "text": message}
        requests.post(f"{base_url}/sendMessage", json=payload, headers=headers, verify=False, timeout=5)
        
        # Send Image if provided
        if image_path and os.path.exists(image_path):
            with open(image_path, 'rb') as img_file:
                files = {'photo': img_file}
                data = {'chat_id': TG_CHAT_ID}
                requests.post(f"{base_url}/sendPhoto", data=data, files=files, headers=headers, verify=False, timeout=10)
                
        return True, "Message sent successfully"
    except Exception as e:
        print(f"Telegram Notification Failed: {e}")
        return False, f"Error: {str(e)}"
