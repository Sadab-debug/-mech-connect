import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

class PrefixMiddleware:
    def __init__(self, wsgi_app, prefix='/flask'):
        self.app = wsgi_app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')
        if path.startswith(self.prefix + '/'):
            environ['PATH_INFO'] = path[len(self.prefix):]
            environ['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '') + self.prefix
        elif path == self.prefix:
            environ['PATH_INFO'] = '/'
            environ['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '') + self.prefix
        return self.app(environ, start_response)

app.wsgi_app = PrefixMiddleware(app.wsgi_app)

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    print(f"[MistriVai] Starting Flask backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
