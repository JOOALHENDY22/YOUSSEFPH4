import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

files = [
    "موسوعة_الـ15_ألف_دواء_مصري_الكاملة.csv",
    "موسوعة_بدائل_الأدوية_ومقارنة_الأسعار_الكاملة.csv",
    "دليل_التداخلات_الدوائية_والطوارئ.csv",
    "سجل_أدوية_الجدول_والمؤثرات_العقلية.csv"
]

base_dir = r"c:\Users\Lenovo\Downloads\Telegram Desktop\app"

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
            for i in range(2):
                row = next(reader, None)
                print(f"ROW {i+1}:", row)
    else:
        print("FILE NOT FOUND!")
