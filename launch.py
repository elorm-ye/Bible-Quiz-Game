import os
import http.server
import socketserver
import webbrowser
from threading import Timer
import sys

PORT = 8080

def start_server():
    # Attempt to find an open port if 8080 is used
    server_started = False
    port = PORT
    
    Handler = http.server.SimpleHTTPRequestHandler
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    while not server_started and port < 8090:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            server_started = True
        except Exception:
            port += 1
            
    if server_started:
        print(f"App running successfully on local port {port}...")
        print("Keep this terminal open while playing!")
        
        # Give the server a moment to start, then open the browser
        def open_browser():
            webbrowser.open(f'http://localhost:{port}')
        
        Timer(0.5, open_browser).start()
        httpd.serve_forever()
    else:
        print("Failed to bind a port.")

if __name__ == '__main__':
    start_server()
