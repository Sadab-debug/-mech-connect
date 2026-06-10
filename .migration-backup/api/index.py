import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'artifacts', 'mistrivai', 'backend'))

from app import app


class ApiPrefixMiddleware:
    """Strip /api prefix so existing Flask routes work unchanged on Vercel."""
    def __init__(self, wsgi_app, prefix='/api'):
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


app.wsgi_app = ApiPrefixMiddleware(app.wsgi_app)
