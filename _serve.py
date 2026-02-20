import http.server, socketserver, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Serving from {os.getcwd()}", flush=True)
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", 5500), handler) as httpd:
    httpd.serve_forever()
