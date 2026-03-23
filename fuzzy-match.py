import pandas as pd
from thefuzz import process

# --- Configuration ---
file_a = "dekalb-schools.csv"          # main file to add columns into
file_b = "enrollment.csv"           # file to pull new columns from

output_filename = "dekalb-merged-1.csv"

# Column containing school names in each file
name_col_a = "NAME"
name_col_b = "School"         

# Column containing school type in each file (ES/MS/HS or Elementary/Middle/High)
type_col_a = "Type"
type_col_b = "Type"         

# Columns from file B you want to bring into file A
cols_to_bring_over = ["Enrollment","Capacity"]   

# Fuzzy match threshold (0-100). Below this score = flagged for review
MATCH_THRESHOLD = 85

# --- Type normalization ---
def normalize_type(val):
    """Standardizes school type to ES, MS, or HS."""
    val = str(val).strip().upper()
    if any(x in val for x in ["ES", "ELEM", "ELEMENTARY ", "ELEMENTARY SCHOOL"]):
        return "ES"
    elif any(x in val for x in ["MS", "MID", "MIDDLE", "MIDDLE SCHOOL"]):
        return "MS"
    elif any(x in val for x in ["HS", "HIGH", "HIGH SCHOOL"]):
        return "HS"
    return val

# --- Main logic ---
def fuzzy_merge(file_a, file_b, output_filename):
    df_a = pd.read_csv(file_a)
    df_b = pd.read_csv(file_b)

    df_a["_type_norm"] = df_a[type_col_a].apply(normalize_type)
    df_b["_type_norm"] = df_b[type_col_b].apply(normalize_type)

    # Initialize new columns as empty
    for col in cols_to_bring_over:
        df_a[col] = None
    df_a["_match_name"] = None
    df_a["_match_score"] = None
    df_a["_match_flag"] = None

    b_names = df_b[name_col_b].tolist()

    for idx, row_a in df_a.iterrows():
        # Get top fuzzy match
        match_name, score = process.extractOne(row_a[name_col_a], b_names)
        matched_row = df_b[df_b[name_col_b] == match_name].iloc[0]

        df_a.at[idx, "_match_name"] = match_name
        df_a.at[idx, "_match_score"] = score

        if score < MATCH_THRESHOLD:
            df_a.at[idx, "_match_flag"] = "LOW_SCORE"
            continue

        # Confirm with type
        type_match = row_a["_type_norm"] == matched_row["_type_norm"]
        if not type_match:
            df_a.at[idx, "_match_flag"] = "TYPE_MISMATCH"
            continue

        # Good match — bring over columns
        for col in cols_to_bring_over:
            df_a.at[idx, col] = matched_row[col]
        df_a.at[idx, "_match_flag"] = "OK"

    # Drop internal normalization column
    df_a = df_a.drop(columns=["_type_norm"])

    df_a.to_csv(output_filename, index=False)
    
    # Summary
    flag_counts = df_a["_match_flag"].value_counts()
    print(f"Done! Saved to '{output_filename}'")
    print(f"\nMatch summary:\n{flag_counts.to_string()}")

fuzzy_merge(file_a, file_b, output_filename)