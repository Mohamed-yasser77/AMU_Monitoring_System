import os

file_path = r"d:\PSG TECH 2022-2027\Sem 8\Capstone Project\backend\farms\views.py"

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
found = False
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'animal_tag=f"{flock_tag}-{i:03d}"' in line and not found:
        # Check if the next line is already date_of_birth to avoid double insertion
        if i + 1 < len(lines) and 'date_of_birth=dob' not in lines[i+1]:
            # Maintain indentation
            indent = line[:line.find('animal_tag')]
            new_lines.append(f"{indent}date_of_birth=dob,\n")
            found = True

if found:
    with open(file_path, 'w') as f:
        f.writelines(new_lines)
    print("Successfully updated views.py")
else:
    print("Could not find the target line in views.py")
