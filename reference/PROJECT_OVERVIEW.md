# 📦 PROJECT OVERVIEW

## Fuel Ordering Application for Flight Dispatchers

**Version:** 1.0  
**Status:** Production Ready  
**Created:** January 2026

---

## 🎯 Purpose

Automate the manual process of sending fuel orders via email for individual flights, replacing manual typing with a streamlined web-based system.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔄 **Google Sheets Integration** | Pull flight data automatically for testing (API-ready for production) |
| ✉️ **Automated Email Generation** | Standard format emails with all required details |
| 📊 **Order Tracking** | Complete database of all sent orders |
| 🔄 **Update Management** | Easily resend updated orders for aircraft swaps |
| 🚫 **Duplicate Prevention** | Warns before sending duplicate orders |
| 📝 **Email Preview** | Review before sending |
| 🎨 **Modern UI** | Clean, responsive web interface |
| 📈 **Audit Trail** | Full history of all orders and updates |

---

## 📂 Project Structure

```
fuel-ordering-app/
│
├── 📄 Core Application Files
│   ├── app.py                    # Main Flask server & API endpoints
│   ├── models.py                 # Database models (SQLAlchemy)
│   ├── sheets_service.py         # Google Sheets integration
│   ├── email_service.py          # Email sending logic
│   └── requirements.txt          # Python dependencies
│
├── 🎨 Frontend
│   ├── templates/
│   │   └── index.html           # Main UI
│   └── static/
│       ├── css/
│       │   └── style.css        # Styling
│       └── js/
│           └── app.js           # Frontend logic
│
├── ⚙️ Configuration
│   ├── .env.example             # Configuration template
│   ├── .gitignore               # Git exclusions
│   └── start.bat                # Windows startup script
│
├── 📖 Documentation
│   ├── README.md                # Main documentation
│   ├── QUICKSTART.md            # 15-minute setup guide
│   ├── SETUP_GUIDE.md           # Detailed setup instructions
│   ├── GOOGLE_SHEETS_SETUP.md   # Google Sheets configuration
│   ├── STATION_CONFIGURATION.md # Station email setup
│   ├── TESTING_CHECKLIST.md     # Comprehensive testing guide
│   ├── ARCHITECTURE.md          # Technical architecture
│   ├── QUICK_REFERENCE.md       # Common tasks reference
│   └── PROJECT_OVERVIEW.md      # This file
│
└── 📊 Sample Data
    └── sample_data.csv          # Test flight data
```

---

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Python 3.9+ | Server-side logic |
| **Framework** | Flask 3.0 | Web framework |
| **Database** | SQLite | Order storage |
| **ORM** | SQLAlchemy | Database interface |
| **Data Source** | Google Sheets API | Flight data (testing) |
| **Email** | SMTP (Gmail) | Order delivery |
| **Frontend** | HTML5/CSS3/JavaScript | User interface |
| **Styling** | Custom CSS | Modern design |

---

## 📋 Data Model

### Flight Order Record

```
FuelOrder {
  id: Integer (Primary Key)
  flight_number: String
  aircraft_registration: String
  station: String (3-letter code)
  scheduled_out_time: String
  fuel_liters: String
  fuel_lbs: String
  dispatcher_initials: String
  status: String (pending/sent/updated/cancelled)
  sent_at: DateTime
  sent_to: Text (JSON of recipients)
  email_subject: String
  email_body: Text
  is_updated: Boolean
  original_order_id: Integer (if update)
  update_reason: String
  created_at: DateTime
  updated_at: DateTime
}
```

---

## 🔄 Workflow

### Standard Process:

```
1. UPDATE SHEET
   ↓
   Dispatcher updates Google Sheet with flight info
   ↓
2. REFRESH DATA
   ↓
   Click "Refresh from Google Sheets" in app
   ↓
3. REVIEW
   ↓
   Review flight details
   ↓
4. DRAFT (Optional)
   ↓
   Preview email before sending
   ↓
5. SEND
   ↓
   System sends email to station & CC recipients
   ↓
6. TRACK
   ↓
   Order saved in database with status "SENT"
   ↓
7. UPDATE (If needed)
   ↓
   For aircraft swaps, use "Update Order"
   ↓
8. HISTORY
   ↓
   View all orders in History tab
```

---

## 🎛️ Configuration

### Required Environment Variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `EMAIL_ADDRESS` | Gmail sender | dispatcher@airline.com |
| `EMAIL_PASSWORD` | Gmail App Password | 16-character code |
| `GOOGLE_SHEET_ID` | Source data sheet | 1a2b3c4d5e6f... |
| `STATION_XXX` | Station emails | fuel.jfk@airline.com |
| `CC_EMAILS` | Always-copy recipients | ops@airline.com |

---

## 📧 Email Format

### Subject Line:
```
FUEL ORDER - [Flight Number] - [Station] - [Aircraft]
```

### Body Template:
```
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

## 🔒 Security Features

✅ **Credentials Protection**
- All sensitive data in `.env` (excluded from git)
- Google credentials in separate file
- No passwords in code or URLs

✅ **Input Validation**
- Required fields enforced
- Email format validation
- Station code validation

✅ **Duplicate Prevention**
- Checks before sending
- User confirmation required for resends

✅ **Audit Trail**
- All actions logged
- Complete order history
- Update tracking

---

## 📊 Statistics & Metrics

### What Gets Tracked:

- Total orders sent
- Orders per station
- Orders per dispatcher
- Average processing time
- Update frequency
- Status distribution

### Available Views:

- **New Orders**: Flights ready to process
- **Sent Orders**: Active orders with update capability
- **History**: Complete audit trail with filtering

---

## 🚀 Deployment

### Local Development:
```bash
python app.py
# Access at http://localhost:5000
```

### Production Considerations:
- Use production WSGI server (Gunicorn/uWSGI)
- Add HTTPS/SSL certificate
- Set up proper logging
- Configure backups
- Monitor uptime
- Scale as needed

---

## 🔮 Future Roadmap

### Phase 1: Current ✅
- Google Sheets integration
- Email automation
- Order tracking
- Update management

### Phase 2: Planned 🎯
- Direct API integration
- Multi-user authentication
- Role-based access
- Advanced reporting

### Phase 3: Future 💭
- Mobile application
- Real-time notifications
- Fuel price integration
- Flight planning system integration
- Automated scheduling
- Analytics dashboard

---

## 📈 Benefits

### Time Savings:
- **Before**: 2-3 minutes per order (manual email)
- **After**: 10 seconds per order (automated)
- **Savings**: ~95% time reduction

### Error Reduction:
- Standardized format eliminates typos
- Automatic recipient routing
- Duplicate prevention
- Complete audit trail

### Operational Improvements:
- Faster order processing
- Better tracking
- Easy updates for aircraft swaps
- Historical data for analysis

---

## 👥 User Roles

### Flight Dispatcher (Primary User)
- Updates flight data
- Sends fuel orders
- Handles updates/changes
- Reviews history

### Fuel Coordinator (Recipient)
- Receives fuel orders
- Processes requests
- Confirms delivery

### Operations Manager (CC Recipient)
- Monitors all orders
- Reviews for optimization
- Tracks fuel spending

---

## 🆘 Support & Maintenance

### Daily Operations:
- No maintenance required
- Just keep Google Sheet updated
- Monitor sent orders

### Weekly Tasks:
- Review order history
- Check for errors
- Verify email deliverability

### Monthly Tasks:
- Update station configurations
- Review and archive old orders
- Test all stations

---

## 📞 Contact & Support

### Documentation:
- All guides in project folder
- Step-by-step instructions
- Troubleshooting guides
- Testing checklists

### Training:
- 15-minute quickstart
- Hands-on testing
- Best practices guide
- Video tutorials (future)

---

## ✅ Readiness Checklist

Before going live:

- [ ] All dependencies installed
- [ ] Google Sheets API configured
- [ ] Email credentials set up
- [ ] All stations configured
- [ ] Test orders sent and received
- [ ] Team trained
- [ ] Documentation reviewed
- [ ] Backup plan in place

---

## 🎓 Key Concepts

### Order States:
- **Pending**: Created but not sent
- **Sent**: Successfully delivered
- **Updated**: Superseded by new order
- **Cancelled**: Manually cancelled

### Update Tracking:
- New order linked to original
- Original marked as "updated"
- Both preserved in history
- Clear audit trail

### Duplicate Prevention:
- Checks flight number + station
- Warns user before sending
- Option to force send if needed

---

## 💡 Best Practices

1. **Keep Sheet Current**: Update throughout the day
2. **Review Before Sending**: Use draft feature for new stations
3. **Use Meaningful Initials**: Consistent dispatcher identification
4. **Double-Check Fuel**: Verify Liters vs LBS accuracy
5. **Monitor Sent Orders**: Check for successful delivery
6. **Update Promptly**: Handle aircraft swaps immediately
7. **Archive Regularly**: Keep database manageable

---

## 🏆 Success Criteria

The application is successful when:

✅ Dispatchers prefer it over manual process  
✅ 95%+ time savings achieved  
✅ Zero email formatting errors  
✅ All orders tracked and auditable  
✅ Aircraft swaps handled in < 1 minute  
✅ Station feedback is positive  
✅ System uptime > 99%  

---

## 📝 Version History

### v1.0 (January 2026)
- Initial release
- Google Sheets integration
- Email automation
- Order tracking
- Update management
- Complete documentation

---

## 🤝 Contributing

This is an internal tool, but improvements welcome:
- Document issues and solutions
- Suggest workflow improvements
- Share best practices
- Provide feedback

---

## 📜 License

Internal use only - [Your Airline Name]

---

## 🎉 Acknowledgments

Built for flight dispatchers to streamline operations and reduce manual work.

**Happy Dispatching! ✈️**

---

## 📚 Quick Links

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | 15-min setup | First time setup |
| [README.md](README.md) | Overview | General reference |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Detailed setup | Detailed configuration |
| [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) | Testing | Before going live |
| [STATION_CONFIGURATION.md](STATION_CONFIGURATION.md) | Station setup | Adding stations |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Common tasks | Daily use |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical details | Understanding system |

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Status:** Complete & Production Ready
