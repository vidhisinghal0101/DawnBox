from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True) # Using OAuth ID as Primary Key
    email = Column(String, unique=True, index=True)
    name = Column(String)
    image_url = Column(String, nullable=True)
    
    integrations = relationship("Integration", back_populates="user")
    feedbacks = relationship("UserFeedback", back_populates="user")

class Integration(Base):
    __tablename__ = "integrations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    tool_name = Column(String) # "github", "gmail"
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="integrations")

class UserFeedback(Base):
    __tablename__ = "user_feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    tool_name = Column(String)
    title = Column(String)
    content = Column(Text)
    action_taken = Column(String) # "opened_link", "resolved_quickly"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="feedbacks")
