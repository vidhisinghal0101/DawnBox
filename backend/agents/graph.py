from langgraph.graph import StateGraph, END
from .schema import AgentState
from .fetcher import fetch_data
from .prioritizer import prioritize_data
from .summarizer import summarize_data
import asyncio
import datetime

# We need a way to run database operations async in the graph, or wrap it.
from sqlalchemy import delete, select
from database import AsyncSessionLocal
from models import Item, Summary, UserFeedback

# Define the graph
workflow = StateGraph(AgentState)

workflow.add_node("fetch_data", fetch_data)
workflow.add_node("prioritize_data", prioritize_data)
workflow.add_node("summarize_data", summarize_data)

workflow.set_entry_point("fetch_data")
workflow.add_edge("fetch_data", "prioritize_data")
workflow.add_edge("prioritize_data", "summarize_data")
workflow.add_edge("summarize_data", END)

app_graph = workflow.compile()

async def run_pipeline(user_id: str):
    """
    Runs the langgraph pipeline and saves results to the database.
    """
    async with AsyncSessionLocal() as session:
        fb_result = await session.execute(
            select(UserFeedback)
            .where(UserFeedback.user_id == user_id)
            .order_by(UserFeedback.timestamp.desc())
            .limit(20)
        )
        feedbacks = fb_result.scalars().all()
        feedback_history = [{
            "title": fb.title,
            "content": fb.content,
            "action_taken": fb.action_taken
        } for fb in feedbacks]

    initial_state = AgentState(user_id=user_id, feedback_history=feedback_history)
    
    # Run the graph (using ainvoke because nodes are async)
    result = await app_graph.ainvoke(initial_state)
    
    # Save to database
    async with AsyncSessionLocal() as session:
        # Clear old items for this user before saving new ones
        await session.execute(
            delete(Item).where(Item.user_id == user_id)
        )
        
        # Save items
        for it in result["prioritized_items"]:
            # Check if exists
            new_item = Item(
                user_id=user_id,
                tool_name=it["tool_name"],
                external_id=it["external_id"],
                title=it["title"],
                content=it["content"],
                url=it["url"],
                author=it["author"],
                timestamp=datetime.datetime.fromisoformat(it["timestamp"]).replace(tzinfo=None),
                priority_score=int(it.get("priority_score") or 0),
                priority_tag=it.get("priority_tag"),
                ai_explanation=it.get("ai_explanation")
            )
            session.add(new_item)
            
        # Save summary
        if result["summary"]:
            new_summary = Summary(
                user_id=user_id,
                content=result["summary"]
            )
            session.add(new_summary)
            
        await session.commit()
    
    print(f"Pipeline completed for user {user_id}. Saved {len(result['prioritized_items'])} items.")

async def run_fetch_only(user_id: str):
    """
    Fetches data without running the AI analysis.
    """
    initial_state = AgentState(user_id=user_id)
    
    result = await fetch_data(initial_state)
    fetched_items = result.get("fetched_items", [])
    
    # Save to database with default priorities
    async with AsyncSessionLocal() as session:
        # Clear old items for this user before saving new ones
        await session.execute(
            delete(Item).where(Item.user_id == user_id)
        )
        
        # Save fetched items with default values
        saved_count = 0
        for it in fetched_items:
            new_item = Item(
                user_id=user_id,
                tool_name=it["tool_name"],
                external_id=it["external_id"],
                title=it["title"],
                content=it["content"],
                url=it["url"],
                author=it["author"],
                timestamp=datetime.datetime.fromisoformat(it["timestamp"]).replace(tzinfo=None),
                priority_score=0,
                priority_tag="Uncategorized",
                ai_explanation="Pending AI Analysis"
            )
            session.add(new_item)
            saved_count += 1
            
        await session.commit()
    
    print(f"Fetch completed for user {user_id}. Saved {saved_count} items.")

async def run_analyze_only(user_id: str):
    """
    Runs AI analysis on the currently fetched data in the database.
    """
    # Load items from database to construct state
    async with AsyncSessionLocal() as session:
        from sqlalchemy.future import select
        result = await session.execute(select(Item).where(Item.user_id == user_id))
        items = result.scalars().all()
        
        fb_result = await session.execute(
            select(UserFeedback)
            .where(UserFeedback.user_id == user_id)
            .order_by(UserFeedback.timestamp.desc())
            .limit(20)
        )
        feedbacks = fb_result.scalars().all()
        feedback_history = [{
            "title": fb.title,
            "content": fb.content,
            "action_taken": fb.action_taken
        } for fb in feedbacks]
        
    if not items:
        print("No items found to analyze.")
        return
        
    fetched_items = []
    for item in items:
        fetched_items.append({
            "tool_name": item.tool_name,
            "external_id": item.external_id,
            "title": item.title,
            "content": item.content,
            "url": item.url,
            "author": item.author,
            "timestamp": item.timestamp.isoformat()
        })
        
    state = AgentState(
        user_id=user_id, 
        fetched_items=fetched_items, 
        prioritized_items=[], 
        feedback_history=feedback_history,
        summary=""
    )
    
    # Run prioritize and summarize directly
    p_result = await asyncio.to_thread(prioritize_data, state)
    state.prioritized_items = p_result.get("prioritized_items", [])
    
    s_result = await asyncio.to_thread(summarize_data, state)
    state.summary = s_result.get("summary", "")
    
    # Update database
    async with AsyncSessionLocal() as session:
        await session.execute(
            delete(Item).where(Item.user_id == user_id)
        )
        
        for it in state.prioritized_items:
            new_item = Item(
                user_id=user_id,
                tool_name=it["tool_name"],
                external_id=it["external_id"],
                title=it["title"],
                content=it["content"],
                url=it["url"],
                author=it["author"],
                timestamp=datetime.datetime.fromisoformat(it["timestamp"]).replace(tzinfo=None),
                priority_score=int(it.get("priority_score") or 0),
                priority_tag=it.get("priority_tag"),
                ai_explanation=it.get("ai_explanation")
            )
            session.add(new_item)
            
        if state.summary:
            new_summary = Summary(
                user_id=user_id,
                content=state.summary
            )
            session.add(new_summary)
            
        await session.commit()
        
    print(f"Analysis completed for user {user_id}.")
