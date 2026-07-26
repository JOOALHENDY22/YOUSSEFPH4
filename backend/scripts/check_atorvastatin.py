import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

fpath = r"c:\Users\Lenovo\Downloads\Telegram Desktop\app\frontend\src\data\egyptian_master_drugs_db.json"
if os.path.exists(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("Total keys in egyptian_master_drugs_db.json:", len(data))
    
    # Search for keys containing 'ator' or 'lipitor'
    matches = [k for k in data.keys() if 'ator' in k or 'lipitor' in k]
    print("Matching keys for 'ator' or 'lipitor':", matches[:10])
    
    if matches:
        sample_key = matches[0]
        print(f"\nSample data for key '{sample_key}':")
        print(json.dumps(data[sample_key], ensure_ascii=False, indent=2))
else:
    print("FILE NOT FOUND!")
