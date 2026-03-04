# Station Configuration Template

## Common US Airport Codes (IATA)

Use these when configuring your `.env` file and Google Sheets.

### Major Hubs

| Code | Airport | City |
|------|---------|------|
| ATL | Hartsfield-Jackson Atlanta International | Atlanta, GA |
| DFW | Dallas/Fort Worth International | Dallas, TX |
| DEN | Denver International | Denver, CO |
| ORD | O'Hare International | Chicago, IL |
| LAX | Los Angeles International | Los Angeles, CA |
| CLT | Charlotte Douglas International | Charlotte, NC |
| MCO | Orlando International | Orlando, FL |
| LAS | Harry Reid International | Las Vegas, NV |
| PHX | Phoenix Sky Harbor International | Phoenix, AZ |
| MIA | Miami International | Miami, FL |

### East Coast

| Code | Airport | City |
|------|---------|------|
| JFK | John F. Kennedy International | New York, NY |
| EWR | Newark Liberty International | Newark, NJ |
| LGA | LaGuardia | New York, NY |
| BOS | Boston Logan International | Boston, MA |
| PHL | Philadelphia International | Philadelphia, PA |
| BWI | Baltimore/Washington International | Baltimore, MD |
| IAD | Washington Dulles International | Washington, DC |
| DCA | Ronald Reagan Washington National | Washington, DC |
| RDU | Raleigh-Durham International | Raleigh, NC |
| FLL | Fort Lauderdale-Hollywood International | Fort Lauderdale, FL |

### West Coast

| Code | Airport | City |
|------|---------|------|
| SFO | San Francisco International | San Francisco, CA |
| LAX | Los Angeles International | Los Angeles, CA |
| SAN | San Diego International | San Diego, CA |
| SEA | Seattle-Tacoma International | Seattle, WA |
| PDX | Portland International | Portland, OR |
| SJC | San Jose International | San Jose, CA |
| OAK | Oakland International | Oakland, CA |
| SMF | Sacramento International | Sacramento, CA |

### Central US

| Code | Airport | City |
|------|---------|------|
| ORD | O'Hare International | Chicago, IL |
| DFW | Dallas/Fort Worth International | Dallas, TX |
| DEN | Denver International | Denver, CO |
| IAH | George Bush Intercontinental | Houston, TX |
| MSP | Minneapolis-St. Paul International | Minneapolis, MN |
| DTW | Detroit Metropolitan Wayne County | Detroit, MI |
| STL | St. Louis Lambert International | St. Louis, MO |
| MSY | Louis Armstrong New Orleans International | New Orleans, LA |
| MCI | Kansas City International | Kansas City, MO |
| SAT | San Antonio International | San Antonio, TX |

---

## .env Configuration Examples

### Example 1: Single Email Per Station

```env
# Major Hubs
STATION_ATL=fuel.atlanta@yourairline.com
STATION_DFW=fuel.dallas@yourairline.com
STATION_ORD=fuel.chicago@yourairline.com
STATION_LAX=fuel.losangeles@yourairline.com

# East Coast
STATION_JFK=fuel.jfk@yourairline.com
STATION_BOS=fuel.boston@yourairline.com
STATION_MIA=fuel.miami@yourairline.com

# West Coast
STATION_SFO=fuel.sanfrancisco@yourairline.com
STATION_SEA=fuel.seattle@yourairline.com
STATION_PDX=fuel.portland@yourairline.com
```

### Example 2: Multiple Emails Per Station (Primary + Backup)

```env
# Format: STATION_CODE=primary@example.com,backup@example.com

STATION_JFK=fuel.jfk@yourairline.com,fuel.backup.jfk@yourairline.com
STATION_LAX=fuel.lax@yourairline.com,fuel.backup.lax@yourairline.com,operations.lax@yourairline.com
STATION_ORD=fuel.ord@yourairline.com,fuel.backup.ord@yourairline.com
```

### Example 3: Third-Party Fuel Vendors

```env
# If you use external fuel vendors

STATION_JFK=fuel.jfk@fuelvendor.com
STATION_LAX=westcoast.fuel@fuelvendor.com
STATION_ORD=midwest.fuel@fuelvendor.com
STATION_MIA=southeast.fuel@fuelvendor.com
```

### Example 4: Regional Organization

```env
# Group by regions with regional coordinators

# Northeast Region
STATION_JFK=fuel.northeast@yourairline.com
STATION_BOS=fuel.northeast@yourairline.com
STATION_EWR=fuel.northeast@yourairline.com

# Southeast Region
STATION_MIA=fuel.southeast@yourairline.com
STATION_ATL=fuel.southeast@yourairline.com
STATION_MCO=fuel.southeast@yourairline.com

# West Region
STATION_LAX=fuel.west@yourairline.com
STATION_SFO=fuel.west@yourairline.com
STATION_SEA=fuel.west@yourairline.com
```

---

## CC Recipients Configuration

### Example Configurations:

```env
# Operations team only
CC_EMAILS=operations@yourairline.com

# Multiple departments
CC_EMAILS=operations@yourairline.com,dispatch@yourairline.com,fuel.coordinator@yourairline.com

# Include management
CC_EMAILS=dispatch@yourairline.com,ops.manager@yourairline.com,chief.dispatcher@yourairline.com

# Regional + Central
CC_EMAILS=dispatch.central@yourairline.com,fuel.accounting@yourairline.com

# Leave empty if no CC needed
CC_EMAILS=
```

---

## Quick Setup Wizard

### Step 1: List Your Operating Stations

Write down all stations you serve:

1. _______________
2. _______________
3. _______________
4. _______________
5. _______________
6. _______________

### Step 2: Get Email Addresses

For each station, find the fuel department email:

| Station Code | Email Address | Contact Name | Phone |
|--------------|---------------|--------------|-------|
| | | | |
| | | | |
| | | | |
| | | | |

### Step 3: Identify CC Recipients

Who needs to be copied on ALL fuel orders?

| Department | Email | Reason |
|------------|-------|--------|
| Operations | | Coordination |
| Dispatch | | Record keeping |
| Fuel Coordinator | | Oversight |
| Accounting | | Billing |

### Step 4: Generate .env Configuration

Use this template and fill in your values:

```env
# ===================================
# EMAIL CONFIGURATION
# ===================================
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# ===================================
# GOOGLE SHEETS CONFIGURATION
# ===================================
GOOGLE_SHEET_ID=your-sheet-id-here
GOOGLE_CREDENTIALS_FILE=credentials.json

# ===================================
# STATION EMAIL ADDRESSES
# ===================================
# Format: STATION_CODE=email1,email2,email3
# Multiple emails separated by comma (no spaces)

[Paste your station configurations here]

# ===================================
# CC RECIPIENTS
# ===================================
# Comma-separated list (no spaces)
CC_EMAILS=[Paste your CC recipients here]
```

---

## Validation Checklist

Before using in production, verify:

- [ ] All station codes are 3 letters, uppercase
- [ ] All email addresses are valid
- [ ] Tested at least one email to each station
- [ ] CC recipients confirmed they want all orders
- [ ] Backup contacts identified for key stations
- [ ] Contact info documented for all stations
- [ ] Fuel vendor contacts confirmed (if using vendors)
- [ ] Emergency contacts identified
- [ ] After-hours procedures documented

---

## Special Considerations

### International Stations

If you operate internationally, use IATA codes:

```env
# Canadian Stations
STATION_YYZ=fuel.toronto@yourairline.com
STATION_YVR=fuel.vancouver@yourairline.com

# Mexican Stations
STATION_MEX=fuel.mexicocity@yourairline.com
STATION_CUN=fuel.cancun@yourairline.com

# Caribbean
STATION_NAS=fuel.nassau@yourairline.com
STATION_SJU=fuel.sanjuan@yourairline.com
```

### Seasonal/Charter Stations

For stations you don't serve regularly:

```env
# Seasonal Summer Stations
STATION_ANC=fuel.anchorage@vendor.com
STATION_HNL=fuel.honolulu@vendor.com

# Charter/Special Operations
STATION_TEB=fuel.teterboro@fbo.com
```

### Cargo vs Passenger Operations

If you operate both:

```env
# Passenger Operations
STATION_JFK=fuel.passenger.jfk@yourairline.com

# Cargo Operations
STATION_JFK=fuel.cargo.jfk@yourairline.com

# Or use same for both
STATION_JFK=fuel.jfk@yourairline.com
```

---

## Testing Your Configuration

### Test Email Template

Send this test email to verify your setup:

```
To: [Station Email]
Cc: [Your CC Recipients]
Subject: TEST - Fuel Ordering System Setup

This is a test email from the new Fuel Ordering System.

Please reply to confirm you received this and that fuel orders
should be sent to this email address going forward.

Station: [CODE]
Your Email: [address]

Thank you!
[Your Name]
Flight Dispatch
```

### Confirmation Tracking

| Station | Test Sent | Response Received | Confirmed | Notes |
|---------|-----------|-------------------|-----------|-------|
| | | | | |
| | | | | |
| | | | | |

---

## Maintenance

### Monthly Review

- [ ] Verify all station emails still valid
- [ ] Check for new stations to add
- [ ] Remove retired stations
- [ ] Update contact information
- [ ] Test random sampling of stations
- [ ] Review CC recipient list

### When Changes Occur

**Adding a New Station:**
1. Get fuel contact info
2. Add to `.env` file: `STATION_XXX=email@example.com`
3. Restart application
4. Send test order
5. Confirm receipt
6. Document in station directory

**Removing a Station:**
1. Comment out or remove from `.env`
2. Restart application
3. Update documentation
4. Notify dispatch team

**Changing Station Email:**
1. Update `.env` file
2. Restart application
3. Send test order to new email
4. Confirm receipt
5. Update contact directory
