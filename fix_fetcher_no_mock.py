import re

with open('backend/agents/fetcher.py', 'r') as f:
    content = f.read()

# We need to remove the mock injection block at the end of the file.
start_marker = "    # Inject Mock Data for mock integrations"
end_marker = "    return {\"fetched_items\": items}"

if start_marker in content and end_marker in content:
    content = content[:content.find(start_marker)] + end_marker + "\n"

with open('backend/agents/fetcher.py', 'w') as f:
    f.write(content)

print("Done")
