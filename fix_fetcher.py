import re

with open('backend/agents/fetcher.py', 'r') as f:
    content = f.read()

# Replace the fallback block
old_fallback = """    # Fallback/Empty message if no data found
    if not items:
        now = datetime.datetime.now(datetime.timezone.utc)
        items = [
            {
                "tool_name": "github",
                "external_id": "mock_gh_1",
                "title": "PR Review: Add new AI pipeline architecture",
                "content": "I've reviewed the code. Please address the comments on the summarizer agent before merging.",
                "url": "https://github.com",
                "author": "alex-dev",
                "timestamp": now.isoformat()
            },
            {
                "tool_name": "gmail",
                "external_id": "mock_gm_1",
                "title": "URGENT: Production database latency alert",
                "content": "We are seeing elevated latency on the primary database cluster. Please investigate immediately.",
                "url": "https://mail.google.com",
                "author": "Datadog Alerts",
                "timestamp": (now - datetime.timedelta(minutes=15)).isoformat()
            },
            {
                "tool_name": "github",
                "external_id": "mock_gh_2",
                "title": "Issue #42: Button text is misaligned on mobile",
                "content": "When viewing the dashboard on an iPhone, the refresh button overlaps with the header.",
                "url": "https://github.com",
                "author": "sarah-design",
                "timestamp": (now - datetime.timedelta(hours=2)).isoformat()
            },
            {
                "tool_name": "slack",
                "external_id": "mock_sl_1",
                "title": "Message in #engineering",
                "content": "Hey team, are we still doing the deployment at 3 PM today?",
                "url": "https://slack.com",
                "author": "john.doe",
                "timestamp": (now - datetime.timedelta(hours=1)).isoformat()
            },
            {
                "tool_name": "gmail",
                "external_id": "mock_gm_2",
                "title": "Weekly Newsletter: AI Trends",
                "content": "Here are the top 5 AI trends you need to know about this week...",
                "url": "https://mail.google.com",
                "author": "Tech Weekly",
                "timestamp": (now - datetime.timedelta(hours=5)).isoformat()
            }
        ]
        
    return {"fetched_items": items}"""

new_fallback = """    # Inject Mock Data for mock integrations
    now = datetime.datetime.now(datetime.timezone.utc)
    
    if github_int and github_int.access_token and github_int.access_token.startswith("mock_"):
        items.extend([
            {
                "tool_name": "github",
                "external_id": "mock_gh_1",
                "title": "PR Review: Add new AI pipeline architecture",
                "content": "I've reviewed the code. Please address the comments on the summarizer agent before merging.",
                "url": "https://github.com",
                "author": "alex-dev",
                "timestamp": now.isoformat()
            },
            {
                "tool_name": "github",
                "external_id": "mock_gh_2",
                "title": "Issue #42: Button text is misaligned on mobile",
                "content": "When viewing the dashboard on an iPhone, the refresh button overlaps with the header.",
                "url": "https://github.com",
                "author": "sarah-design",
                "timestamp": (now - datetime.timedelta(hours=2)).isoformat()
            }
        ])

    if gmail_int and gmail_int.access_token and gmail_int.access_token.startswith("mock_"):
        items.extend([
            {
                "tool_name": "gmail",
                "external_id": "mock_gm_1",
                "title": "URGENT: Production database latency alert",
                "content": "We are seeing elevated latency on the primary database cluster. Please investigate immediately.",
                "url": "https://mail.google.com",
                "author": "Datadog Alerts",
                "timestamp": (now - datetime.timedelta(minutes=15)).isoformat()
            },
            {
                "tool_name": "gmail",
                "external_id": "mock_gm_2",
                "title": "Weekly Newsletter: AI Trends",
                "content": "Here are the top 5 AI trends you need to know about this week...",
                "url": "https://mail.google.com",
                "author": "Tech Weekly",
                "timestamp": (now - datetime.timedelta(hours=5)).isoformat()
            }
        ])

    if slack_int and slack_int.access_token and slack_int.access_token.startswith("mock_"):
        items.extend([
            {
                "tool_name": "slack",
                "external_id": "mock_sl_1",
                "title": "Message in #engineering",
                "content": "Hey team, are we still doing the deployment at 3 PM today?",
                "url": "https://slack.com",
                "author": "john.doe",
                "timestamp": (now - datetime.timedelta(hours=1)).isoformat()
            }
        ])
        
    # If the user has completely empty dashboard, give them a welcome dummy data
    if not items:
        items.extend([
            {
                "tool_name": "github",
                "external_id": "welcome_1",
                "title": "Welcome to DawnBox",
                "content": "Connect your integrations in the Settings page to get started!",
                "url": "https://github.com",
                "author": "DawnBox",
                "timestamp": now.isoformat()
            }
        ])

    return {"fetched_items": items}"""

content = content.replace(old_fallback, new_fallback)

with open('backend/agents/fetcher.py', 'w') as f:
    f.write(content)

print("Done")
