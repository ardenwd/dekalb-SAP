import pandas as pd

# Define file path
csv_file_path = 'dekalb-schools.csv'

# 1. Read the CSV file
df = pd.read_csv(csv_file_path)

# 2. Add a new column with a constant value for all rows
df['future_use'] = 'n'

# (Optional: Add a new column based on an existing column's calculation)
# df['Sale_Price'] = df['Original_Price'] * 0.9 

# 3. Write the updated DataFrame back to the CSV file
df.to_csv(csv_file_path, index=False)
