# 🚀 Quick Start - Get Running in 15 Minutes!

This guide will get you from zero to sending fuel orders in about 15 minutes.

---

## 📋 What You Need (5 minutes)

Before starting, gather:

1. ✅ **Gmail Account** (for sending emails)
2. ✅ **Google Account** (for Sheets API)
3. ✅ **Python 3.9+** installed ([Download](https://python.org))
4. ✅ **One station email** to test with (can use your own email)

---

## ⚡ Fast Track Setup

### Step 1: Install Dependencies (2 minutes)

```bash
cd "c:\Users\kvven\Downloads\Fuel Ordering Application"
pip install -r requirements.txt
```

Wait for installation to complete...

---

### Step 2: Google Sheets API (5 minutes)

**Quick Path:**

1. Go to: https://console.cloud.google.com/
2. Create new project: `fuel-ordering`
3. Enable **Google Sheets API**
4. Create **Service Account** credentials
5. Download JSON → Save as `credentials.json` in app folder
6. Create new Google Sheet
7. Copy the template from `sample_data.csv`
8. **Share sheet** with service account email (from credentials.json)
9. Copy **Sheet ID** from URL

**Sheet ID is here:**
```
https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit
```

---

### Step 3: Gmail App Password (3 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Generate password for "Mail"
5. **Copy the 16-character code**

---

### Step 4: Configure .env (3 minutes)

```bash
copy .env.example .env
```

Edit `.env` file - **Only fill in these 4 things:**

```env
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
GOOGLE_SHEET_ID=your-sheet-id-from-step-2
STATION_JFK=your-test-email@gmail.com
```

*(Use your own email as STATION_JFK for testing)*

---

### Step 5: Launch! (2 minutes)

**Windows:**
```bash
start.bat
```

**Or manually:**
```bash
python app.py
```

Open browser: **http://localhost:5000**

---

## 🎯 First Test (5 minutes)

### Send Your First Fuel Order:

1. ✅ Click **"Refresh from Google Sheets"**
   - Should see: "Loaded 5 flights from Google Sheets"

2. ✅ Click **"Draft Email"** on first flight
   - Review the email preview
   - Check recipients are correct

3. ✅ Click **"Send Order"**
   - Should see: "Fuel order sent successfully"

4. ✅ **Check your email inbox**
   - You should receive the fuel order!

5. ✅ Go to **"Sent Orders"** tab
   - Verify order appears with "SENT" status

**🎉 Congratulations! You just sent your first automated fuel order!**

---

## ✅ Next Steps

### Now that it works, customize it:

1. **Add Your Real Stations** (10 minutes)
   - Edit `.env` file
   - Add all your station codes and emails
   - See `STATION_CONFIGURATION.md` for templates

2. **Update Google Sheet** (5 minutes)
   - Replace sample data with real flights
   - Keep it updated throughout the day

3. **Test Update Feature** (5 minutes)
   - Go to "Sent Orders"
   - Click "Update Order"
   - Change aircraft registration
   - Verify updated email is sent

4. **Train Your Team** (30 minutes)
   - Show them how to add flights to Google Sheet
   - Demonstrate sending orders
   - Show update process for aircraft swaps

---

## 🆘 Quick Troubleshooting

### "Failed to authenticate with Google Sheets"
→ Check that `credentials.json` is in the app folder
→ Verify Sheet is shared with service account email

### "Failed to send email"
→ Check EMAIL_PASSWORD is correct (16 chars, no spaces)
→ Verify 2-Step Verification is enabled on Gmail

### "No email configured for station"
→ Add station to `.env`: `STATION_XXX=email@example.com`
→ Restart the application

### Flight data not loading
→ Verify GOOGLE_SHEET_ID in `.env` is correct
→ Check column names in sheet match exactly (case-sensitive)

---

## 📚 Full Documentation

For detailed information, see:

- **[README.md](README.md)** - Overview and features
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)** - Sheet configuration
- **[STATION_CONFIGURATION.md](STATION_CONFIGURATION.md)** - Station email setup
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Comprehensive testing
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical details
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common tasks

---

## 💡 Tips for Success

### Daily Workflow:
1. Morning: Update Google Sheet with day's flights
2. Throughout day: Refresh and send orders as needed
3. Use "Sent Orders" to track what's been dispatched
4. Use "Update Order" for aircraft swaps

### Best Practices:
- ✅ Keep Google Sheet current
- ✅ Review draft before sending (first time to each station)
- ✅ Use meaningful dispatcher initials
- ✅ Double-check fuel amounts (Liters vs LBS)
- ✅ Verify scheduled out times are correct
- ✅ Check "Sent Orders" to avoid duplicates

### Efficiency Tips:
- Send orders 2-4 hours before departure
- Batch process multiple flights
- Use "Send Order" directly (skip draft) once you're comfortable
- Keep the app open in a browser tab all day

---

## 🎓 Learn More

### Understanding the System:

**Data Flow:**
```
Google Sheets → Your App → Email → Station Fuel Dept
                    ↓
               Database (tracking)
```

**Order Lifecycle:**
```
New → Draft → Send → Sent → (Optional) Update
```

**What Gets Tracked:**
- Every order sent (with timestamp)
- All recipients
- Complete email content
- Update history
- Original vs updated orders

---

## 🚀 Going to Production

Ready to use for real? Checklist:

- [ ] Tested with 5+ real flights
- [ ] All station emails configured
- [ ] CC recipients confirmed
- [ ] Team trained on usage
- [ ] Backup dispatcher knows how to use it
- [ ] Contact info for support documented
- [ ] Old manual process documented (backup plan)

---

## 🤝 Support

### If You Get Stuck:

1. Check the error message in the browser
2. Check terminal output where `app.py` is running
3. Review relevant documentation file
4. Check the troubleshooting section
5. Verify all configuration in `.env`

### Common First-Time Issues:

| Issue | Quick Fix |
|-------|-----------|
| Can't start app | Install dependencies: `pip install -r requirements.txt` |
| No flights load | Share Google Sheet with service account |
| Can't send email | Check Gmail App Password (not regular password) |
| Wrong station email | Edit `.env` and restart app |
| Database error | Delete `fuel_orders.db` and restart |

---

## 🎉 You're Ready!

You now have a fully functional fuel ordering system that will:

✅ Save time (no more manual email typing)
✅ Reduce errors (standardized format)
✅ Track everything (complete audit trail)
✅ Handle updates (aircraft swaps made easy)
✅ Scale easily (add stations anytime)

**Happy dispatching! ✈️**

---

## 📅 Suggested Timeline

### Today:
- Complete setup (15 minutes)
- Send 3-5 test orders
- Verify receipts

### Tomorrow:
- Add all station configurations
- Train backup dispatcher
- Send real orders (parallel with old method)

### Week 1:
- Use exclusively for fuel orders
- Monitor for issues
- Gather feedback

### Week 2+:
- Optimize workflow
- Document lessons learned
- Consider API integration (future)

---

## 🔮 Future Enhancements

This system is ready for:
- Direct API integration (replace Google Sheets)
- Multi-user authentication
- Mobile app
- Automated scheduling
- Integration with flight planning systems
- Real-time fuel price tracking
- Automated reminders

But start simple! Get comfortable with current features first.

---

**Need help? All documentation is in this folder. Start with README.md for overview.**

**Questions about specific features? Check QUICK_REFERENCE.md**

**Ready to go deeper? Read ARCHITECTURE.md**
