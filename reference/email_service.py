import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    """Service for sending fuel order emails"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.email_address = os.getenv('EMAIL_ADDRESS')
        self.email_password = os.getenv('EMAIL_PASSWORD')
        self.cc_emails = os.getenv('CC_EMAILS', '').split(',')
        
    def get_station_emails(self, station_code):
        """Get email addresses for a specific station (reloads from environment)"""
        # Reload environment to get latest values
        from dotenv import load_dotenv
        load_dotenv(override=True)
        
        env_key = f'STATION_{station_code.upper()}'
        station_emails = os.getenv(env_key, '')
        
        if station_emails:
            return [email.strip() for email in station_emails.split(',')]
        else:
            # Return a default or log a warning
            print(f"Warning: No email configured for station {station_code}")
            return []
    
    def format_fuel_order_email(self, order_data, is_update=False):
        """
        Format the fuel order email body
        
        Args:
            order_data: Dictionary with flight information
            is_update: Boolean indicating if this is an updated order
        """
        subject_prefix = "UPDATED FUEL ORDER" if is_update else "FUEL ORDER"
        
        subject = (
            f"{subject_prefix} - {order_data['flight_number']} - "
            f"{order_data['station']} - {order_data['aircraft_registration']}"
        )
        
        # Format fuel order line
        fuel_parts = []
        if order_data.get('fuel_liters'):
            fuel_parts.append(f"{order_data['fuel_liters']} Liters")
        if order_data.get('fuel_lbs'):
            fuel_parts.append(f"{order_data['fuel_lbs']} LBS")
        fuel_order_line = " / ".join(fuel_parts)
        
        body = f"""
{'=' * 60}
{subject_prefix}
{'=' * 60}

Flight Number:           {order_data['flight_number']}
Aircraft Registration:   {order_data['aircraft_registration']}
Station:                 {order_data['station']}
Scheduled Out Time:      {order_data['scheduled_out_time']}
Fuel Order:              {fuel_order_line}

Dispatcher:              {order_data['dispatcher_initials']}

{'=' * 60}
"""
        
        if is_update:
            body += f"\n⚠️  This is an updated fuel order. Please disregard any previous orders for this flight.\n"
        
        body += f"\n---\nSent via Fuel Ordering System\n{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
        
        return subject, body
    
    def send_fuel_order(self, order_data, is_update=False):
        """
        Send fuel order email
        
        Args:
            order_data: Dictionary with flight information
            is_update: Boolean indicating if this is an updated order
            
        Returns:
            Dictionary with success status and message
        """
        try:
            # Get recipients
            to_emails = self.get_station_emails(order_data['station'])
            
            print(f"📧 Preparing to send email for station: {order_data['station']}")
            print(f"   Recipients: {to_emails}")
            
            if not to_emails:
                return {
                    'success': False, 
                    'error': f"No email addresses configured for station {order_data['station']}"
                }
            
            # Validate all email addresses
            for email in to_emails:
                if not email or '@' not in email:
                    return {
                        'success': False,
                        'error': f"Invalid email address: {email}"
                    }
            
            # Format email
            subject, body = self.format_fuel_order_email(order_data, is_update)
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.email_address
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject
            
            # Add CC if configured
            cc_list = [cc.strip() for cc in self.cc_emails if cc.strip()]
            if cc_list:
                msg['Cc'] = ', '.join(cc_list)
            
            # Attach body
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_address, self.email_password)
                
                # Explicitly send to all recipients
                all_recipients = to_emails + cc_list
                server.sendmail(
                    self.email_address,
                    all_recipients,
                    msg.as_string()
                )
            
            print(f"✅ Email sent successfully to: {', '.join(to_emails)}")
            if cc_list:
                print(f"   CC: {', '.join(cc_list)}")
            
            return {
                'success': True,
                'sent_to': all_recipients,
                'subject': subject,
                'body': body
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Email send failed: {error_msg}")
            return {
                'success': False,
                'error': error_msg
            }
    
    def draft_email(self, order_data, is_update=False):
        """
        Create email draft without sending
        
        Returns the formatted subject and body for preview
        """
        subject, body = self.format_fuel_order_email(order_data, is_update)
        to_emails = self.get_station_emails(order_data['station'])
        cc_list = [cc.strip() for cc in self.cc_emails if cc.strip()]
        
        return {
            'subject': subject,
            'body': body,
            'to': to_emails,
            'cc': cc_list
        }
