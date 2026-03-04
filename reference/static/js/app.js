// State management
let currentFlights = [];
let currentDraft = null;
let currentOrderToUpdate = null;
let fuelUnits = {}; // Track fuel unit per flight (default: 'lbs')

// API Base URL
const API_BASE = '';

// Tab Management
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabId = tabName === 'flights' ? 'flights-tab' : 'sent-tab';
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    // Load data for the tab
    if (tabName === 'sent') {
        loadSentOrders();
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading Indicator
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Refresh Flights from CSV
async function refreshFlights() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/flights/refresh`);
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        currentFlights = data.data || [];
        displayFlights(currentFlights);
        
        document.getElementById('flight-count').textContent = 
            `${currentFlights.length} flight${currentFlights.length !== 1 ? 's' : ''} loaded`;
        
        showToast(`Loaded ${currentFlights.length} flights from CSV file`, 'success');
        
    } catch (error) {
        showToast('Failed to refresh flights: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Display Flights
function displayFlights(flights) {
    const container = document.getElementById('flights-list');
    
    if (flights.length === 0) {
        container.innerHTML = '<p class="placeholder">No flights found in CSV</p>';
        return;
    }
    
    container.innerHTML = flights.map((flight, index) => `
        <div class="flight-card" id="flight-card-${index}">
            <div class="flight-header">
                <div class="flight-number">${flight.flight_number}</div>
                <button class="btn btn-small btn-secondary" onclick="toggleEdit(${index})" id="edit-btn-${index}">
                    ✏️ Edit
                </button>
            </div>
            
            <!-- Fuel Unit Selector -->
            <div class="fuel-unit-selector">
                <label>
                    <input type="radio" name="unit-${index}" value="lbs" ${!fuelUnits[index] || fuelUnits[index] === 'lbs' ? 'checked' : ''} onchange="changeFuelUnit(${index}, 'lbs')">
                    LBS
                </label>
                <label>
                    <input type="radio" name="unit-${index}" value="liters" ${fuelUnits[index] === 'liters' ? 'checked' : ''} onchange="changeFuelUnit(${index}, 'liters')">
                    Liters
                </label>
            </div>
            
            <!-- Display Mode -->
            <div id="display-${index}" class="flight-details">
                <div class="detail-item">
                    <span class="detail-label">Aircraft</span>
                    <span class="detail-value">${flight.aircraft_registration}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Station</span>
                    <span class="detail-value">${flight.station}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Scheduled Out</span>
                    <span class="detail-value">${flight.scheduled_out_time}</span>
                </div>
                <div class="detail-item" id="fuel-display-${index}">
                    <span class="detail-label">Fuel Order ${(!fuelUnits[index] || fuelUnits[index] === 'lbs') ? '(LBS)' : '(Liters)'}</span>
                    <span class="detail-value">${(!fuelUnits[index] || fuelUnits[index] === 'lbs') ? (flight.fuel_lbs || 'N/A') : (flight.fuel_liters || 'N/A')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Dispatcher</span>
                    <span class="detail-value">${flight.dispatcher_initials}</span>
                </div>
            </div>
            
            <!-- Edit Mode -->
            <div id="edit-${index}" class="flight-details-edit" style="display: none;">
                <div class="form-group">
                    <label>Aircraft Registration</label>
                    <input type="text" id="aircraft-${index}" value="${flight.aircraft_registration}">
                </div>
                <div class="form-group">
                    <label>Station</label>
                    <input type="text" 
                           id="station-${index}" 
                           value="${flight.station}"
                           list="station-list-${index}"
                           autocomplete="off"
                           oninput="showStationSuggestions(${index}, this.value)"
                           style="text-transform: uppercase;">
                    <datalist id="station-list-${index}">
                        ${commonStations.map(code => `<option value="${code}">`).join('')}
                    </datalist>
                    <div id="station-suggestions-${index}" class="station-dropdown"></div>
                </div>
                <div class="form-group">
                    <label>Scheduled Out Time</label>
                    <input type="text" id="time-${index}" value="${flight.scheduled_out_time}">
                </div>
                <div class="form-group" id="fuel-edit-${index}">
                    <label>Fuel Order ${(!fuelUnits[index] || fuelUnits[index] === 'lbs') ? '(LBS)' : '(Liters)'}</label>
                    <input type="text" id="fuel-${index}" value="${(!fuelUnits[index] || fuelUnits[index] === 'lbs') ? (flight.fuel_lbs || '') : (flight.fuel_liters || '')}">
                </div>
                <div class="form-group">
                    <label>Dispatcher Initials</label>
                    <input type="text" id="dispatcher-${index}" value="${flight.dispatcher_initials}">
                </div>
            </div>
            
            <div class="flight-actions">
                <button class="btn btn-primary btn-small" onclick="draftEmail(${index})">
                    📝 Draft Email
                </button>
                <button class="btn btn-success btn-small" onclick="sendOrderDirect(${index})">
                    ✉️ Send Order
                </button>
            </div>
        </div>
    `).join('');
}

// Change Fuel Unit
function changeFuelUnit(index, unit) {
    fuelUnits[index] = unit;
    displayFlights(currentFlights);
}

// Show station suggestions while editing flight
function showStationSuggestions(index, value) {
    const input = value.toUpperCase().trim();
    const dropdown = document.getElementById(`station-suggestions-${index}`);
    
    if (!input || input.length < 1) {
        dropdown.style.display = 'none';
        return;
    }
    
    // Filter matching stations
    const matches = commonStations.filter(code => 
        code.startsWith(input) || code.includes(input)
    ).slice(0, 8);
    
    if (matches.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = matches.map(code => `
        <div class="dropdown-item" onclick="selectStationForFlight(${index}, '${code}')">
            ${code}
        </div>
    `).join('');
    dropdown.style.display = 'block';
}

// Select station from dropdown
function selectStationForFlight(index, code) {
    document.getElementById(`station-${index}`).value = code;
    document.getElementById(`station-suggestions-${index}`).style.display = 'none';
}

// Toggle Edit Mode
function toggleEdit(index) {
    const displayDiv = document.getElementById(`display-${index}`);
    const editDiv = document.getElementById(`edit-${index}`);
    const editBtn = document.getElementById(`edit-btn-${index}`);
    
    if (editDiv.style.display === 'none') {
        // Switch to edit mode
        displayDiv.style.display = 'none';
        editDiv.style.display = 'grid';
        editBtn.textContent = '💾 Save';
    } else {
        // Save changes and switch back to display mode
        const flight = currentFlights[index];
        const unit = fuelUnits[index] || 'lbs';
        
        flight.aircraft_registration = document.getElementById(`aircraft-${index}`).value;
        flight.station = document.getElementById(`station-${index}`).value;
        flight.scheduled_out_time = document.getElementById(`time-${index}`).value;
        
        // Save fuel in the selected unit
        const fuelValue = document.getElementById(`fuel-${index}`).value;
        if (unit === 'lbs') {
            flight.fuel_lbs = fuelValue;
            flight.fuel_liters = ''; // Clear the other unit
        } else {
            flight.fuel_liters = fuelValue;
            flight.fuel_lbs = ''; // Clear the other unit
        }
        
        flight.dispatcher_initials = document.getElementById(`dispatcher-${index}`).value;
        
        // Update display
        displayFlights(currentFlights);
        showToast('Changes saved', 'success');
    }
}

// Get current flight data (with any edits)
function getCurrentFlightData(index) {
    const editDiv = document.getElementById(`edit-${index}`);
    const unit = fuelUnits[index] || 'lbs';
    
    // If in edit mode, get values from inputs
    if (editDiv && editDiv.style.display !== 'none') {
        const fuelValue = document.getElementById(`fuel-${index}`).value;
        return {
            flight_number: currentFlights[index].flight_number,
            aircraft_registration: document.getElementById(`aircraft-${index}`).value,
            station: document.getElementById(`station-${index}`).value,
            scheduled_out_time: document.getElementById(`time-${index}`).value,
            fuel_liters: unit === 'liters' ? fuelValue : '',
            fuel_lbs: unit === 'lbs' ? fuelValue : '',
            dispatcher_initials: document.getElementById(`dispatcher-${index}`).value
        };
    }
    
    // Otherwise return current flight data
    return currentFlights[index];
}

// Draft Email
async function draftEmail(flightIndex) {
    const flight = getCurrentFlightData(flightIndex);
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flight)
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        currentDraft = { flight, draft: data.draft };
        showEmailPreview(data.draft);
        
    } catch (error) {
        showToast('Failed to draft email: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Show Email Preview Modal
function showEmailPreview(draft) {
    document.getElementById('preview-to').textContent = draft.to.join(', ');
    document.getElementById('preview-cc').textContent = draft.cc.join(', ') || 'None';
    document.getElementById('preview-subject').textContent = draft.subject;
    document.getElementById('preview-body').textContent = draft.body;
    
    document.getElementById('email-modal').classList.add('show');
}

// Close Modal
function closeModal() {
    document.getElementById('email-modal').classList.remove('show');
    currentDraft = null;
}

// Confirm Send from Modal
async function confirmSend() {
    if (!currentDraft) {
        showToast('No draft available. Please draft the email first.', 'error');
        closeModal();
        return;
    }
    
    // Store the flight data before closing modal
    const flightToSend = currentDraft.flight;
    closeModal();
    
    // Send the order
    await sendOrder(flightToSend);
}

// Send Order Directly
async function sendOrderDirect(flightIndex) {
    const flight = getCurrentFlightData(flightIndex);
    await sendOrder(flight);
}

// Send Order
async function sendOrder(flight) {
    if (!flight) {
        showToast('No flight data available', 'error');
        console.error('sendOrder called with null/undefined flight');
        return;
    }
    
    console.log('Sending order for flight:', flight.flight_number);
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flight)
        });
        
        const data = await response.json();
        
        if (response.status === 409) {
            // Order already sent
            const forceSend = confirm(
                `A fuel order has already been sent for ${flight.flight_number}. ` +
                `Do you want to send it again?`
            );
            
            if (forceSend) {
                flight.force_send = true;
                await sendOrder(flight);
            }
            return;
        }
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        showToast(`Fuel order sent successfully for ${flight.flight_number}`, 'success');
        
        // Refresh flights to update status
        await refreshFlights();
        
    } catch (error) {
        showToast('Failed to send order: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load Sent Orders
async function loadSentOrders() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders`);
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        console.log('Total orders from API:', data.orders.length);
        console.log('Orders:', data.orders);
        
        // Show all orders (both original sent and updated versions)
        displayOrders(data.orders, 'sent-orders-container', true);
        
    } catch (error) {
        showToast('Failed to load sent orders: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load History
async function loadHistory() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders`);
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        displayOrders(data.orders, 'history-container', false);
        
    } catch (error) {
        showToast('Failed to load history: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Filter History
async function filterHistory() {
    const filterValue = document.getElementById('history-filter').value;
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders`);
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        let filteredOrders = data.orders;
        
        if (filterValue !== 'all') {
            filteredOrders = data.orders.filter(order => order.status === filterValue);
        }
        
        displayOrders(filteredOrders, 'history-container', false);
        
    } catch (error) {
        showToast('Failed to filter history: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Display Orders
function displayOrders(orders, containerId, showUpdateButton) {
    const container = document.getElementById(containerId);
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="placeholder">No orders found</p>';
        return;
    }
    
    // Update count badge
    if (containerId === 'sent-orders-container') {
        document.getElementById('sent-count').textContent = `${orders.length} Orders`;
    }
    
    container.innerHTML = orders.map(order => {
        // Determine which fuel unit was sent
        const fuelDisplay = order.fuel_lbs ? 
            `<div class="detail-item">
                <span class="detail-label">Fuel Order (LBS)</span>
                <span class="detail-value">${order.fuel_lbs}</span>
            </div>` :
            order.fuel_liters ?
            `<div class="detail-item">
                <span class="detail-label">Fuel Order (Liters)</span>
                <span class="detail-value">${order.fuel_liters}</span>
            </div>` :
            `<div class="detail-item">
                <span class="detail-label">Fuel Order</span>
                <span class="detail-value">N/A</span>
            </div>`;
        
        return `
        <div class="flight-card">
            <div class="flight-header">
                <div class="flight-number">${order.flight_number}</div>
                <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="flight-details">
                <div class="detail-item">
                    <span class="detail-label">Aircraft</span>
                    <span class="detail-value">${order.aircraft_registration}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Station</span>
                    <span class="detail-value">${order.station}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Scheduled Out</span>
                    <span class="detail-value">${order.scheduled_out_time}</span>
                </div>
                ${fuelDisplay}
                <div class="detail-item">
                    <span class="detail-label">Dispatcher</span>
                    <span class="detail-value">${order.dispatcher_initials}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Sent At</span>
                    <span class="detail-value">${new Date(order.sent_at).toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Sent To</span>
                    <span class="detail-value" style="font-size: 0.85em;">${Array.isArray(order.sent_to) ? order.sent_to.join(', ') : order.sent_to}</span>
                </div>
            </div>
            ${showUpdateButton && order.status === 'sent' ? `
                <div class="flight-actions">
                    <button class="btn btn-warning btn-small" onclick="openUpdateModal(${order.id})">
                        📝 Update Order
                    </button>
                </div>
            ` : ''}
            ${order.is_updated ? `
                <div style="margin-top: 15px; padding: 12px; background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1)); border-left: 4px solid var(--warning-color); border-radius: 6px; font-size: 0.9em; color: var(--text-primary);">
                    <strong>⚠️ Updated Order</strong><br>
                    Original Order ID: #${order.original_order_id}
                    ${order.update_reason ? `<br>Reason: ${order.update_reason}` : ''}
                </div>
            ` : ''}
            ${order.status === 'updated' ? `
                <div style="margin-top: 15px; padding: 12px; background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1)); border-left: 4px solid var(--warning-color); border-radius: 6px; font-size: 0.9em; color: var(--text-primary);">
                    <strong>📝 This order was updated</strong><br>
                    A newer version of this order has been sent.
                </div>
            ` : ''}
        </div>
    `;
    }).join('');
}

// Open Update Modal
async function openUpdateModal(orderId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        const order = data.order;
        currentOrderToUpdate = orderId;
        
        document.getElementById('update-flight-number').value = order.flight_number;
        document.getElementById('update-aircraft').value = order.aircraft_registration;
        document.getElementById('update-station').value = order.station;
        document.getElementById('update-time').value = order.scheduled_out_time;
        document.getElementById('update-dispatcher').value = order.dispatcher_initials;
        document.getElementById('update-reason').value = '';
        
        // Set fuel unit and amount based on what was sent
        if (order.fuel_lbs) {
            document.querySelector('input[name="update-unit"][value="lbs"]').checked = true;
            document.getElementById('update-fuel-label').textContent = 'Fuel Order (LBS):';
            document.getElementById('update-fuel-amount').value = order.fuel_lbs;
        } else if (order.fuel_liters) {
            document.querySelector('input[name="update-unit"][value="liters"]').checked = true;
            document.getElementById('update-fuel-label').textContent = 'Fuel Order (Liters):';
            document.getElementById('update-fuel-amount').value = order.fuel_liters;
        } else {
            // Default to LBS
            document.querySelector('input[name="update-unit"][value="lbs"]').checked = true;
            document.getElementById('update-fuel-label').textContent = 'Fuel Order (LBS):';
            document.getElementById('update-fuel-amount').value = '';
        }
        
        document.getElementById('update-modal').classList.add('show');
        
    } catch (error) {
        showToast('Failed to load order: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Close Update Modal
function closeUpdateModal() {
    document.getElementById('update-modal').classList.remove('show');
    currentOrderToUpdate = null;
}

// Change Update Fuel Unit
function changeUpdateFuelUnit(unit) {
    const label = document.getElementById('update-fuel-label');
    if (unit === 'lbs') {
        label.textContent = 'Fuel Order (LBS):';
    } else {
        label.textContent = 'Fuel Order (Liters):';
    }
}

// Submit Update
async function submitUpdate() {
    if (!currentOrderToUpdate) {
        showToast('No order selected for update', 'error');
        return;
    }
    
    const selectedUnit = document.querySelector('input[name="update-unit"]:checked').value;
    const fuelAmount = document.getElementById('update-fuel-amount').value;
    
    const updatedOrder = {
        flight_number: document.getElementById('update-flight-number').value,
        aircraft_registration: document.getElementById('update-aircraft').value,
        station: document.getElementById('update-station').value,
        scheduled_out_time: document.getElementById('update-time').value,
        fuel_liters: selectedUnit === 'liters' ? fuelAmount : '',
        fuel_lbs: selectedUnit === 'lbs' ? fuelAmount : '',
        dispatcher_initials: document.getElementById('update-dispatcher').value,
        update_reason: document.getElementById('update-reason').value
    };
    
    // Store the order ID before closing modal
    const orderIdToUpdate = currentOrderToUpdate;
    closeUpdateModal();
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders/${orderIdToUpdate}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder)
        });
        
        const data = await response.json();
        
        console.log('Update response:', data);
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        if (data.success) {
            showToast('Updated fuel order sent successfully', 'success');
            console.log('Update successful, reloading sent orders...');
            await loadSentOrders();
        }
        
    } catch (error) {
        console.error('Update error:', error);
        showToast('Failed to update order: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// View Email Details
async function viewEmailDetails(orderId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        const order = data.order;
        const sentTo = JSON.parse(order.sent_to);
        
        document.getElementById('preview-to').textContent = sentTo.join(', ');
        document.getElementById('preview-cc').textContent = 'See original email';
        document.getElementById('preview-subject').textContent = order.email_subject;
        document.getElementById('preview-body').textContent = order.email_body;
        
        // Hide send button for view-only
        document.querySelector('#email-modal .modal-footer .btn-success').style.display = 'none';
        document.getElementById('email-modal').classList.add('show');
        
        setTimeout(() => {
            document.querySelector('#email-modal .modal-footer .btn-success').style.display = 'inline-flex';
        }, 100);
        
    } catch (error) {
        showToast('Failed to load order details: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===================================================================
// STATION EMAIL SETTINGS
// ===================================================================
let stationEmails = {};

// Common airport/station codes for suggestions
const commonStations = [
    'ATL', 'DFW', 'DEN', 'ORD', 'LAX', 'CLT', 'MCO', 'LAS', 'PHX', 'MIA',
    'SEA', 'IAH', 'EWR', 'SFO', 'MSP', 'DTW', 'BOS', 'PHL', 'LGA', 'FLL',
    'BWI', 'DCA', 'MDW', 'SLC', 'SAN', 'IAD', 'TPA', 'PDX', 'STL', 'HNL',
    'AUS', 'BNA', 'OAK', 'MSY', 'RDU', 'SJC', 'SAT', 'RSW', 'PIT', 'CVG',
    'CMH', 'IND', 'JAX', 'CLE', 'MCI', 'OGG', 'SMF', 'SNA', 'ABQ', 'BUF',
    'ONT', 'BDL', 'ANC', 'OMA', 'RNO', 'TUS', 'BUR', 'ELP', 'MKE', 'PBI',
    'JFK', 'ORF', 'RIC', 'SDF', 'TUL', 'OKC', 'GEG', 'BOI', 'ICT', 'COS'
];

// Initialize station suggestions
function initializeStationSuggestions() {
    const datalist = document.getElementById('station-suggestions');
    if (datalist) {
        datalist.innerHTML = commonStations
            .map(code => `<option value="${code}">${code}</option>`)
            .join('');
    }
}

// Filter station suggestions as user types
function filterStationSuggestions(value) {
    const input = value.toUpperCase().trim();
    const liveContainer = document.getElementById('station-suggestions-live');
    
    if (!input || input.length < 1) {
        liveContainer.innerHTML = '';
        return;
    }
    
    // Filter matching stations
    const matches = commonStations.filter(code => 
        code.startsWith(input) || code.includes(input)
    ).slice(0, 10); // Limit to 10 suggestions
    
    if (matches.length === 0) {
        liveContainer.innerHTML = '<div style="padding: 8px; color: #6c757d;">No matching stations</div>';
        return;
    }
    
    // Display suggestions with existing status
    liveContainer.innerHTML = matches.map(code => {
        const exists = stationEmails.hasOwnProperty(code);
        return `
            <div class="suggestion-item ${exists ? 'exists' : ''}" 
                 onclick="${exists ? '' : `selectStation('${code}')`}"
                 title="${exists ? 'Already configured' : 'Click to select'}">
                ${code} ${exists ? '✓ Configured' : ''}
            </div>
        `;
    }).join('');
}

// Select a station from suggestions
function selectStation(code) {
    document.getElementById('new-station-code').value = code;
    document.getElementById('station-suggestions-live').innerHTML = '';
    document.getElementById('new-station-email').focus();
}

// Open Station Settings Modal
async function openStationSettings() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/api/stations`);
        const data = await response.json();
        
        if (data.success) {
            stationEmails = data.stations;
            displayStationList();
            initializeStationSuggestions();
            document.getElementById('station-settings-modal').style.display = 'flex';
        } else {
            showToast(data.error || 'Failed to load stations', 'error');
        }
    } catch (error) {
        showToast('Failed to load station settings: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Display Station List
function displayStationList() {
    const container = document.getElementById('station-list');
    const stations = Object.entries(stationEmails);
    
    if (stations.length === 0) {
        container.innerHTML = '<div class="empty-state"><i>📭</i><p>No stations configured yet</p></div>';
        return;
    }
    
    container.innerHTML = stations.map(([code, email]) => `
        <div class="station-item">
            <div class="station-code">${code}</div>
            <div class="station-email-input-wrapper">
                <input type="text" 
                       id="email-${code}" 
                       value="${email}" 
                       placeholder="email1@example.com, email2@example.com"
                       onchange="updateStationEmail('${code}', this.value)">
            </div>
            <div class="station-actions">
                <button class="btn-remove" onclick="removeStation('${code}')">🗑️ Remove</button>
            </div>
        </div>
    `).join('');
}

// Update Station Email (in memory)
function updateStationEmail(code, email) {
    stationEmails[code] = email;
}

// Add New Station
function addStation() {
    const codeInput = document.getElementById('new-station-code');
    const emailInput = document.getElementById('new-station-email');
    
    const code = codeInput.value.trim().toUpperCase();
    const email = emailInput.value.trim();
    
    if (!code) {
        showToast('Please enter a station code', 'error');
        return;
    }
    
    if (!email) {
        showToast('Please enter at least one email address', 'error');
        return;
    }
    
    if (stationEmails[code]) {
        showToast(`Station ${code} already exists. Edit it instead.`, 'error');
        return;
    }
    
    stationEmails[code] = email;
    displayStationList();
    
    // Clear inputs and suggestions
    codeInput.value = '';
    emailInput.value = '';
    document.getElementById('station-suggestions-live').innerHTML = '';
    
    showToast(`Station ${code} added`, 'success');
}

// Remove Station
function removeStation(code) {
    if (confirm(`Remove station ${code}?`)) {
        delete stationEmails[code];
        displayStationList();
        showToast(`Station ${code} removed`, 'success');
    }
}

// Save Station Settings
async function saveStationSettings() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/api/stations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stations: stationEmails })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Station settings saved successfully', 'success');
            closeStationSettings();
        } else {
            showToast(data.error || 'Failed to save settings', 'error');
        }
    } catch (error) {
        showToast('Failed to save settings: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Close Station Settings Modal
function closeStationSettings() {
    document.getElementById('station-settings-modal').style.display = 'none';
    document.getElementById('station-suggestions-live').innerHTML = '';
    document.getElementById('new-station-code').value = '';
    document.getElementById('new-station-email').value = '';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load flight data automatically
    refreshFlights();
    // Load sent orders initially
    loadSentOrders();
});
