import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

fpath = r"c:\Users\Lenovo\Downloads\Telegram Desktop\app\موسوعة_الـ15_ألف_دواء_مصري_الكاملة.csv"

if os.path.exists(fpath):
    with open(fpath, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        print("HEADER:", header)
        
        all_drugs = []
        active_set = set()
        for i, row in enumerate(reader):
            if row and len(row) > 6:
                name_en = row[1].strip()
                active = row[6].strip()
                all_drugs.append(name_en)
                active_set.add(active)
                
        print(f"Total rows in CSV: {len(all_drugs)}")
        print(f"Total unique active ingredients: {len(active_set)}")
        print("Sample 20 drug names:", all_drugs[:20])
        print("Sample 10 active ingredients:", list(active_set)[:10])
else:
    print("CSV FILE NOT FOUND!")
