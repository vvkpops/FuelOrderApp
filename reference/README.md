# Fuel Ordering Application

A web-based application for flight dispatchers to automate fuel ordering via email.

## Features

- **Pull flight data** from Google Sheets (testing) or API (future)
- **Auto-draft emails** with standardized fuel order format
- **Send orders** to station-specific recipients
- **Track sent orders** with status history
- **Update & resend** orders when aircraft swaps occur
- **Duplicate prevention** for already-sent orders

## Data Fields

- Aircraft Registration
- Flight Number
- Departing Station
- Scheduled Out Time
- Fuel Order (Liters or LBS)
- Dispatcher Initials

## Setup Instructions

### 1. Prerequisites

- Python 3.9 or higher
- Gmail account (for sending emails)
- Google Cloud Project (for Sheets API access)

### 2. Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### 3. Google Sheets Setup

1. Create a Google Sheet with the following columns:
   - `Flight Number`
   - `Aircraft Registration`
   - `Station`
   - `Scheduled Out Time`
   - `Fuel Order (Liters)`
   - `Fuel Order (LBS)`
   - `Dispatcher Initials`

2. Enable Google Sheets API:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Google Sheets API"
   - Create credentials (Service Account)
   - Download the JSON file and save as `credentials.json`

3. Share your Google Sheet with the service account email (found in credentials.json)

### 4. Email Setup (Gmail)

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Copy the generated password

### 5. Configuration

1. Copy `.env.example` to `.env`
2. Fill in your configuration:
   - SMTP credentials
   - Google Sheet ID (from the URL)
   - Station email addresses
   - CC recipients

### 6. Run the Application

```bash
python app.py
```

Open your browser to: `http://localhost:5000`

## Usage

### Sending a New Fuel Order

1. Click "Refresh from Google Sheets" to load flight data
2. Review the flight information
3. Click "Draft Email" to preview
4. Click "Send Order" to dispatch the fuel order
5. The system marks it as sent and logs the transaction

### Updating an Order (Aircraft Swap)

1. Find the original order in the "Sent Orders" tab
2. Click "Update Order"
3. Modify the aircraft registration or fuel amount
4. The system will resend with "UPDATED ORDER" in the subject
5. Original and updated versions are tracked

## Email Format

```
Subject: FUEL ORDER - [Flight Number] - [Station] - [Aircraft Registration]

FUEL ORDER

Flight Number: [Flight Number]
Aircraft Registration: [Aircraft Registration]
Station: [Station]
Scheduled Out Time: [Time in UTC/Local]
Fuel Order: [Amount] Liters / [Amount] LBS

Dispatcher: [Initials]

---
Sent via Fuel Ordering System
```

## Project Structure

```
fuel-ordering-app/
├── app.py                 # Main Flask application
├── models.py              # Database models
├── sheets_service.py      # Google Sheets integration
├── email_service.py       # Email sending logic
├── database.py            # Database initialization
├── static/
│   ├── css/
│   │   └── style.css     # UI styles
│   └── js/
│       └── app.js        # Frontend logic
├── templates/
│   └── index.html        # Main UI
├── requirements.txt       # Python dependencies
├── .env                  # Configuration (not in git)
└── README.md             # This file
```

## Future Enhancements

- Direct API integration (replacing Google Sheets)
- Multi-user authentication
- Order history reports
- Automated reminders
- Mobile app
