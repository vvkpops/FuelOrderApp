# Fuel Ordering Application - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FUEL ORDERING SYSTEM                          │
│                   Flight Dispatcher Tool                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Google Sheets   │   (Future)   │   External API   │        │
│  │   (Testing)      │─────────────▶│   (Production)   │        │
│  └────────┬─────────┘              └──────────────────┘        │
│           │                                                      │
│           │ Flight Data                                         │
│           │ - Flight Number                                     │
│           │ - Aircraft Reg                                      │
│           │ - Station                                           │
│           │ - Departure Time                                    │
│           │ - Fuel Amount                                       │
│           │ - Dispatcher                                        │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Flask)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │  sheets_service  │      │  email_service   │               │
│  │  .py             │      │  .py             │               │
│  │                  │      │                  │               │
│  │ • authenticate() │      │ • draft_email()  │               │
│  │ • get_flights()  │      │ • send_order()   │               │
│  │ • update_status()│      │ • format_email() │               │
│  └──────────────────┘      └──────────────────┘               │
│           │                          │                          │
│           └──────────┬───────────────┘                         │
│                      ▼                                          │
│              ┌──────────────────┐                              │
│              │     app.py       │                              │
│              │  (Main Server)   │                              │
│              │                  │                              │
│              │  REST API        │                              │
│              │  • /api/flights  │                              │
│              │  • /api/orders   │                              │
│              │  • /api/send     │                              │
│              │  • /api/update   │                              │
│              └────────┬─────────┘                              │
│                       │                                         │
│                       ▼                                         │
│              ┌──────────────────┐                              │
│              │    models.py     │                              │
│              │   (Database)     │                              │
│              │                  │                              │
│              │  FuelOrder       │                              │
│              │  • flight_num    │                              │
│              │  • aircraft      │                              │
│              │  • station       │                              │
│              │  • fuel_amount   │                              │
│              │  • status        │                              │
│              │  • sent_at       │                              │
│              └────────┬─────────┘                              │
│                       │                                         │
│                       ▼                                         │
│              ┌──────────────────┐                              │
│              │ fuel_orders.db   │                              │
│              │   (SQLite)       │                              │
│              └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    index.html                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │   │
│  │  │   New    │  │   Sent   │  │   History    │         │   │
│  │  │  Orders  │  │  Orders  │  │              │         │   │
│  │  └──────────┘  └──────────┘  └──────────────┘         │   │
│  │                                                         │   │
│  │  • View flights from Google Sheets                     │   │
│  │  • Draft email preview                                 │   │
│  │  • Send fuel orders                                    │   │
│  │  • Update existing orders                              │   │
│  │  • View order history                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐  │
│  │                     app.js                               │  │
│  │  • AJAX API calls                                        │  │
│  │  • Dynamic UI updates                                    │  │
│  │  • Modal dialogs                                         │  │
│  │  • Toast notifications                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     style.css                             │  │
│  │  • Responsive design                                      │  │
│  │  • Professional styling                                   │  │
│  │  • Animations                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EMAIL DELIVERY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  SMTP Server     │              │  Station Fuel    │        │
│  │  (Gmail)         │─────────────▶│  Departments     │        │
│  │                  │              │  • JFK           │        │
│  │  smtp.gmail.com  │              │  • LAX           │        │
│  │  Port: 587       │              │  • ORD           │        │
│  └──────────────────┘              │  • etc...        │        │
│                                     └──────────────────┘        │
│                                             │                    │
│                                             ▼                    │
│                                     ┌──────────────────┐        │
│                                     │  CC Recipients   │        │
│                                     │  • Operations    │        │
│                                     │  • Dispatch      │        │
│                                     └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. New Order Flow

```
User → Refresh Button → Backend → Google Sheets API → Fetch Flights
                                          │
                                          ▼
                                   Display in UI
                                          │
User → Send Order → Backend → Email Service → SMTP → Station Email
                       │
                       ▼
                   Database → Save Order Record
```

### 2. Update Order Flow

```
User → Sent Orders Tab → Select Order → Update Modal
                                            │
                                            ▼
                                      Modify Details
                                            │
                                            ▼
Backend → Email Service → SMTP → Station Email (UPDATED)
   │
   ▼
Database → Create New Record (linked to original)
        → Mark Original as "updated"
```

### 3. Order Status Lifecycle

```
┌──────────┐    Send Order    ┌──────────┐    Update    ┌──────────┐
│ PENDING  │─────────────────▶│   SENT   │─────────────▶│ UPDATED  │
└──────────┘                   └──────────┘              └──────────┘
                                    │
                                    │ Cancel
                                    ▼
                               ┌──────────┐
                               │CANCELLED │
                               └──────────┘
```

## Security & Configuration

```
┌─────────────────────────────────────────┐
│          Configuration Files             │
├─────────────────────────────────────────┤
│                                          │
│  .env (Environment Variables)           │
│  ├─ Email Credentials                   │
│  ├─ Google Sheet ID                     │
│  ├─ Station Email Mappings              │
│  └─ CC Recipients                       │
│                                          │
│  credentials.json                       │
│  └─ Google Service Account               │
│                                          │
│  .gitignore                             │
│  └─ Protects sensitive files            │
└─────────────────────────────────────────┘
```

## Technology Stack

- **Backend:** Python 3.9+, Flask 3.0
- **Database:** SQLite (via SQLAlchemy)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **APIs:** Google Sheets API, SMTP
- **Authentication:** OAuth2 (Google), App Passwords (Gmail)

## Key Features

✅ **Automated Email Generation** - Standard format, no manual typing
✅ **Duplicate Prevention** - Warns if order already sent
✅ **Update Tracking** - Links updates to original orders
✅ **Audit Trail** - Complete history in database
✅ **Preview Before Send** - Review emails before dispatch
✅ **Multi-Station Support** - Configurable email routing
✅ **Responsive Design** - Works on desktop and tablets
✅ **Real-time Updates** - Instant UI feedback
