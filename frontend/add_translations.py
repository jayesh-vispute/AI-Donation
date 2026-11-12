import json
import os

locales = ['en', 'te', 'hi', 'ta', 'kn']
base_path = os.path.join(os.path.dirname(__file__), 'src', 'i18n', 'locales')

translations = {
  'en': {
    "didNotReceiveCode": "Didn't receive the code?",
    "resendOtp": "Resend OTP",
    "sending": "Sending...",
    "resendCooldown": "Resend OTP in {{seconds}}s",
    "resendSuccessMsg": "New verification code sent to the donor's registered email.",
    "resendFailedMsg": "Unable to send a new verification code. Please try again.",
    "emailUnavailable": "Email service is temporarily unavailable."
  },
  'te': {
    "didNotReceiveCode": "మీకు కోడ్ అందలేదా?",
    "resendOtp": "OTPని మళ్లీ పంపండి",
    "sending": "పంపుతోంది...",
    "resendCooldown": "{{seconds}}sలో OTPని మళ్లీ పంపండి",
    "resendSuccessMsg": "కొత్త ధృవీకరణ కోడ్ దాత నమోదు చేసిన ఇమెయిల్‌కు పంపబడింది.",
    "resendFailedMsg": "కొత్త ధృవీకరణ కోడ్‌ని పంపడం సాధ్యం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
    "emailUnavailable": "ఇమెయిల్ సేవ తాత్కాలికంగా అందుబాటులో లేదు."
  },
  'hi': {
    "didNotReceiveCode": "कोड नहीं मिला?",
    "resendOtp": "ओटीपी दोबारा भेजें",
    "sending": "भेजा जा रहा है...",
    "resendCooldown": "{{seconds}}s में ओटीपी दोबारा भेजें",
    "resendSuccessMsg": "नया सत्यापन कोड दाता के पंजीकृत ईमेल पर भेज दिया गया है।",
    "resendFailedMsg": "नया सत्यापन कोड भेजने में असमर्थ। कृपया पुनः प्रयास करें।",
    "emailUnavailable": "ईमेल सेवा अस्थायी रूप से अनुपलब्ध है।"
  },
  'ta': {
    "didNotReceiveCode": "குறியீடு கிடைக்கவில்லையா?",
    "resendOtp": "OTP ஐ மீண்டும் அனுப்பு",
    "sending": "அனுப்பப்படுகிறது...",
    "resendCooldown": "{{seconds}}s-ல் OTP ஐ மீண்டும் அனுப்பு",
    "resendSuccessMsg": "புதிய சரிபார்ப்பு குறியீடு நன்கொடையாளர் பதிவுசெய்த மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளது.",
    "resendFailedMsg": "புதிய சரிபார்ப்பு குறியீட்டை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    "emailUnavailable": "மின்னஞ்சல் சேவை தற்காலிகமாக கிடைக்கவில்லை."
  },
  'kn': {
    "didNotReceiveCode": "ಕೋಡ್ ಸ್ವೀಕರಿಸಿಲ್ಲವೇ?",
    "resendOtp": "OTP ಮರುಕಳುಹಿಸಿ",
    "sending": "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    "resendCooldown": "{{seconds}}s ನಲ್ಲಿ OTP ಮರುಕಳುಹಿಸಿ",
    "resendSuccessMsg": "ಹೊಸ ಪರಿಶೀಲನೆ ಕೋಡ್ ಅನ್ನು ದಾನಿಯ ನೋಂದಾಯಿತ ಇಮೇಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.",
    "resendFailedMsg": "ಹೊಸ ಪರಿಶೀಲನೆ ಕೋಡ್ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.",
    "emailUnavailable": "ಇಮೇಲ್ ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ."
  }
}

for locale in locales:
    file_path = os.path.join(base_path, f'{locale}.json')
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if 'ngo' not in data:
                data['ngo'] = {}
            if 'deliveryWorkflow' not in data['ngo']:
                data['ngo']['deliveryWorkflow'] = {}
                
            data['ngo']['deliveryWorkflow'].update(translations[locale])
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {locale}.json")
        except Exception as e:
            print(f"Error updating {locale}.json: {e}")
    else:
        print(f"File not found: {file_path}")
