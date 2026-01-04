import sys
import os

# Add current directory to path so we can import 'core'
sys.path.append(os.getcwd())

from core import db

try:
    df_palms = db.get_latest_palms_df()
    print("Palms Columns:", df_palms.columns.tolist())
    if not df_palms.empty:
        print("First Palm:", df_palms.iloc[0].to_dict())
    else:
        print("Palms DF is empty")
except Exception as e:
    print(e)
