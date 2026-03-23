import pandas as pd

def keep_csv_with_pandas(input_filename, output_filename):
    df = pd.read_csv(input_filename)
    
    # Drop the specified columns
    type_map = {
        "e": "Elementary",
        "m": "Middle",
        "h": "High",
        "c": "Close"
    }

    df["future_use"] = df["future_use"].map(type_map).fillna(df["Type"])

    # df = df[columns_to_keep]
    df.to_csv(output_filename, index=False)
    # print(f"Successfully sorted '{input_filename}' by '{column_name}' and saved to '{output_filename}'.")

keep_csv_with_pandas("dekalb-schools.csv", "dekalb-schools-new.csv")