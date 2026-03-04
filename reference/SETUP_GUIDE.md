# Step-by-Step Setup Guide

Follow these steps to get your Fuel Ordering Application running:

## ✅ Step 1: Install Python Dependencies

```bash
cd "c:\Users\kvven\Downloads\Fuel Ordering Application"
pip install -r requirements.txt
```

**Verify Installation:**
```bash
python -c "import flask; print('Flask installed successfully')"
```

---

## ✅ Step 2: Set Up Google Sheets API

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it: `fuel-ordering-app`
4. Click "Create"

### 2.2 Enable Google Sheets API

1. In the left menu, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### 2.3 Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name: `fuel-ordering-service`
4. Click "Create and Continue"
5. Skip optional steps → Click "Done"

### 2.4 Download Credentials

1. Click on the newly created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Download the file
6. **Rename it to `credentials.json`**
7. **Move it to:** `c:\Users\kvven\Downloads\Fuel Ordering Application\`

### 2.5 Create Google Sheet

1. Create a new Google Sheet
2. Follow the structure in `GOOGLE_SHEETS_SETUP.md`
3. **Share the sheet with your service account email** (found in `credentials.json`)
4. Copy the Sheet ID from the URL

---

## ✅ Step 3: Configure Email (Gmail)

### 3.1 Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

### 3.2 Create App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and your device
3. Click "Generate"
4. **Copy the 16-character password**

---

## ✅ Step 4: Configure Application

### 4.1 Create `.env` File

```bash
# Copy the example file
copy .env.example .env
```

### 4.2 Edit `.env` File

Open `.env` in a text editor and fill in:

```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Google Sheets Configuration
GOOGLE_SHEET_ID=your-actual-sheet-id-from-url
GOOGLE_CREDENTIALS_FILE=credentials.json

# Station Email Configuration (customize for your stations)
STATION_JFK=fuel.jfk@yourairline.com
STATION_LAX=fuel.lax@yourairline.com
STATION_ORD=fuel.ord@yourairline.com
STATION_DFW=fuel.dfw@yourairline.com
STATION_ATL=fuel.atl@yourairline.com

# Additional Recipients (comma-separated)
CC_EMAILS=dispatch@yourairline.com,operations@yourairline.com
```

**Important:** Replace all `your-actual-*` values with real values!

---

## ✅ Step 5: Run the Application

### 5.1 Start the Server

```bash
python app.py
```

You should see:
```
* Running on http://0.0.0.0:5000
* Restarting with stat
* Debugger is active!
```

### 5.2 Open in Browser

Open your web browser and go to:
```
http://localhost:5000
```

---

## ✅ Step 6: Test the System

### 6.1 Add Test Data

Add a test flight to your Google Sheet:

| Flight Number | Aircraft Registration | Station | Scheduled Out Time | Fuel Order (Liters) | Fuel Order (LBS) | Dispatcher Initials |
|--------------|----------------------|---------|-------------------|---------------------|-----------------|-------------------|
| TEST001 | N999ZZ | JFK | 2026-01-24 20:00 UTC | 10000 | 22046 | TEST |

### 6.2 Load Data

1. Click "Refresh from Google Sheets"
2. Verify the test flight appears

### 6.3 Draft Email

1. Click "Draft Email" on the test flight
2. Review the email preview
3. Check that recipients are correct

### 6.4 Send Test Order

1. Click "Send Order"
2. Check your email inbox
3. Verify the fuel order was received

### 6.5 Test Update Feature

1. Go to "Sent Orders" tab
2. Click "Update Order" on the test flight
3. Change aircraft registration to `N888YY`
4. Click "Update & Send"
5. Verify updated email was sent

---

## ✅ Step 7: Configure Your Stations

Edit the `.env` file to add your actual station email addresses:

```env
# Add all your stations
STATION_ABC=fuel.abc@yourairline.com,backup.abc@yourairline.com
STATION_XYZ=fuel.xyz@yourairline.com
# ... add more as needed
```

**Format:** 
- Use the 3-letter station code
- Multiple emails per station: separate with commas
- No spaces around commas

---

## 🎉 You're All Set!

Your Fuel Ordering Application is now ready for production use.

## 📋 Daily Usage:

1. Update Google Sheet with flight information
2. Click "Refresh from Google Sheets" in the app
3. Review flights and send orders
4. Use "Sent Orders" tab to track what's been sent
5. Use "Update Order" if aircraft swaps occur

## 🔧 Troubleshooting:

### Can't connect to Google Sheets?
- Verify `credentials.json` is in the correct location
- Check that the sheet is shared with the service account
- Verify the Sheet ID in `.env` is correct

### Emails not sending?
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check that 2-Step Verification is enabled
- Test with a simple recipient first

### Station emails not working?
- Check `.env` file for correct station codes
- Verify email addresses don't have typos
- Ensure station code in sheet matches `.env` (case-sensitive)

### Database issues?
- Delete `fuel_orders.db` and restart the app
- It will create a fresh database automatically

## 📞 Need Help?

Check the main `README.md` for more information about:
- Project structure
- API endpoints
- Future enhancements
