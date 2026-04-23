import os
import sys
import threading
import http.server
import socketserver
import webview
import time

PORT = 8080

def start_server(base_path):
    os.chdir(base_path)
    Handler = http.server.SimpleHTTPRequestHandler
    
    server_started = False
    port = PORT
    while not server_started and port < 8090:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            server_started = True
            httpd.serve_forever()
        except Exception:
            port += 1

if __name__ == '__main__':
    # Detect if we are running in a bundled PyInstaller executable
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))

    # Start the HTTP proxy server required for webview to load local fetch()
    t = threading.Thread(target=start_server, args=(base_path,), daemon=True)
    t.start()
    
    time.sleep(1) # Allow server to bind

    # Mount native UI
    webview.create_window(
        title='Interactive Bible Quiz Game - Ultimate Edition', 
        url=f'http://localhost:8080', 
        width=1280, 
        height=800, 
        min_size=(800, 600)
    )
    webview.start()
