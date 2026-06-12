import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    print(f"[EasyMistri] Starting Flask backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
