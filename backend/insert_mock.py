import asyncio
import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Item, User

# You might need to adjust this path to match your database URL
DATABASE_URL = "sqlite+aiosqlite:///./dawnbox.db"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def insert_mock_data():
    async with async_session() as session:
        # Create a mock user if one doesn't exist
        mock_user = User(id="1", email="test@example.com", name="Mock User")
        session.add(mock_user)
        try:
            await session.commit()
        except:
            await session.rollback() # User already exists

        # Insert items
        items = [
            Item(
                user_id="1",
                tool_name="github",
                external_id="pr_123",
                title="Fix critical login bug in production",
                content="This PR addresses the issue where users are unable to login due to an expired SSL certificate in the auth service.",
                url="https://github.com",
                author="vidhisinghal0101",
                timestamp=datetime.datetime.utcnow(),
                priority_score=10,
                priority_tag="Action Required",
                is_resolved=False
            ),
            Item(
                user_id="1",
                tool_name="gmail",
                external_id="msg_456",
                title="Q3 Roadmap Planning",
                content="Hi team, please review the attached document for our Q3 planning session tomorrow. Be prepared with estimates.",
                url="https://gmail.com",
                author="Manager",
                timestamp=datetime.datetime.utcnow(),
                priority_score=8,
                priority_tag="Action Required",
                is_resolved=False
            )
        ]
        
        for item in items:
            session.add(item)
            
        await session.commit()
        print("Mock data inserted successfully!")

if __name__ == "__main__":
    asyncio.run(insert_mock_data())
