import http.server
import os
import sys

DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        url_parts = self.path.split('?', 1)
        path_only = url_parts[0]
        query = '?' + url_parts[1] if len(url_parts) > 1 else ''

        clean_path = path_only.lstrip('/')
        local_file = os.path.join(DIRECTORY, clean_path)

        # Si no existe directamente pero existe con .html (estilo cleanUrls de Firebase)
        if clean_path and not os.path.exists(local_file) and os.path.exists(local_file + '.html'):
            self.path = path_only + '.html' + query

        return super().do_GET()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), CleanUrlHandler)
    print(f"Server running at http://localhost:{port}/ with cleanUrls support.")
    server.serve_forever()
