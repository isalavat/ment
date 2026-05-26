import re

file_path = r'backend\src\services\bookingService.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# 1) Count lines matching ^ {2,}\S (leading spaces with 2 or more)
pattern1 = re.compile(r'^ {2,}\S')
count1 = sum(1 for line in lines if pattern1.match(line))

# 2) Count lines matching ^\t+\S (leading tabs)
pattern2 = re.compile(r'^\t+\S')
count2 = sum(1 for line in lines if pattern2.match(line))

# 3) First 30 lines
first_30 = '\n'.join(lines[:30])

# 4) Snippet around async updateMeetingLink
update_meeting_link_snippet = []
for i, line in enumerate(lines):
    if 'async updateMeetingLink' in line:
        start = max(0, i - 2)
        end = min(len(lines), i + 15)
        update_meeting_link_snippet = '\n'.join(lines[start:end])
        break

# 5) Git status
import subprocess
try:
    result = subprocess.run(['git', '--no-pager', 'status', '--short'], 
                          cwd=r'C:\Programming\Projects\ment\ment',
                          capture_output=True, text=True)
    git_status = result.stdout
except:
    git_status = "Git command failed"

print("=" * 60)
print("VALIDATION RESULTS")
print("=" * 60)
print(f"\n1) Lines matching '^ {{2,}}\\S' (2+ leading spaces): {count1}")
print(f"\n2) Lines matching '^\\t+\\S' (leading tabs): {count2}")
print(f"\n3) First 30 lines:")
print("-" * 60)
print(first_30)
print("-" * 60)
print(f"\n4) Snippet around 'async updateMeetingLink':")
print("-" * 60)
print(update_meeting_link_snippet)
print("-" * 60)
print(f"\n5) Git status:")
print("-" * 60)
print(git_status)
print("-" * 60)
