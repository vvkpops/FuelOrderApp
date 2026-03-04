import csv
import os
from datetime import datetime

class CSVService:
    """Service for reading flight data from local CSV file"""
    
    def __init__(self, csv_file='flight_data.csv'):
        self.csv_file = csv_file
        self._ensure_csv_exists()
    
    def _ensure_csv_exists(self):
        """Create CSV file with headers and sample data if it doesn't exist"""
        if not os.path.exists(self.csv_file):
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                # Write headers
                writer.writerow([
                    'Flight Number',
                    'Aircraft Registration',
                    'Station',
                    'Scheduled Out Time',
                    'Fuel Order (Liters)',
                    'Fuel Order (LBS)',
                    'Dispatcher Initials'
                ])
                # Add sample data
                writer.writerow([
                    'TEST001',
                    'N999ZZ',
                    'JFK',
                    '2026-01-24 20:00 UTC',
                    '10000',
                    '22046',
                    'TEST'
                ])
                writer.writerow([
                    'AA1234',
                    'N123AA',
                    'LAX',
                    '2026-01-24 18:30 UTC',
                    '15000',
                    '33069',
                    'JD'
                ])
                writer.writerow([
                    'UA5678',
                    'N456UA',
                    'ORD',
                    '2026-01-24 16:45 UTC',
                    '12000',
                    '26455',
                    'MS'
                ])
            print(f"Created {self.csv_file} with sample flight data")
    
    def get_flight_data(self):
        """
        Read all flight data from CSV file
        
        Returns:
            dict: Success status and list of flights
        """
        try:
            flights = []
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Skip empty rows
                    if not row.get('Flight Number', '').strip():
                        continue
                    
                    flights.append({
                        'flight_number': row['Flight Number'].strip(),
                        'aircraft_registration': row['Aircraft Registration'].strip(),
                        'station': row['Station'].strip().upper(),
                        'scheduled_out_time': row['Scheduled Out Time'].strip(),
                        'fuel_liters': row.get('Fuel Order (Liters)', '').strip(),
                        'fuel_lbs': row.get('Fuel Order (LBS)', '').strip(),
                        'dispatcher_initials': row['Dispatcher Initials'].strip().upper()
                    })
            
            return {'success': True, 'data': flights, 'count': len(flights)}
            
        except FileNotFoundError:
            self._ensure_csv_exists()
            return self.get_flight_data()
        except Exception as e:
            return {'error': f'Failed to read CSV: {str(e)}'}
    
    def add_flight(self, flight_data):
        """
        Add a new flight to CSV file
        
        Args:
            flight_data: Dictionary with flight information
            
        Returns:
            bool: Success status
        """
        try:
            with open(self.csv_file, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    flight_data.get('flight_number', ''),
                    flight_data.get('aircraft_registration', ''),
                    flight_data.get('station', ''),
                    flight_data.get('scheduled_out_time', ''),
                    flight_data.get('fuel_liters', ''),
                    flight_data.get('fuel_lbs', ''),
                    flight_data.get('dispatcher_initials', '')
                ])
            return True
        except Exception as e:
            print(f"Error adding flight to CSV: {e}")
            return False
    
    def update_flight(self, flight_number, updated_data):
        """
        Update an existing flight in CSV file
        
        Args:
            flight_number: Flight number to update
            updated_data: Dictionary with updated flight information
            
        Returns:
            bool: Success status
        """
        try:
            flights = []
            updated = False
            
            # Read all flights
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['Flight Number'].strip() == flight_number:
                        # Update this row
                        flights.append({
                            'Flight Number': updated_data.get('flight_number', row['Flight Number']),
                            'Aircraft Registration': updated_data.get('aircraft_registration', row['Aircraft Registration']),
                            'Station': updated_data.get('station', row['Station']),
                            'Scheduled Out Time': updated_data.get('scheduled_out_time', row['Scheduled Out Time']),
                            'Fuel Order (Liters)': updated_data.get('fuel_liters', row.get('Fuel Order (Liters)', '')),
                            'Fuel Order (LBS)': updated_data.get('fuel_lbs', row.get('Fuel Order (LBS)', '')),
                            'Dispatcher Initials': updated_data.get('dispatcher_initials', row['Dispatcher Initials'])
                        })
                        updated = True
                    else:
                        flights.append(dict(row))
            
            if not updated:
                return False
            
            # Write back to CSV
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as f:
                fieldnames = ['Flight Number', 'Aircraft Registration', 'Station', 
                            'Scheduled Out Time', 'Fuel Order (Liters)', 
                            'Fuel Order (LBS)', 'Dispatcher Initials']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(flights)
            
            return True
        except Exception as e:
            print(f"Error updating flight in CSV: {e}")
            return False
    
    def delete_flight(self, flight_number):
        """
        Delete a flight from CSV file
        
        Args:
            flight_number: Flight number to delete
            
        Returns:
            bool: Success status
        """
        try:
            flights = []
            deleted = False
            
            # Read all flights except the one to delete
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['Flight Number'].strip() != flight_number:
                        flights.append(dict(row))
                    else:
                        deleted = True
            
            if not deleted:
                return False
            
            # Write back to CSV
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as f:
                fieldnames = ['Flight Number', 'Aircraft Registration', 'Station', 
                            'Scheduled Out Time', 'Fuel Order (Liters)', 
                            'Fuel Order (LBS)', 'Dispatcher Initials']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(flights)
            
            return True
        except Exception as e:
            print(f"Error deleting flight from CSV: {e}")
            return False
