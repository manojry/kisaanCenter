#!/usr/bin/env python3
"""
Startup script to run the KisaanCenter API
"""

import subprocess
import sys
import time
import os
import signal

def start_server():
    """Start the FastAPI server"""
    backend_dir = "/Users/manojreddy.yalamareddy/kisaanCenter/kisaanCenter/backend"
    venv_python = "/Users/manojreddy.yalamareddy/kisaanCenter/kisaanCenter/.venv/bin/python"
    
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir
    
    cmd = [
        venv_python, "-m", "uvicorn", 
        "src.main:app", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ]
    
    print("🚀 Starting KisaanCenter API server...")
    print(f"Command: {' '.join(cmd)}")
    print(f"Working directory: {backend_dir}")
    
    process = subprocess.Popen(
        cmd,
        cwd=backend_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    for _ in range(30):
        if process.poll() is not None:
            print("❌ Server process exited early")
            return None
        
        try:
            import requests
            response = requests.get("http://localhost:8000/health", timeout=1)
            if response.status_code == 200:
                print("✅ Server is ready!")
                return process
        except:
            pass
        
        time.sleep(1)
    
    print("❌ Server did not start within 30 seconds")
    process.terminate()
    return None

if __name__ == "__main__":
    process = start_server()
    if process:
        try:
            print(f"🌐 Server running on http://localhost:8000")
            print(f"📚 API docs: http://localhost:8000/docs")
            print("Press Ctrl+C to stop the server")
            
            # Keep the process running
            while True:
                time.sleep(1)
                if process.poll() is not None:
                    print("❌ Server process ended unexpectedly")
                    break
                    
        except KeyboardInterrupt:
            print("\n🛑 Stopping server...")
            process.terminate()
            process.wait()
            print("✅ Server stopped")
