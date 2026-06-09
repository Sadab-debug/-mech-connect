import os
import sys

# Ensure the root/login directory is in the python path so imports inside login_app work
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'login'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from login_app import app

# Vercel needs the application callable to be named 'app'
# Since we imported 'app', it is already exposed as 'app'
