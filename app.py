import sys
from pathlib import Path

# Add project root to sys path
sys.path.append(str(Path(__file__).parent))

from app.main import run

if __name__ == "__main__":
    run()
