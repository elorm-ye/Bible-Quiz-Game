import os
import sys
import http.server
import socketserver
import webbrowser
from threading import Timer

PORT = 8080

# CRITICAL FIX for --noconsole mode in PyInstaller: 
# SimpleHTTPRequestHandler tries to log network requests to standard output/error.
# Without a console, sys.stderr is null, causing the handle to crash and drop the web socket (ERR_EMPTY_RESPONSE).
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass # Suppress logging completely to prevent crashes

def start_server():
    # Detect if we are running in a bundled PyInstaller executable to get correct path
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    os.chdir(base_path)
    
    server_started = False
    port = PORT
    
    while not server_started and port < 8090:
        try:
            httpd = socketserver.TCPServer(("", port), QuietHandler)
            server_started = True
        except Exception:
            port += 1
            
    if server_started:
        def open_browser():
            webbrowser.open(f'http://localhost:{port}')
        
        Timer(0.5, open_browser).start()
        httpd.serve_forever()

if __name__ == '__main__':
    start_server()
