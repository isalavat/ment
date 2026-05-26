import re

file_path = r'backend\src\services\bookingService.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def convert_line(line):
    match = re.match(r'^( *)', line)
    if match:
        spaces = match.group(1)
        num_spaces = len(spaces)
        tabs = '\t' * (num_spaces // 2)
        remainder = ' ' * (num_spaces % 2)
        return tabs + remainder + line[num_spaces:]
    return line

lines = content.split('\n')
converted_lines = [convert_line(line) for line in lines]
converted_content = '\n'.join(converted_lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(converted_content)

print('Conversion complete')
