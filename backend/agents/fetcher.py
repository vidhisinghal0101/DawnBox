from .schema import AgentState
import datetime

import httpx
import datetime
from database import AsyncSessionLocal
from models import Integration
from sqlalchemy import select

async def fetch_data(state: AgentState):
    """
    Fetches real data from GitHub if a token is available.
    """
    user_id = state.user_id
    items = []
    
    async with AsyncSessionLocal() as db:
        # 1. Fetch GitHub Integration
        result = await db.execute(
            select(Integration).where(
                Integration.user_id == user_id,
                Integration.tool_name == "github",
                Integration.is_active == True
            )
        )
        github_int = result.scalars().first()
        
        if github_int and github_int.access_token:
            try:
                headers = {
                    "Authorization": f"Bearer {github_int.access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                # Fetch recent notifications or issues
                async with httpx.AsyncClient() as client:
                    resp = await client.get("https://api.github.com/notifications", headers=headers)
                    if resp.status_code == 200:
                        notifications = resp.json()
                        for note in notifications[:10]:
                            url_val = note["subject"].get("url")
                            items.append({
                                "tool_name": "github",
                                "external_id": note["id"],
                                "title": note["subject"]["title"],
                                "content": f"New notification: {note['reason']}",
                                "url": url_val.replace("api.github.com/repos", "github.com") if url_val else "https://github.com",
                                "author": note["repository"]["full_name"],
                                "timestamp": datetime.datetime.strptime(note["updated_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc).isoformat()
                            })
            except Exception as e:
                print(f"Error fetching GitHub data: {e}")

        # 2. Fetch Gmail Integration
        print("GMAIL FETCH STARTED")
        print(f"User ID: {user_id}")
        
        result = await db.execute(
            select(Integration).where(
                Integration.user_id == user_id,
                Integration.tool_name == "google", # Standardized to 'google'
                Integration.is_active == True
            )
        )
        gmail_int = result.scalars().first()
        
        access_token = gmail_int.access_token if gmail_int else None
        print(f"Token exists: {access_token is not None}")
        print(f"Token value: {access_token[:20] if access_token else 'NONE'}")
        
        if gmail_int and gmail_int.access_token:
            try:
                print(f"CALLING GMAIL API with token: {gmail_int.access_token[:20]}...")
                headers = {"Authorization": f"Bearer {gmail_int.access_token}"}
                # Smart Query: Exclude common noise categories
                query = "-category:promotions -category:social -category:updates -category:forums"
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q={query}", 
                        headers=headers
                    )
                    print(f"GMAIL RESPONSE STATUS: {resp.status_code}")
                    
                    if resp.status_code == 200:
                        messages_data = resp.json().get("messages", [])
                        print(f"SUCCESS: fetched {len(messages_data)} emails")
                        
                        for msg in messages_data:
                            m_resp = await client.get(f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg['id']}", headers=headers)
                            if m_resp.status_code == 200:
                                m_data = m_resp.json()
                                headers_list = m_data["payload"]["headers"]
                                subject = next((h["value"] for h in headers_list if h["name"] == "Subject"), "No Subject")
                                sender = next((h["value"] for h in headers_list if h["name"] == "From"), "Unknown")
                                
                                if msg == messages_data[0]:
                                    print(f"First email subject: {subject}")

                                items.append({
                                    "tool_name": "gmail",
                                    "external_id": msg["id"],
                                    "title": subject,
                                    "content": m_data["snippet"],
                                    "url": f"https://mail.google.com/mail/u/0/#all/{m_data['threadId']}",
                                    "author": sender,
                                    "timestamp": datetime.datetime.fromtimestamp(int(m_data["internalDate"])/1000, tz=datetime.timezone.utc).isoformat()
                                })
                    else:
                        print(f"GMAIL FETCH FAILED: {resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"GMAIL FETCH FAILED (Exception): {str(e)}")
        else:
            print(f"No active Google integration found for user {user_id}")

        # 3. Fetch Slack Integration
        print("SLACK FETCH STARTED")
        result = await db.execute(
            select(Integration).where(
                Integration.user_id == user_id,
                Integration.tool_name == "slack",
                Integration.is_active == True
            )
        )
        slack_int = result.scalars().first()
        
        if slack_int and slack_int.access_token:
            try:
                print(f"CALLING SLACK API with token: {slack_int.access_token[:10]}...")
                headers = {"Authorization": f"Bearer {slack_int.access_token}"}
                
                # We attempt to fetch recent DMs or mentions using search.messages
                # Note: This requires the 'search:read' scope in Slack API
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        "https://slack.com/api/search.messages?query=is:unread&count=5", 
                        headers=headers
                    )
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("ok"):
                            messages = data.get("messages", {}).get("matches", [])
                            for msg in messages:
                                items.append({
                                    "tool_name": "slack",
                                    "external_id": msg.get("iid", msg.get("ts")),
                                    "title": f"Message in #{msg.get('channel', {}).get('name', 'Unknown')}",
                                    "content": msg.get("text", "No content"),
                                    "url": msg.get("permalink", "https://slack.com"),
                                    "author": msg.get("username", "Unknown"),
                                    "timestamp": datetime.datetime.fromtimestamp(float(msg.get("ts", 0)), tz=datetime.timezone.utc).isoformat()
                                })
                        else:
                            print(f"SLACK SEARCH FAILED: {data.get('error')}")
                    else:
                        print(f"SLACK FETCH HTTP ERROR: {resp.status_code}")
            except Exception as e:
                print(f"SLACK FETCH FAILED (Exception): {str(e)}")
        else:
            print(f"No active Slack integration found for user {user_id}")

    # Inject Mock Data for mock integrations
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

    return {"fetched_items": items}
