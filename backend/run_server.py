"""
Server Runner Script
Binds to 0.0.0.0:8000 and displays local LAN Wi-Fi connection instructions.
"""
import uvicorn
import os
import sys

# Ensure UTF-8 stdout encoding for Windows console
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import HOST, PORT, get_lan_ip

if __name__ == "__main__":
    lan_ip = get_lan_ip()
    print("=" * 65)
    print("🇬🇭 OFFLINE ESSAY GRADER WITH RUBRIC-ALIGNED AI FEEDBACK")
    print(f"📡 LAN Broadcast Address: http://{lan_ip}:{PORT}")
    print(f"💻 Local Host Address:    http://127.0.0.1:{PORT}")
    print("=" * 65)
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
