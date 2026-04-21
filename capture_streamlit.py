import subprocess
import time
import requests

proc = subprocess.Popen(["python", "-m", "streamlit", "run", "src/application/app.py", "--server.headless=true"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(8)
try:
    res = requests.get("http://localhost:8501")
    print("HTTP Request Status:", res.status_code)
except Exception as e:
    print("HTTP Request Failed:", e)
    
time.sleep(2)
proc.terminate()
out, err = proc.communicate()
print("STDOUT:", out.decode('utf-8', errors='ignore'))
print("STDERR:", err.decode('utf-8', errors='ignore'))
