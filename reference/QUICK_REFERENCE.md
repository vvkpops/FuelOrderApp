# Quick Reference Guide

## Common Tasks

### Starting the Application

**Windows:**
```bash
start.bat
```

**Manual:**
```bash
python app.py
```

Then open: http://localhost:5000

---

## Email Format Preview

```
Subject: FUEL ORDER - AA1234 - JFK - N123AA

============================================================
FUEL ORDER
============================================================

Flight Number:           AA1234
Aircraft Registration:   N123AA
Station:                 JFK
Scheduled Out Time:      2026-01-24 14:30 UTC
Fuel Order:              15000 Liters / 33069 LBS

Dispatcher:              JD

============================================================
---
Sent via Fuel Ordering System
2026-01-24 14:25:00 UTC
```

---

## API Endpoints

If you need to integrate with other systems:

### Get All Orders
```
GET /api/orders
```

### Send New Order
```
POST /api/orders/send
Content-Type: application/json

{
  "flight_number": "AA1234",
  "aircraft_registration": "N123AA",
  "station": "JFK",
  "scheduled_out_time": "2026-01-24 14:30 UTC",
  "fuel_liters": "15000",
  "fuel_lbs": "33069",
  "dispatcher_initials": "JD"
}
```

### Update Order
```
PUT /api/orders/{order_id}/update
Content-Type: application/json

{
  "flight_number": "AA1234",
  "aircraft_registration": "N456BB",
  "station": "JFK",
  "scheduled_out_time": "2026-01-24 14:30 UTC",
  "fuel_liters": "15000",
  "fuel_lbs": "33069",
  "dispatcher_initials": "JD",
  "update_reason": "Aircraft swap"
}
```

---

## Keyboard Shortcuts (in browser)

- `Ctrl + R` - Refresh page
- `Tab` - Navigate between tabs
- `Esc` - Close modal dialogs

---

## Troubleshooting Commands

### Check if server is running:
```bash
netstat -an | findstr :5000
```

### View recent logs:
Check the terminal where `python app.py` is running

### Reset database:
```bash
del fuel_orders.db
python app.py
```

### Test Google Sheets connection:
```bash
python -c "from sheets_service import GoogleSheetsService; s = GoogleSheetsService(); print('Auth:', s.authenticate())"
```

### Test email configuration:
```bash
python -c "from email_service import EmailService; e = EmailService(); print('Configured for:', e.email_address)"
```

---

## File Locations

- **Database:** `fuel_orders.db`
- **Configuration:** `.env`
- **Google Credentials:** `credentials.json`
- **Logs:** Terminal output where app is running

---

## Station Code Format

Station codes must match between:
1. Google Sheet data
2. `.env` configuration (STATION_XXX)

Example:
- Google Sheet: `JFK`
- .env file: `STATION_JFK=email@example.com`

**Case sensitive!**

---

## Fuel Conversion Quick Reference

Jet A fuel density ≈ 0.804 kg/L

| Liters | Pounds (LBS) |
|--------|--------------|
| 5,000  | 11,023      |
| 10,000 | 22,046      |
| 15,000 | 33,069      |
| 20,000 | 44,092      |
| 25,000 | 55,115      |
| 30,000 | 66,138      |

Formula: `Liters × 2.2046 = LBS`

---

## Safety Features

✅ **Duplicate Prevention**: System warns if order already sent for a flight
✅ **Update Tracking**: All updates linked to original orders
✅ **Audit Trail**: Complete history of all orders in database
✅ **Email Preview**: Review before sending
✅ **Status Tracking**: Pending, Sent, Updated, Cancelled

---

## Support

For issues or questions:
1. Check `SETUP_GUIDE.md` for setup issues
2. Check `README.md` for feature documentation
3. Check `GOOGLE_SHEETS_SETUP.md` for sheet issues
4. Review error messages in terminal

---

## Future API Integration

When ready to replace Google Sheets with a direct API:

1. Create a new file `api_service.py`
2. Implement same structure as `sheets_service.py`
3. Update `app.py` to use `api_service` instead of `sheets_service`
4. Flight data format remains the same

The application is designed to easily swap data sources!
