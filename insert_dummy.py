import sqlite3
import datetime

conn = sqlite3.connect('backend/dawnbox.db')
cursor = conn.cursor()

now = datetime.datetime.utcnow().isoformat()

# Insert dummy data for user "1" (the Local Dev mock user)
# Or wait, what is the user_id?
# Let's check the user_id in the frontend `page.tsx`. It uses "1" if no real user.
cursor.execute("SELECT id FROM users LIMIT 1")
user_row = cursor.fetchone()
user_id = user_row[0] if user_row else "1"

if not user_row:
    cursor.execute("INSERT INTO users (id, email, name) VALUES (?, ?, ?)", (user_id, "dev@localhost", "Local Dev"))

items = [
    (user_id, 'github', 'gh_mock_1', 'Review PR: Fix Navbar Layout', 'Please review this PR before we release.', 'https://github.com', 'alice', now, 8, 'Action Required', 'High priority PR review needed.', 0),
    (user_id, 'gmail', 'gm_mock_1', 'Weekly Team Meeting', 'Agenda for the team meeting tomorrow.', 'https://gmail.com', 'bob', now, 4, 'FYI', 'Just an informational meeting agenda.', 0),
    (user_id, 'slack', 'sl_mock_1', 'Lunch?', 'Hey, are you free for lunch today?', 'https://slack.com', 'charlie', now, 2, 'Can Ignore', 'Casual conversation, can be ignored.', 0),
    (user_id, 'github', 'gh_mock_2', 'Issue #102: Button disabled', 'The submit button on the login form is disabled.', 'https://github.com', 'dave', now, 9, 'Action Required', 'Critical bug affecting login.', 0)
]

cursor.executemany("""
    INSERT INTO items (user_id, tool_name, external_id, title, content, url, author, timestamp, priority_score, priority_tag, ai_explanation, is_resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", items)

conn.commit()
conn.close()

print("Dummy data inserted successfully.")
