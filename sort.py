import pandas as pd

def sort_csv_with_pandas(input_filename, output_filename, column_name):
    """
    Sorts a CSV file using pandas and writes to a new file.
    """
    # Read the CSV file into a DataFrame
    df = pd.read_csv(input_filename)

    # Sort the DataFrame by the specified column
    # sort_values returns a new DataFrame, so we assign it back
    df = df.sort_values(by=[column_name], ascending=True)

    # Write the sorted DataFrame back to a CSV file (index=False prevents writing the DataFrame index as a column)
    df.to_csv(output_filename, index=False)

    print(f"Successfully sorted '{input_filename}' with pandas by column '{column_name}' and saved to '{output_filename}'.")

# Example Usage:
sort_csv_with_pandas("dekalb-schools-new.csv", "dekalb-schools-sorted.csv", "NAME")
