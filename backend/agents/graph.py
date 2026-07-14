from langgraph.graph import StateGraph, END
from .schema import AgentState
from .fetcher import fetch_data
from .prioritizer import prioritize_data
from .summarizer import summarize_data
import asyncio
import datetime

# We need a way to run database operations async in the graph, or wrap it.
from sqlalchemy import select
from database import AsyncSessionLocal
from models import UserFeedback

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
    Runs the full pipeline in-memory and returns the prioritized items and summary.
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
    result = await app_graph.ainvoke(initial_state)
    return {
        "prioritized_items": result.get("prioritized_items", []),
        "summary": result.get("summary", "")
    }

async def run_fetch_only(user_id: str):
    """
    Fetches raw notification data in-memory and returns it.
    """
    initial_state = AgentState(user_id=user_id)
    result = await fetch_data(initial_state)
    return result.get("fetched_items", [])

async def run_analyze_only(user_id: str, fetched_items: list):
    """
    Runs AI analysis on the provided fetched items in-memory and returns the results.
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
    
    return {
        "prioritized_items": state.prioritized_items,
        "summary": state.summary
    }
