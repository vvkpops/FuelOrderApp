# Google Sheets Template Setup

## 1. Create Your Google Sheet

Create a new Google Sheet with the following structure:

### Column Headers (Row 1):

| Flight Number | Aircraft Registration | Station | Scheduled Out Time | Fuel Order (Liters) | Fuel Order (LBS) | Dispatcher Initials |
|--------------|----------------------|---------|-------------------|---------------------|-----------------|-------------------|

### Example Data:

| Flight Number | Aircraft Registration | Station | Scheduled Out Time | Fuel Order (Liters) | Fuel Order (LBS) | Dispatcher Initials |
|--------------|----------------------|---------|-------------------|---------------------|-----------------|-------------------|
| AA1234 | N123AA | JFK | 2026-01-24 14:30 UTC | 15000 | 33069 | JD |
| UA5678 | N456UA | LAX | 2026-01-24 16:45 UTC | 12000 | 26455 | MS |
| DL9012 | N789DL | ORD | 2026-01-24 18:00 UTC | 18000 | 39683 | RK |

## 2. Important Notes:

- **Column names must match exactly** (case-sensitive)
- All columns are required (can be empty for Liters or LBS)
- Flight Number format: Airline code + number (e.g., AA1234)
- Aircraft Registration: Standard format with N-number
- Station: 3-letter airport code (IATA)
- Scheduled Out Time: Include timezone (UTC recommended)
- Fuel values: Numbers only
- Dispatcher Initials: 2-3 characters

## 3. Fuel Conversion:

If you need to convert between Liters and Pounds:
- **Liters to LBS**: Multiply by 2.2046 (for Jet A fuel at standard density ~0.804 kg/L)
- **LBS to Liters**: Divide by 2.2046

Common conversions:
- 10,000 Liters ≈ 22,046 LBS
- 15,000 Liters ≈ 33,069 LBS
- 20,000 Liters ≈ 44,092 LBS

## 4. Sharing Your Sheet:

After creating the Google Sheet:
1. Click "Share" in the top-right corner
2. Add the service account email from your `credentials.json` file
   - Format: `your-service-account@project-id.iam.gserviceaccount.com`
3. Give it **Editor** permissions
4. Click "Done"

## 5. Getting Your Sheet ID:

Your Google Sheet URL looks like this:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

Copy the `SHEET_ID_HERE` part and add it to your `.env` file:
```
GOOGLE_SHEET_ID=SHEET_ID_HERE
```

## 6. Testing:

Add a few test rows to your sheet, then:
1. Run the application
2. Click "Refresh from Google Sheets"
3. Verify all data loads correctly

## 7. Maintenance:

- Keep the sheet updated with current flights
- Remove or archive old flights regularly
- Ensure data quality (no empty rows in between data)
- Use data validation for consistent formats
