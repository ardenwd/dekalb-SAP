import pandas as pd

columns_to_keep = ["NAME", "LAT", "LON", "enrollment_Type", "future_use", "Enrollment","Capacity",]  # replace with your actual column names

def keep_csv_with_pandas(input_filename, output_filename, columns_to_keep):
    df = pd.read_csv(input_filename)
    
    # Drop the specified columns
    df = df[columns_to_keep]
    df.to_csv(output_filename, index=False)
    # print(f"Successfully sorted '{input_filename}' by '{column_name}' and saved to '{output_filename}'.")

keep_csv_with_pandas("dekalb-schools-sorted.csv", "dekalb-schools.csv", columns_to_keep)