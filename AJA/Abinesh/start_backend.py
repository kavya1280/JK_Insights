#!/usr/bin/env python3
"""
Startup script for AJALabs Analytics Backend
"""
import subprocess
import sys
import os

def main():
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)
    
    # Install requirements if needed
    print("Installing backend dependencies...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt', '-q'])
    
    # Start the FastAPI server
    print("Starting FastAPI server on http://localhost:8000")
    print("Press Ctrl+C to stop")
    subprocess.run([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'])

if __name__ == '__main__':
    main()
