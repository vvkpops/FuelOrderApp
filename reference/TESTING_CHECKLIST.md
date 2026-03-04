# Testing Checklist

Use this checklist to verify your Fuel Ordering Application is working correctly.

## ✅ Pre-Flight Checks (Before Testing)

- [ ] Python 3.9+ installed
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created and configured
- [ ] `credentials.json` downloaded and placed in root directory
- [ ] Google Sheet created with correct columns
- [ ] Google Sheet shared with service account email
- [ ] Gmail App Password generated
- [ ] At least one station email configured in `.env`

---

## ✅ Test 1: Application Startup

**Goal:** Verify the application starts without errors

### Steps:
1. Open terminal in application directory
2. Run: `python app.py`

### Expected Results:
```
* Running on http://0.0.0.0:5000
* Debugger is active!
```

- [ ] Server starts without errors
- [ ] No error messages in terminal
- [ ] Can access http://localhost:5000 in browser

---

## ✅ Test 2: Google Sheets Integration

**Goal:** Verify connection to Google Sheets

### Steps:
1. Add sample data to Google Sheet (use `sample_data.csv`)
2. Open application in browser
3. Click "Refresh from Google Sheets"

### Expected Results:
- [ ] Toast notification: "Loaded X flights from Google Sheets"
- [ ] Flights appear in the "New Orders" tab
- [ ] All flight data displays correctly:
  - [ ] Flight Number
  - [ ] Aircraft Registration
  - [ ] Station
  - [ ] Scheduled Out Time
  - [ ] Fuel (Liters)
  - [ ] Fuel (LBS)
  - [ ] Dispatcher Initials
- [ ] Badge shows correct count: "X flights loaded"

### Troubleshooting:
- **Error: "Failed to authenticate"** → Check `credentials.json`
- **Error: "Failed to read sheet"** → Verify Sheet ID in `.env`
- **No data loaded** → Check sheet is shared with service account

---

## ✅ Test 3: Email Draft Preview

**Goal:** Verify email formatting and preview

### Steps:
1. Ensure at least one flight is loaded
2. Click "Draft Email" on any flight
3. Review the modal preview

### Expected Results:
- [ ] Modal opens with email preview
- [ ] "To:" field shows station email address
- [ ] "CC:" field shows configured CC emails
- [ ] Subject line format: "FUEL ORDER - [Flight] - [Station] - [Aircraft]"
- [ ] Body includes all flight details:
  - [ ] Flight Number
  - [ ] Aircraft Registration
  - [ ] Station
  - [ ] Scheduled Out Time
  - [ ] Fuel Order (formatted)
  - [ ] Dispatcher Initials
- [ ] Professional formatting with separators
- [ ] Timestamp included

### Troubleshooting:
- **Error: "No email configured for station"** → Add station to `.env`
- **Missing data** → Check Google Sheet column names match exactly

---

## ✅ Test 4: Send Test Order

**Goal:** Send actual email and verify delivery

### Steps:
1. Use a test flight (recommend using your own email as station email)
2. Click "Send Order"
3. Confirm in any dialog
4. Check email inbox

### Expected Results:
- [ ] Toast notification: "Fuel order sent successfully"
- [ ] Email received in inbox
- [ ] Email subject matches preview
- [ ] Email body matches preview
- [ ] All recipients received email (To + CC)
- [ ] Order appears in "Sent Orders" tab
- [ ] Order status shows as "SENT"

### Troubleshooting:
- **Error: "Failed to send"** → Check email credentials in `.env`
- **Email not received** → Check spam folder
- **Wrong recipients** → Verify station code matches `.env` entry

---

## ✅ Test 5: Duplicate Prevention

**Goal:** Verify system prevents duplicate orders

### Steps:
1. Send an order for a flight
2. Try to send the same order again
3. Observe system behavior

### Expected Results:
- [ ] Warning dialog appears
- [ ] Message: "Order already sent for this flight"
- [ ] Option to force send is available
- [ ] If cancelled, order is NOT sent again
- [ ] If forced, order IS sent again

---

## ✅ Test 6: Update Order (Aircraft Swap)

**Goal:** Test the update functionality

### Steps:
1. Go to "Sent Orders" tab
2. Find a previously sent order
3. Click "Update Order"
4. Change aircraft registration (e.g., N123AA → N456BB)
5. Add update reason: "Aircraft swap"
6. Click "Update & Send"
7. Check email

### Expected Results:
- [ ] Update modal opens with pre-filled data
- [ ] Can modify aircraft registration
- [ ] Can modify other fields
- [ ] Toast notification: "Updated fuel order sent successfully"
- [ ] New email received
- [ ] Email subject includes "UPDATED FUEL ORDER"
- [ ] Email body includes update warning
- [ ] New order record created in database
- [ ] Original order marked as "UPDATED"
- [ ] Updated order shows link to original order ID

---

## ✅ Test 7: Order History

**Goal:** Verify historical data tracking

### Steps:
1. Click "History" tab
2. Click "Refresh History"
3. Review all orders

### Expected Results:
- [ ] All orders displayed (sent, updated, cancelled)
- [ ] Each order shows:
  - [ ] Complete flight information
  - [ ] Status badge (SENT, UPDATED, CANCELLED)
  - [ ] Sent timestamp
- [ ] Can filter by status
- [ ] Updated orders show original order reference
- [ ] Orders sorted by date (newest first)

---

## ✅ Test 8: View Order Details

**Goal:** Review sent email details

### Steps:
1. In "Sent Orders" or "History" tab
2. Click "View Details" on any order
3. Review the modal

### Expected Results:
- [ ] Modal opens with email details
- [ ] Shows original recipients
- [ ] Shows original subject
- [ ] Shows original email body
- [ ] Timestamp visible
- [ ] Can close modal

---

## ✅ Test 9: Multiple Stations

**Goal:** Test routing to different stations

### Steps:
1. Configure emails for at least 2 different stations in `.env`
2. Create flights for both stations in Google Sheet
3. Send orders for both flights
4. Verify emails route correctly

### Expected Results:
- [ ] JFK flight → JFK station email
- [ ] LAX flight → LAX station email
- [ ] Each goes to correct recipients
- [ ] CC recipients receive all orders

---

## ✅ Test 10: UI/UX Testing

**Goal:** Verify user interface quality

### Steps:
1. Navigate through all tabs
2. Test all buttons
3. Test modal dialogs
4. Trigger various notifications

### Expected Results:
- [ ] All tabs switch correctly
- [ ] Active tab highlighted
- [ ] Buttons respond on click
- [ ] Hover effects work
- [ ] Modals open/close properly
- [ ] Close button (X) works
- [ ] ESC key closes modals
- [ ] Toast notifications appear and auto-dismiss
- [ ] Loading spinner shows during operations
- [ ] Responsive layout (try resizing window)

---

## ✅ Test 11: Error Handling

**Goal:** Verify graceful error handling

### Steps:
Test these scenarios:

1. **Invalid Google Sheet ID**
   - Change Sheet ID in `.env` to invalid value
   - Try to refresh flights
   - [ ] Shows error toast
   - [ ] Application doesn't crash

2. **Missing Station Configuration**
   - Send order for station not in `.env`
   - [ ] Shows error: "No email configured for station"
   - [ ] Application doesn't crash

3. **Network Interruption**
   - Disconnect internet
   - Try to send order
   - [ ] Shows error message
   - [ ] Application doesn't crash

4. **Invalid Email Credentials**
   - Use wrong email password
   - Try to send order
   - [ ] Shows authentication error
   - [ ] Application doesn't crash

---

## ✅ Test 12: Database Persistence

**Goal:** Verify data survives restart

### Steps:
1. Send several orders
2. Stop the application (Ctrl+C)
3. Restart the application
4. Go to "History" tab

### Expected Results:
- [ ] All previous orders still visible
- [ ] Database file `fuel_orders.db` exists
- [ ] Data integrity maintained
- [ ] Can still send new orders

---

## ✅ Test 13: Edge Cases

**Goal:** Test unusual scenarios

### Test Cases:

1. **Empty Fuel Values**
   - Create flight with only Liters (no LBS)
   - [ ] Email shows: "15000 Liters"
   - Create flight with only LBS (no Liters)
   - [ ] Email shows: "33069 LBS"

2. **Long Flight Numbers**
   - [ ] Handles long flight numbers gracefully

3. **Special Characters**
   - Test with aircraft reg like "N-123AB"
   - [ ] Handles special characters correctly

4. **Multiple CC Recipients**
   - Configure multiple CC emails
   - [ ] All receive the email

5. **Rapid Clicking**
   - Click "Send Order" multiple times quickly
   - [ ] Doesn't send duplicates (loading indicator prevents)

---

## ✅ Test 14: Performance

**Goal:** Verify acceptable performance

### Steps:
1. Load 20+ flights from Google Sheets
2. Navigate through tabs
3. Send multiple orders

### Expected Results:
- [ ] Refreshes complete within 3 seconds
- [ ] UI remains responsive
- [ ] No noticeable lag
- [ ] Emails send within 5 seconds

---

## ✅ Test 15: Security

**Goal:** Verify sensitive data protection

### Checks:
- [ ] `.env` file not in git repository
- [ ] `credentials.json` not in git repository
- [ ] `.gitignore` properly configured
- [ ] Email passwords not visible in browser
- [ ] No sensitive data in URLs
- [ ] No sensitive data in browser console logs

---

## 🎯 Production Readiness Checklist

Before going live:

- [ ] All tests passed
- [ ] All station emails configured
- [ ] CC recipients configured
- [ ] Google Sheet populated with real data
- [ ] Tested with at least 5 real flights
- [ ] Email format approved by stakeholders
- [ ] Dispatcher team trained on usage
- [ ] Backup plan for system downtime
- [ ] Contact info for support documented
- [ ] Regular data backup scheduled

---

## 📊 Test Results Log

| Test # | Test Name | Status | Date | Notes |
|--------|-----------|--------|------|-------|
| 1 | Application Startup | ☐ | | |
| 2 | Google Sheets | ☐ | | |
| 3 | Email Draft | ☐ | | |
| 4 | Send Order | ☐ | | |
| 5 | Duplicate Prevention | ☐ | | |
| 6 | Update Order | ☐ | | |
| 7 | Order History | ☐ | | |
| 8 | View Details | ☐ | | |
| 9 | Multiple Stations | ☐ | | |
| 10 | UI/UX | ☐ | | |
| 11 | Error Handling | ☐ | | |
| 12 | Database | ☐ | | |
| 13 | Edge Cases | ☐ | | |
| 14 | Performance | ☐ | | |
| 15 | Security | ☐ | | |

---

## 🐛 Bug Report Template

If you find issues:

**Issue Description:**
[What happened?]

**Expected Behavior:**
[What should have happened?]

**Steps to Reproduce:**
1. 
2. 
3. 

**Environment:**
- Python version:
- Browser:
- Operating System:

**Error Messages:**
```
[Paste any error messages]
```

**Screenshots:**
[If applicable]
