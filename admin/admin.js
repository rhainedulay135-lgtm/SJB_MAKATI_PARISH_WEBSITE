// Admin Dashboard JavaScript

let currentBookingId = null;

// Check admin authentication
function checkAdminAuth() {
    if (!bookingSystem.isAdminLoggedIn()) {
        window.location.href = '../client/booking-form.html';
        return false;
    }
    return true;
}

// Show admin section
function showAdminSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Add active to clicked menu item
    event.target.closest('.menu-item').classList.add('active');

    // Load section-specific data
    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'pending') {
        loadPendingBookings();
    } else if (sectionId === 'approved') {
        loadApprovedBookings();
    } else if (sectionId === 'declined') {
        loadDeclinedBookings();
    } else if (sectionId === 'calendar') {
        loadCalendar();
    }
}

// Admin Logout
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        bookingSystem.adminLogout();
        window.location.href = '../client/booking-form.html';
    }
}

// Load Dashboard
function loadDashboard() {
    const bookings = bookingSystem.bookings;
    const pending = bookings.filter(b => b.status === 'PENDING' || b.status === 'URGENT_PENDING' || b.status === 'ON_HOLD');
    const urgent = bookings.filter(b => b.status === 'URGENT_PENDING');

    const approvedThisWeek = bookings.filter(b => 
        b.status === 'APPROVED' && 
        isWithinWeek(new Date(b.updatedAt))
    ).length;

    const declinedThisWeek = bookings.filter(b => 
        b.status === 'DECLINED' && 
        isWithinWeek(new Date(b.updatedAt))
    ).length;

    // Update stats
    document.getElementById('pendingCount').textContent = pending.length;
    document.getElementById('urgentCount').textContent = `${urgent.length} Urgent (Funerals)`;
    document.getElementById('approvedWeek').textContent = approvedThisWeek;
    document.getElementById('declinedWeek').textContent = declinedThisWeek;
    document.getElementById('totalBookings').textContent = bookings.length;

    // Update sacrament stats
    updateSacramentStats('wedding');
    updateSacramentStats('baptism');
    updateSacramentStats('funeral');
}

// Update sacrament statistics
function updateSacramentStats(sacrament) {
    const sacramentBookings = bookingSystem.getBookingsByType(sacrament);
    const total = sacramentBookings.length;
    const pending = sacramentBookings.filter(b => b.status === 'PENDING' || b.status === 'URGENT_PENDING' || b.status === 'ON_HOLD').length;
    const approved = sacramentBookings.filter(b => b.status === 'APPROVED').length;
    const declined = sacramentBookings.filter(b => b.status === 'DECLINED').length;

    document.getElementById(`${sacrament}Total`).textContent = total;
    document.getElementById(`${sacrament}Pending`).textContent = pending;
    document.getElementById(`${sacrament}Approved`).textContent = approved;
    document.getElementById(`${sacrament}Declined`).textContent = declined;
}

// Check if date is within current week
function isWithinWeek(date) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
}

// Load pending bookings
function loadPendingBookings() {
    const pending = bookingSystem.getPendingBookings();
    displayBookings('pendingBookingsList', pending);
}

// Load approved bookings
function loadApprovedBookings() {
    const approved = bookingSystem.bookings.filter(b => b.status === 'APPROVED');
    displayBookings('approvedBookingsList', approved);
}

// Load declined bookings
function loadDeclinedBookings() {
    const declined = bookingSystem.bookings.filter(b => b.status === 'DECLINED');
    displayBookings('declinedBookingsList', declined);
}

// Display bookings
function displayBookings(containerId, bookings) {
    const container = document.getElementById(containerId);
    
    if (bookings.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No bookings to display</p>';
        return;
    }

    container.innerHTML = bookings.map(booking => `
        <div class="booking-card ${booking.status === 'URGENT_PENDING' ? 'urgent' : ''}" onclick="openBookingModal('${booking.id}')">
            <div class="booking-header">
                <span class="booking-id">${booking.id}</span>
                <span class="booking-type">${getSacramentEmoji(booking.type)} ${booking.type.toUpperCase()}</span>
                <span class="booking-status ${booking.status.toLowerCase()}">${formatStatus(booking.status)}</span>
            </div>

            <div class="booking-details-summary">
                <div class="booking-detail-item">
                    <strong>Requestor:</strong>
                    ${getRequestorName(booking)}
                </div>
                <div class="booking-detail-item">
                    <strong>Submitted:</strong>
                    ${formatDate(new Date(booking.createdAt))}
                </div>
                <div class="booking-detail-item">
                    <strong>Contact:</strong>
                    ${getContactInfo(booking)}
                </div>
                <div class="booking-detail-item">
                    <strong>Requested Date:</strong>
                    ${getRequestedDate(booking)}
                </div>
            </div>

            ${booking.adminNotes ? `
                <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px; font-size: 0.9em;">
                    <strong>Notes:</strong> ${booking.adminNotes}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Open booking modal
function openBookingModal(bookingId) {
    const booking = bookingSystem.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    currentBookingId = bookingId;

    const html = `
        <div class="booking-details-grid">
            <div class="booking-detail">
                <strong>Booking ID:</strong>
                ${booking.id}
            </div>
            <div class="booking-detail">
                <strong>Type:</strong>
                ${getSacramentEmoji(booking.type)} ${booking.type.toUpperCase()}
            </div>
            <div class="booking-detail">
                <strong>Status:</strong>
                ${formatStatus(booking.status)}
            </div>
            <div class="booking-detail">
                <strong>Submitted:</strong>
                ${formatDate(new Date(booking.createdAt))}
            </div>
            ${getBookingDetailsHTML(booking)}
        </div>
    `;

    document.getElementById('bookingDetails').innerHTML = html;
    document.getElementById('bookingModal').classList.add('show');
}

// Get booking details HTML
function getBookingDetailsHTML(booking) {
    const data = booking.data;
    let html = '';

    if (booking.type === 'wedding') {
        html = `
            <div class="booking-detail">
                <strong>Groom:</strong>
                ${data.groom_name}
            </div>
            <div class="booking-detail">
                <strong>Bride:</strong>
                ${data.bride_name}
            </div>
            <div class="booking-detail">
                <strong>Wedding Date:</strong>
                ${formatDate(new Date(data.wedding_date))}
            </div>
            <div class="booking-detail">
                <strong>Time:</strong>
                ${data.wedding_time}
            </div>
            <div class="booking-detail">
                <strong>Guests:</strong>
                ${data.guest_count}
            </div>
            <div class="booking-detail">
                <strong>Contact:</strong>
                ${data.groom_email} | ${data.groom_phone}
            </div>
        `;
    } else if (booking.type === 'baptism') {
        html = `
            <div class="booking-detail">
                <strong>Type:</strong>
                ${data.baptism_type}
            </div>
            <div class="booking-detail">
                <strong>Candidate:</strong>
                ${data.candidate_name}
            </div>
            <div class="booking-detail">
                <strong>Parent/Guardian:</strong>
                ${data.parent1_name}
            </div>
            <div class="booking-detail">
                <strong>Baptism Date:</strong>
                ${formatDate(new Date(data.baptism_date))}
            </div>
            <div class="booking-detail">
                <strong>Contact:</strong>
                ${data.parent1_email} | ${data.parent1_phone}
            </div>
        `;
    } else if (booking.type === 'funeral') {
        html = `
            <div class="booking-detail">
                <strong>Deceased:</strong>
                ${data.deceased_name}
            </div>
            <div class="booking-detail">
                <strong>Date of Death:</strong>
                ${formatDate(new Date(data.death_date))}
            </div>
            <div class="booking-detail">
                <strong>Family Contact:</strong>
                ${data.requestor_name}
            </div>
            <div class="booking-detail">
                <strong>Funeral Date:</strong>
                ${formatDate(new Date(data.funeral_date))}
            </div>
            <div class="booking-detail">
                <strong>Contact:</strong>
                ${data.requestor_email} | ${data.requestor_phone}
            </div>
            <div class="booking-detail">
                <strong>Expected Attendees:</strong>
                ${data.funeral_attendees}
            </div>
        `;
    }

    if (booking.data.special_requests || booking.data.special_requests_bap || booking.data.special_requests_fun) {
        const requests = booking.data.special_requests || booking.data.special_requests_bap || booking.data.special_requests_fun;
        html += `
            <div class="booking-detail" style="grid-column: 1 / -1;">
                <strong>Special Requests:</strong>
                ${requests}
            </div>
        `;
    }

    return html;
}

// Approve booking
function approveBooking() {
    document.getElementById('approvalModal').classList.add('show');
}

// Confirm approval
function confirmApproval() {
    const notes = document.getElementById('approvalNotes').value;
    const sendEmail = document.getElementById('sendEmail').checked;

    bookingSystem.updateBookingStatus(currentBookingId, 'APPROVED', notes);

    alert('✓ Booking approved successfully!');
    if (sendEmail) {
        sendConfirmationEmail(currentBookingId);
    }

    closeModal();
    closeApprovalModal();
    loadPendingBookings();
}

// Decline booking
function declineBooking() {
    document.getElementById('declineModal').classList.add('show');
}

// Confirm decline
function confirmDecline() {
    const reason = document.getElementById('declineReason').value;
    const message = document.getElementById('declineMessage').value;

    if (!reason) {
        alert('Please select a reason for declining');
        return;
    }

    const fullMessage = `Reason: ${reason}\n\n${message}`;
    bookingSystem.updateBookingStatus(currentBookingId, 'DECLINED', fullMessage);

    alert('✗ Booking declined. Notification sent to customer.');
    closeModal();
    closeDeclineModal();
    loadPendingBookings();
}

// Hold booking
function holdBooking() {
    if (confirm('Place this booking on hold?')) {
        bookingSystem.updateBookingStatus(currentBookingId, 'ON_HOLD', 'Awaiting additional information');
        alert('⏳ Booking placed on hold.');
        closeModal();
        loadPendingBookings();
    }
}

// Filter pending bookings
function filterPendingBy(type) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (type === 'all') {
        const pending = bookingSystem.getPendingBookings();
        displayBookings('pendingBookingsList', pending);
    } else {
        const pending = bookingSystem.getPendingBookings()
            .filter(b => b.type === type);
        displayBookings('pendingBookingsList', pending);
    }
}

// Modal functions
function closeModal() {
    document.getElementById('bookingModal').classList.remove('show');
    currentBookingId = null;
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.remove('show');
    document.getElementById('approvalNotes').value = '';
    document.getElementById('sendEmail').checked = true;
}

function closeDeclineModal() {
    document.getElementById('declineModal').classList.remove('show');
    document.getElementById('declineReason').value = '';
    document.getElementById('declineMessage').value = '';
}

// Helper functions
function getSacramentEmoji(type) {
    const emojis = {
        'wedding': '💍',
        'baptism': '👶',
        'funeral': '🙏'
    };
    return emojis[type] || '📋';
}

function formatStatus(status) {
    const statusMap = {
        'PENDING': 'Pending Review',
        'URGENT_PENDING': '🚨 URGENT - Funeral',
        'APPROVED': '✓ Approved',
        'DECLINED': '✗ Declined',
        'ON_HOLD': '⏳ On Hold',
        'COMPLETED': '✓ Completed'
    };
    return statusMap[status] || status;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getRequestorName(booking) {
    if (booking.type === 'wedding') {
        return booking.data.groom_name + ' & ' + booking.data.bride_name;
    } else if (booking.type === 'baptism') {
        return booking.data.parent1_name;
    } else if (booking.type === 'funeral') {
        return booking.data.requestor_name;
    }
    return 'N/A';
}

function getContactInfo(booking) {
    if (booking.type === 'wedding') {
        return booking.data.groom_phone;
    } else if (booking.type === 'baptism') {
        return booking.data.parent1_phone;
    } else if (booking.type === 'funeral') {
        return booking.data.requestor_phone;
    }
    return 'N/A';
}

function getRequestedDate(booking) {
    if (booking.type === 'wedding') {
        return formatDate(new Date(booking.data.wedding_date));
    } else if (booking.type === 'baptism') {
        return formatDate(new Date(booking.data.baptism_date));
    } else if (booking.type === 'funeral') {
        return formatDate(new Date(booking.data.funeral_date));
    }
    return 'N/A';
}

function sendConfirmationEmail(bookingId) {
    console.log(`Email sent for booking: ${bookingId}`);
    // In a real application, this would connect to an email service
}

// Load calendar
function loadCalendar() {
    // Simple calendar implementation
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '<p style="padding: 20px;">Calendar feature coming soon...</p>';
}

// Settings functions
function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) {
        alert('Please fill in all fields');
        return;
    }

    if (newPass !== confirm) {
        alert('Passwords do not match');
        return;
    }

    if (bookingSystem.users[bookingSystem.currentUser] !== current) {
        alert('Current password is incorrect');
        return;
    }

    bookingSystem.users[bookingSystem.currentUser] = newPass;
    alert('✓ Password changed successfully');

    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function addAdminUser() {
    const username = document.getElementById('newAdminUsername').value;
    const password = document.getElementById('newAdminPassword').value;

    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }

    if (bookingSystem.users[username]) {
        alert('User already exists');
        return;
    }

    bookingSystem.users[username] = password;
    alert('✓ Admin user added successfully');

    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
}

// Update time displays
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();

    document.getElementById('currentTime').textContent = timeString;
    document.getElementById('systemTime').textContent = timeString;
    document.getElementById('systemTotalBookings').textContent = bookingSystem.bookings.length;
}

// Initialize admin panel
window.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;

    // Load dashboard on startup
    loadDashboard();

    // Set first menu item as active
    document.querySelector('.menu-item').classList.add('active');

    // Update time every second
    updateTime();
    setInterval(updateTime, 1000);

    // Close modal when clicking outside
    document.getElementById('bookingModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    document.getElementById('approvalModal').addEventListener('click', function(e) {
        if (e.target === this) closeApprovalModal();
    });

    document.getElementById('declineModal').addEventListener('click', function(e) {
        if (e.target === this) closeDeclineModal();
    });
});
