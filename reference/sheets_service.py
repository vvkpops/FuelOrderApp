import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

class GoogleSheetsService:
    """Service for reading flight data from Google Sheets"""
    
    def __init__(self):
        self.credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')
        self.sheet_id = os.getenv('GOOGLE_SHEET_ID')
        self.client = None
        
    def authenticate(self):
        """Authenticate with Google Sheets API"""
        try:
            scope = [
                'https://spreadsheets.google.com/feeds',
                'https://www.googleapis.com/auth/drive'
            ]
            
            creds = ServiceAccountCredentials.from_json_keyfile_name(
                self.credentials_file, 
                scope
            )
            self.client = gspread.authorize(creds)
            return True
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
    
    def get_flight_data(self, worksheet_name='Sheet1'):
        """
        Fetch flight data from Google Sheets
        
        Expected columns:
        - Flight Number
        - Aircraft Registration
        - Station
        - Scheduled Out Time
        - Fuel Order (Liters)
        - Fuel Order (LBS)
        - Dispatcher Initials
        """
        if not self.client:
            if not self.authenticate():
                return {'error': 'Failed to authenticate with Google Sheets'}
        
        try:
            sheet = self.client.open_by_key(self.sheet_id)
            worksheet = sheet.worksheet(worksheet_name)
            
            # Get all records as list of dictionaries
            records = worksheet.get_all_records()
            
            # Transform to standardized format
            flight_data = []
            for record in records:
                # Skip empty rows
                if not record.get('Flight Number'):
                    continue
                    
                flight_data.append({
                    'flight_number': str(record.get('Flight Number', '')).strip(),
                    'aircraft_registration': str(record.get('Aircraft Registration', '')).strip(),
                    'station': str(record.get('Station', '')).strip().upper(),
                    'scheduled_out_time': str(record.get('Scheduled Out Time', '')).strip(),
                    'fuel_liters': str(record.get('Fuel Order (Liters)', '')).strip(),
                    'fuel_lbs': str(record.get('Fuel Order (LBS)', '')).strip(),
                    'dispatcher_initials': str(record.get('Dispatcher Initials', '')).strip().upper()
                })
            
            return {'success': True, 'data': flight_data, 'count': len(flight_data)}
            
        except Exception as e:
            return {'error': f'Failed to read sheet: {str(e)}'}
    
    def update_sheet_status(self, row_number, status):
        """
        Update the status column in Google Sheets
        (Optional feature to mark orders as sent in the sheet)
        """
        if not self.client:
            if not self.authenticate():
                return False
        
        try:
            sheet = self.client.open_by_key(self.sheet_id)
            worksheet = sheet.get_worksheet(0)
            
            # Assuming status column is the last column
            worksheet.update_cell(row_number + 1, 8, status)  # +1 for header row
            return True
            
        except Exception as e:
            print(f"Failed to update sheet: {e}")
            return False
