import asyncio
import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Item, User

# You might need to adjust this path to match your database URL
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_DfEnAXQ1d6MJ@ep-frosty-king-atnkcnax-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Strip query parameters that cause asyncpg errors
if "postgresql+asyncpg" in DATABASE_URL and "?" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?")[0]

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def insert_mock_data():
    async with async_session() as session:
        # Create a mock user if one doesn't exist
        mock_user = User(id="1", email="dev@localhost", name="Local Dev")
        session.add(mock_user)
        try:
            await session.commit()
        except Exception as e:
            await session.rollback() # User already exists

        now = datetime.datetime.utcnow()

        # Insert comprehensive items
        items = [
            # --- GITHUB MOCKS ---
            Item(
                user_id="1",
                tool_name="github",
                external_id="gh_1",
                title="Review Requested: Implement Redis caching layer",
                content="I've added the Redis caching layer to the user endpoints. Please review the invalidation logic closely.",
                url="https://github.com",
                author="alex-dev",
                timestamp=now - datetime.timedelta(minutes=15),
                priority_score=9,
                priority_tag="Action Required",
                ai_explanation="You were explicitly requested for a code review on a critical backend feature.",
                is_resolved=False
            ),
            Item(
                user_id="1",
                tool_name="github",
                external_id="gh_2",
                title="Issue #402: Memory leak in worker process",
                content="We are seeing OOM kills every 4 hours on the background workers.",
                url="https://github.com",
                author="datadog-alerts",
                timestamp=now - datetime.timedelta(hours=2),
                priority_score=10,
                priority_tag="Action Required",
                ai_explanation="Critical production bug affecting background workers.",
                is_resolved=False
            ),
            Item(
                user_id="1",
                tool_name="github",
                external_id="gh_3",
                title="Merged: Update README.md",
                content="Fixed a typo in the setup instructions.",
                url="https://github.com",
                author="sarah-docs",
                timestamp=now - datetime.timedelta(days=1),
                priority_score=2,
                priority_tag="Ignore",
                ai_explanation="Minor documentation update that has already been merged.",
                is_resolved=False
            ),

            # --- SLACK MOCKS ---
            Item(
                user_id="1",
                tool_name="slack",
                external_id="sl_1",
                title="Direct Message from CTO",
                content="Hey, do we have the final numbers for the Q3 API usage? Need them for the board deck ASAP.",
                url="https://slack.com",
                author="cto_mark",
                timestamp=now - datetime.timedelta(minutes=5),
                priority_score=10,
                priority_tag="Action Required",
                ai_explanation="Direct request from executive leadership requiring immediate attention.",
                is_resolved=False
            ),
            Item(
                user_id="1",
                tool_name="slack",
                external_id="sl_2",
                title="Mention in #engineering-frontend",
                content="Looks like the UI changes caused a slight performance regression on Safari. Can you take a look?",
                url="https://slack.com",
                author="qa_team",
                timestamp=now - datetime.timedelta(hours=1),
                priority_score=7,
                priority_tag="Action Required",
                ai_explanation="You were explicitly tagged to investigate a UI performance issue.",
                is_resolved=False
            ),
            Item(
                user_id="1",
                tool_name="slack",
                external_id="sl_3",
                title="Message in #random",
                content="Who wants to order pizza for lunch today? 🍕",
                url="https://slack.com",
                author="office_manager",
                timestamp=now - datetime.timedelta(hours=3),
                priority_score=3,
                priority_tag="FYI",
                ai_explanation="Casual team chatter, no action needed.",
                is_resolved=False
            ),

            # --- GMAIL MOCKS ---
            Item(
                user_id="1",
                tool_name="gmail",
                external_id="gm_1",
                title="URGENT: AWS Billing Alert - Limit Exceeded",
                content="Your AWS account has exceeded the 90% threshold for the monthly budget. Current forecast is $4,500.",
                url="https://mail.google.com",
                author="AWS Notifications",
                timestamp=now - datetime.timedelta(minutes=2),
                priority_score=10,
                priority_tag="Action Required",
                ai_explanation="Critical billing alert that requires immediate financial review.",
                is_resolved=False
            ),
            Item(
                user_id="1",
                tool_name="gmail",
                external_id="gm_2",
                title="Weekly Engineering Newsletter",
                content="Here are the top tech blogs you should read this week...",
                url="https://mail.google.com",
                author="Tech Weekly",
                timestamp=now - datetime.timedelta(days=2),
                priority_score=2,
                priority_tag="Ignore",
                ai_explanation="Automated newsletter, low priority.",
                is_resolved=False
            ),

            # --- SNOOZED MOCKS ---
            Item(
                user_id="1",
                tool_name="github",
                external_id="gh_4_snoozed",
                title="Draft PR: Migrate to Next.js 15",
                content="Starting the migration. Will take a few days. Don't review yet.",
                url="https://github.com",
                author="frontend-lead",
                timestamp=now - datetime.timedelta(days=1),
                priority_score=5,
                priority_tag="FYI",
                ai_explanation="Large draft PR that is not ready for review yet.",
                is_resolved=False,
                snoozed_until=now + datetime.timedelta(days=2) # Snoozed for 2 days
            )
        ]
        
        for item in items:
            session.add(item)
            
        await session.commit()
        print(f"{len(items)} comprehensive mock items inserted successfully into Neon!")

if __name__ == "__main__":
    asyncio.run(insert_mock_data())
