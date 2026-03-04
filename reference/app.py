from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

from models import FuelOrder, get_session
from csv_service import CSVService
from email_service import EmailService

app = Flask(__name__)
CORS(app)

# Initialize services
csv_service = CSVService('flight_data.csv')
email_service = EmailService()

@app.route('/')
def index():
    """Render the main application page"""
    return render_template('index.html')

@app.route('/api/flights/refresh', methods=['GET'])
def refresh_flights():
    """Fetch flight data from CSV file"""
    try:
        result = csv_service.get_flight_data()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all fuel orders from database"""
    try:
        session = get_session()
        orders = session.query(FuelOrder).order_by(FuelOrder.created_at.desc()).all()
        session.close()
        
        return jsonify({
            'success': True,
            'orders': [order.to_dict() for order in orders]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get a specific fuel order"""
    try:
        session = get_session()
        order = session.query(FuelOrder).filter_by(id=order_id).first()
        session.close()
        
        if order:
            return jsonify({'success': True, 'order': order.to_dict()})
        else:
            return jsonify({'error': 'Order not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/draft', methods=['POST'])
def draft_order():
    """Draft an email for preview without sending"""
    try:
        data = request.json
        draft = email_service.draft_email(data, is_update=data.get('is_update', False))
        
        return jsonify({
            'success': True,
            'draft': draft
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/send', methods=['POST'])
def send_order():
    """Send a new fuel order"""
    try:
        data = request.json
        
        # Check if order already exists for this flight
        session = get_session()
        existing = session.query(FuelOrder).filter_by(
            flight_number=data['flight_number'],
            station=data['station'],
            status='sent'
        ).first()
        
        if existing and not data.get('force_send', False):
            session.close()
            return jsonify({
                'success': False,
                'error': 'Order already sent for this flight',
                'existing_order_id': existing.id
            }), 409
        
        # Send email
        email_result = email_service.send_fuel_order(data, is_update=False)
        
        if not email_result['success']:
            session.close()
            return jsonify(email_result), 500
        
        # Save to database
        order = FuelOrder(
            flight_number=data['flight_number'],
            aircraft_registration=data['aircraft_registration'],
            station=data['station'],
            scheduled_out_time=data['scheduled_out_time'],
            fuel_liters=data.get('fuel_liters', ''),
            fuel_lbs=data.get('fuel_lbs', ''),
            dispatcher_initials=data['dispatcher_initials'],
            status='sent',
            sent_at=datetime.utcnow(),
            sent_to=json.dumps(email_result['sent_to']),
            email_subject=email_result['subject'],
            email_body=email_result['body']
        )
        
        session.add(order)
        session.commit()
        
        order_dict = order.to_dict()
        session.close()
        
        return jsonify({
            'success': True,
            'message': 'Fuel order sent successfully',
            'order': order_dict
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>/update', methods=['PUT'])
def update_order(order_id):
    """Update and resend an existing fuel order"""
    session = None
    try:
        data = request.json
        session = get_session()
        
        # Get original order
        original_order = session.query(FuelOrder).filter_by(id=order_id).first()
        
        if not original_order:
            return jsonify({'error': 'Original order not found'}), 404
        
        # Send updated email
        email_result = email_service.send_fuel_order(data, is_update=True)
        
        if not email_result['success']:
            return jsonify(email_result), 500
        
        # Create new order record for the update
        updated_order = FuelOrder(
            flight_number=data['flight_number'],
            aircraft_registration=data['aircraft_registration'],
            station=data['station'],
            scheduled_out_time=data['scheduled_out_time'],
            fuel_liters=data.get('fuel_liters', ''),
            fuel_lbs=data.get('fuel_lbs', ''),
            dispatcher_initials=data['dispatcher_initials'],
            status='sent',
            sent_at=datetime.utcnow(),
            sent_to=json.dumps(email_result['sent_to']),
            email_subject=email_result['subject'],
            email_body=email_result['body'],
            is_updated=True,
            original_order_id=order_id,
            update_reason=data.get('update_reason', 'Aircraft swap or fuel change')
        )
        
        # Mark original as updated
        original_order.status = 'updated'
        
        session.add(updated_order)
        session.commit()
        
        # Refresh to get the ID
        session.refresh(updated_order)
        updated_order_dict = updated_order.to_dict()
        
        print(f"✅ Updated order created with ID: {updated_order.id}")
        print(f"   Flight: {updated_order.flight_number}, Status: {updated_order.status}")
        
        return jsonify({
            'success': True,
            'message': 'Updated fuel order sent successfully',
            'order': updated_order_dict
        })
        
    except Exception as e:
        print(f"❌ Error updating order: {str(e)}")
        import traceback
        traceback.print_exc()
        if session:
            session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if session:
            session.close()

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    """Delete an order (soft delete - mark as cancelled)"""
    try:
        session = get_session()
        order = session.query(FuelOrder).filter_by(id=order_id).first()
        
        if not order:
            session.close()
            return jsonify({'error': 'Order not found'}), 404
        
        order.status = 'cancelled'
        session.commit()
        session.close()
        
        return jsonify({
            'success': True,
            'message': 'Order cancelled successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """Get all station email configurations from .env"""
    try:
        stations = {}
        # Read all STATION_* variables from environment
        for key, value in os.environ.items():
            if key.startswith('STATION_'):
                station_code = key.replace('STATION_', '')
                stations[station_code] = value
        
        return jsonify({
            'success': True,
            'stations': stations
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stations', methods=['POST'])
def update_stations():
    """Update station email configurations in .env file"""
    try:
        data = request.get_json()
        stations = data.get('stations', {})
        
        # Read current .env file
        env_path = '.env'
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Remove all existing STATION_ lines and find insertion point
        new_lines = []
        station_section_start = -1
        
        for i, line in enumerate(lines):
            # Skip any existing STATION_ lines to avoid duplicates
            if line.startswith('STATION_'):
                # Mark where to insert if we haven't found it yet
                if station_section_start == -1:
                    station_section_start = len(new_lines)
                continue
            
            # Find the station configuration section header
            if 'STATION EMAIL CONFIGURATION' in line and station_section_start == -1:
                new_lines.append(line)
                # Look ahead for the end of comments
                station_section_start = len(new_lines)
                continue
                
            new_lines.append(line)
        
        # Insert updated station configurations at the right position
        if station_section_start >= 0:
            # Add station configurations
            station_lines = [f"STATION_{code}={email}\n" for code, email in sorted(stations.items())]
            # Insert after the section header comments
            insert_pos = station_section_start
            # Skip forward past any comment lines
            while insert_pos < len(new_lines) and (new_lines[insert_pos].startswith('#') or new_lines[insert_pos].strip() == ''):
                insert_pos += 1
            
            new_lines = new_lines[:insert_pos] + station_lines + ['\n'] + new_lines[insert_pos:]
        
        # Write back to .env
        with open(env_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        # Reload environment variables globally
        from dotenv import load_dotenv
        load_dotenv(override=True)
        
        print(f"✅ Station settings updated: {len(stations)} stations configured")
        for code, email in stations.items():
            print(f"   {code}: {email}")
        
        return jsonify({
            'success': True,
            'message': f'Station settings updated successfully ({len(stations)} stations)'
        })
    except Exception as e:
        print(f"❌ Error updating stations: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create database tables if they don't exist
    from models import Base, engine
    Base.metadata.create_all(engine)
    
    # Run the application
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
