import re
import json
import os

# --- Configuration ---
input_text_file = "mechanical_2020_raw.txt" # Make sure this matches the text file name
output_json_file = "mechanical_2020.json" # Choose the name for the final JSON
output_directory = os.path.join("data", "yearWise", "isro", "mechanical") # Correct path to save
quiz_title = "ISRO Scientist/Engineer ME - 2020" # Title for the JSON file
# --- End Configuration ---

# Ensure output directory exists
os.makedirs(output_directory, exist_ok=True)
output_path = os.path.join(output_directory, output_json_file)

try:
    print("Attempting to read input file...")
    with open(input_text_file, "r", encoding="utf-8") as f:
        text = f.read()
    print(f"Read {len(text)} characters from input file.")
except FileNotFoundError:
    print(f"❌ Error: Input file '{input_text_file}' not found.")
    exit(1)

# Updated pattern to include Subject
pattern = r"Question:\s*(.*?)\n\s*A\)\s*(.*?)\n\s*B\)\s*(.*?)\n\s*C\)\s*(.*?)\n\s*D\)\s*(.*?)\n\s*Answer:\s*([A-D])\n\s*Subject:\s*([^\n]*)"

matches = re.findall(pattern, text, re.DOTALL)
print(f"Found {len(matches)} potential question blocks.")

if not matches:
    print("❌ Error: No questions found matching the pattern. Check your regex and input file format.")
    exit(1)

questions = []
chapters = set() # To collect unique chapter names

for i, q in enumerate(matches):
    print(f"Processing question {i+1}...")
    question_text = q[0].strip()
    options_text = [q[1].strip(), q[2].strip(), q[3].strip(), q[4].strip()]
    answer_letter = q[5].strip().upper()
    chapter_text = q[6].strip()
    
    # Map answer letter to option index (A=0, B=1, C=2, D=3)
    answer_index = ord(answer_letter) - ord('A')
    
    if 0 <= answer_index < len(options_text):
        correct_answer_text = options_text[answer_index]
    else:
        print(f"⚠️ Warning: Invalid answer letter '{answer_letter}' for question {i+1}. Skipping answer conversion.")
        correct_answer_text = "ERROR - CHECK PDF" # Placeholder

    question_obj = {
        "question": question_text,
        "image": None, # Add placeholder
        "options": options_text,
        "answer": correct_answer_text, # Use the full text answer
        "explanation": None, # Add placeholder
        "chapter": chapter_text # Map subject to chapter
    }
    questions.append(question_obj)
    chapters.add(chapter_text) # Add chapter to the set

# Create the final JSON structure
final_json_data = {
    "title": quiz_title,
    "chapters": sorted(list(chapters)), # Add the list of unique chapters
    "questions": questions
}

# Save as JSON
try:
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_json_data, f, indent=2, ensure_ascii=False)
    print(f"✅ Converted {len(questions)} questions to JSON successfully!")
    print(f"   Saved to: {output_path}")
except Exception as e:
    print(f"❌ Error saving JSON file: {e}")
    exit(1)