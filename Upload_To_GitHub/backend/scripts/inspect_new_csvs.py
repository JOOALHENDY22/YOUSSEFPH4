import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"c:\Users\Lenovo\Downloads\Telegram Desktop\app"
files = [
    "دليل_بدائل_الأدوية_المصرية_الموثوق_الشامل.csv",
    "دليل_الطوارئ_والأعراض_والحمل_والأعمار_الكامل.csv"
]

for fname in files:
    fpath = os.path.join(base_dir, fname)
    print(f"\n==========================================")
    print(f"FILE: {fname}")
    print(f"==========================================")
    if os.path.exists(fpath):
        with open(fpath, mode='r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            print("COLUMNS:", header)
            for i in range(3):
                row = next(reader, None)
                print(f"ROW {i+1}:", row)
    else:
        print("FILE NOT FOUND!")
