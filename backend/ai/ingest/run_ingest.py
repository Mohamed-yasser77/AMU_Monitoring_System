"""
Run from backend/ directory:
    python ai/ingest/run_ingest.py
"""

import os
import sys

# Ensure backend/ is in the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai.ingest.pipeline import run_ingest

if __name__ == '__main__':
    run_ingest()
