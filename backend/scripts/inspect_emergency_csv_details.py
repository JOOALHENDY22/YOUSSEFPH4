import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"c:\Users\Lenovo\Downloads\Telegram Desktop\app"
csv_emerg = os.path.join(base_dir, "دليل_الطوارئ_والأعراض_والحمل_والأعمار_الكامل.csv")

if os.path.exists(csv_emerg):
    with open(csv_emerg, mode='r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        print("HEADER COLUMNS:", header)
        
        rows = list(reader)
        print(f"Total rows in Emergency CSV: {len(rows)}")
        
        print("\nSample 3 rows:")
        for i, r in enumerate(rows[:3]):
            print(f"Row {i}:", r)
else:
    print("FILE NOT FOUND!")
