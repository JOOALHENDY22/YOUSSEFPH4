import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"c:\Users\Lenovo\Downloads\Telegram Desktop\app"
csv_sched = os.path.join(base_dir, "سجل_أدوية_الجدول_والمؤثرات_العقلية.csv")

if os.path.exists(csv_sched):
    with open(csv_sched, mode='r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        print("COLUMNS:", header)
        
        rows = list(reader)
        print(f"Total rows in CSV: {len(rows)}")
        
        schedule_1 = [r for r in rows if len(r) > 2 and ("الأول" in r[2] or "مخدرات" in r[2])]
        schedule_2 = [r for r in rows if len(r) > 2 and ("الثاني" in r[2] or "مؤثرات" in r[2] or "درج" in r[2] or "جدول" in r[2])]
        
        print(f"Schedule 1 rows count: {len(schedule_1)}")
        print(f"Schedule 2/Controlled rows count: {len(schedule_2)}")
        
        print("\nSample 5 rows:")
        for r in rows[:5]:
            print(r)
else:
    print("FILE NOT FOUND!")
