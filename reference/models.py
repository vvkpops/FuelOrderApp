from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class FuelOrder(Base):
    """Model for storing fuel orders"""
    __tablename__ = 'fuel_orders'
    
    id = Column(Integer, primary_key=True)
    flight_number = Column(String(20), nullable=False)
    aircraft_registration = Column(String(20), nullable=False)
    station = Column(String(10), nullable=False)
    scheduled_out_time = Column(String(50), nullable=False)
    fuel_liters = Column(String(20))
    fuel_lbs = Column(String(20))
    dispatcher_initials = Column(String(10), nullable=False)
    
    # Tracking fields
    status = Column(String(20), default='pending')  # pending, sent, updated
    sent_at = Column(DateTime)
    sent_to = Column(Text)  # JSON string of recipients
    email_subject = Column(String(255))
    email_body = Column(Text)
    
    # Update tracking
    is_updated = Column(Boolean, default=False)
    original_order_id = Column(Integer)  # Reference to original order if this is an update
    update_reason = Column(String(255))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert order to dictionary"""
        import json
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'aircraft_registration': self.aircraft_registration,
            'station': self.station,
            'scheduled_out_time': self.scheduled_out_time,
            'fuel_liters': self.fuel_liters,
            'fuel_lbs': self.fuel_lbs,
            'dispatcher_initials': self.dispatcher_initials,
            'status': self.status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'sent_to': json.loads(self.sent_to) if self.sent_to else [],
            'is_updated': self.is_updated,
            'original_order_id': self.original_order_id,
            'update_reason': self.update_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Database setup
engine = create_engine('sqlite:///fuel_orders.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

def get_session():
    """Get a new database session"""
    return Session()
