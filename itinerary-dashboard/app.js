// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Import configuration
import { firebaseConfig, LIVE_CSV_URL, MANDATORY_STAFF_ASSIGNMENTS } from './config.js';

// --- Firebase Initialization ---
let app, db, auth;
let isStaffMode = false;

// Check if Firebase config is properly set
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("✅ Firebase initialized successfully");
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
    }
} else {
    console.log("⚠️ Running in standalone mode (Firebase not configured)");
}

// --- Core Itinerary Logic ---
let itineraryData = [];
let currentDay = '';
let activeFilters = { staff: 'All', group: 'All' };

// Element references
const loadingIndicator = document.getElementById('loadingIndicator');
const tabsContainer = document.getElementById('tabs-container');
const contentContainer = document.getElementById('content-container');
const filtersContainer = document.getElementById('filters-container');
const lastUpdatedElement = document.getElementById('last-updated');
const staffStatusElement = document.getElementById('staff-status');
const loginModal = document.getElementById('login-modal');

// Standardized Headers
let dateHeader = 'Day/Date';
let timeHeader = 'Time';
let activityHeader = 'Activity';
let locationHeader = 'Location';
let detailsHeader = 'Logistics';
let extraDetailsHeader = 'Further Details';
let staffHeader = 'Staff Allocation';
let groupHeader = 'Group Applicable';

const FALLBACK_HEADERS = [
    dateHeader, timeHeader, activityHeader, locationHeader, detailsHeader, 'Student Notes', staffHeader, groupHeader, extraDetailsHeader
];

function showLoading(show) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
}

// --- Authentication and Mode Management ---
function updateUIAndLoadData() {
    if (!auth) {
        // Standalone mode - use sessionStorage
        isStaffMode = window.sessionStorage.getItem('staffMode') === 'true';
    } else {
        // Firebase mode - check if user is not anonymous
        isStaffMode = auth.currentUser && !auth.currentUser.isAnonymous;
    }

    staffStatusElement.innerHTML = '';

    if (isStaffMode) {
        staffStatusElement.innerHTML = `
            <span class="ml-4 text-sm font-bold text-emerald-600 flex items-center">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.001 12.001 0 002.944 12c.045 2.533.729 4.908 1.958 7.031l-.004.004C5.167 20.378 8.44 21.902 12 21.902c3.56 0 6.833-1.524 8.098-3.033l.004-.004c1.229-2.123 1.913-4.498 1.958-7.031a12.001 12.001 0 00-2.434-7.956z"></path></svg>
                STAFF MODE
            </span>
            <button onclick="window.handleLogout()" 
                class="ml-2 px-4 py-2 text-sm font-semibold rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition duration-150">
                Logout
            </button>
        `;
    } else {
        staffStatusElement.innerHTML = `
            <span class="ml-4 text-sm text-gray-500 font-medium">Mode: Student (Public)</span>
            <button onclick="window.showLoginModal(true)" 
                class="ml-2 px-4 py-2 text-sm font-semibold rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition duration-150">
                Staff Login
            </button>
        `;
    }

    // Load data only if not already loaded
    if (itineraryData.length === 0) {
        loadItineraryData();
    } else {
        renderContent(currentDay);
    }
}

// Login/Logout Handlers
window.showLoginModal = (show) => {
    if (loginModal) {
        loginModal.classList.toggle('hidden', !show);
        if (show) {
            document.getElementById('login-email').value = 'staff@example.com';
            document.getElementById('login-password').value = 'password';
            document.getElementById('login-error').textContent = '';
        }
    }
};

window.handleLogout = async () => {
    try {
        if (auth) {
            await signOut(auth);
        } else {
            window.sessionStorage.removeItem('staffMode');
            isStaffMode = false;
            updateUIAndLoadData();
        }
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginError = document.getElementById('login-error');

    loginError.textContent = '';

    if (!email || !password) {
        loginError.textContent = 'Please enter both email and password.';
        return;
    }

    try {
        showLoading(true);
        if (auth) {
            // Real Firebase email/password sign-in
            const cred = await signInWithEmailAndPassword(auth, email, password);
            if (cred?.user) {
                window.showLoginModal(false);
                updateUIAndLoadData();
            }
        } else {
            // Standalone mock fallback
            if (email === 'staff@example.com' && password === 'password') {
                window.showLoginModal(false);
                isStaffMode = true;
                window.sessionStorage.setItem('staffMode', 'true');
                updateUIAndLoadData();
            } else {
                loginError.textContent = 'Invalid email or password.';
            }
        }
    } catch (error) {
        console.error('Login failed:', error);
        const code = error?.code || '';
        if (code === 'auth/invalid-email') loginError.textContent = 'Invalid email format.';
        else if (code === 'auth/user-not-found' || code === 'auth/wrong-password') loginError.textContent = 'Incorrect email or password.';
        else if (code === 'auth/too-many-requests') loginError.textContent = 'Too many attempts. Try again later.';
        else loginError.textContent = `Login failed: ${error.message}`;
    } finally {
        showLoading(false);
    }
};

// Firebase Authentication Listener
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            signInAnonymously(auth)
                .then(() => updateUIAndLoadData())
                .catch(err => {
                    console.error("Anonymous sign-in failed:", err);
                    updateUIAndLoadData();
                });
        } else {
            updateUIAndLoadData();
        }
    });
} else {
    // Standalone mode - load directly
    isStaffMode = window.sessionStorage.getItem('staffMode') === 'true';
    staffStatusElement.innerHTML = `
        <span class="ml-4 text-sm text-gray-500 font-medium">Mode: Student (Public)</span>
        <button onclick="window.showLoginModal(true)" 
            class="ml-2 px-4 py-2 text-sm font-semibold rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition duration-150">
            Staff Login
        </button>
    `;
    loadItineraryData();
}

// Toggle Details
window.toggleDetails = (activityId) => {
    const contentElement = document.getElementById(`details-content-${activityId}`);
    const buttonElement = document.getElementById(`details-button-${activityId}`);
    if (contentElement && buttonElement) {
        const isOpen = contentElement.classList.toggle('open');
        const icon = buttonElement.querySelector('svg');
        if (icon) {
            icon.innerHTML = isOpen
                ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />'
                : '<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />';
        }
    }
};

// --- Data Parsing ---
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length <= 1) return [];

    const initialHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    let headers = initialHeaders;

    if (headers.length < 5) {
        console.warn("Using fallback headers");
        headers = FALLBACK_HEADERS;
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g) || [];
        const cleanedRow = row.map(c => c.trim().replace(/^"|"$/g, ''));

        if (cleanedRow.length > 0) {
            const item = {};
            headers.forEach((header, index) => {
                item[header] = cleanedRow[index] !== undefined ? cleanedRow[index] : '';
            });
            data.push(item);
        }
    }
    return data.filter(item => item[dateHeader] && item[dateHeader].trim());
}

function determineHeaders(data) {
    console.log("Mapped Headers:", {
        dateHeader, timeHeader, activityHeader, locationHeader, detailsHeader,
        extraDetailsHeader, staffHeader, groupHeader
    });
}

// --- Rendering Functions ---
function renderTabs(data) {
    const uniqueDays = [];
    data.forEach(item => {
        const day = item[dateHeader] ? item[dateHeader].trim() : '';
        if (day && !uniqueDays.includes(day)) {
            uniqueDays.push(day);
        }
    });

    tabsContainer.innerHTML = '';

    if (uniqueDays.length === 0) {
        contentContainer.innerHTML = '<p class="text-center text-gray-500 p-8">No itinerary data found.</p>';
        return;
    }

    let firstDay = currentDay;
    uniqueDays.forEach((day, index) => {
        const button = document.createElement('button');
        button.className = 'tab-button px-4 py-2 text-sm font-medium rounded-full transition duration-150 hover:bg-emerald-100 hover:text-emerald-700 text-gray-700 bg-white shadow-sm';
        button.textContent = day;
        button.onclick = () => switchDay(day);
        tabsContainer.appendChild(button);
        if (index === 0) firstDay = day;
    });

    if (!currentDay || !uniqueDays.includes(currentDay)) {
        currentDay = firstDay;
    }

    const currentTab = Array.from(tabsContainer.children).find(btn => btn.textContent === currentDay);
    if (currentTab) currentTab.classList.add('active');

    renderFilters(data);
    renderContent(currentDay);
}

function switchDay(day) {
    currentDay = day;
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === day) btn.classList.add('active');
    });
    activeFilters = { staff: 'All', group: 'All' };
    renderFilters(itineraryData);
    renderContent(day);
}

function filterData(data) {
    const staffFilterActive = isStaffMode && activeFilters.staff !== 'All';

    return data.filter(item => {
        if (staffFilterActive) {
            const requiredStaff = activeFilters.staff;
            const itemStaffRaw = item[staffHeader] || '';
            const itemStaffList = itemStaffRaw.split('/').map(s => s.trim());
            const isExplicitlyAssigned = itemStaffList.includes(requiredStaff);
            const isMandatoryAssignment = MANDATORY_STAFF_ASSIGNMENTS.some(mandatory =>
                itemStaffList.includes(mandatory)
            );
            if (!isExplicitlyAssigned && !isMandatoryAssignment) return false;
        }

        if (activeFilters.group !== 'All') {
            const itemGroup = item[groupHeader] || '';
            if (itemGroup.trim() !== 'All' && itemGroup.trim() !== activeFilters.group) return false;
        }
        return true;
    });
}

window.handleFilterChange = (event, type) => {
    activeFilters[type] = event.target.value;
    renderContent(currentDay);
};

function getUniqueValues(data, header) {
    if (!header) return [];
    const values = data.map(item => item[header]).filter(v => v && v.trim());
    if (header === staffHeader) {
        const allStaff = values.flatMap(v => v.split('/').map(s => s.trim()));
        return [...new Set(allStaff)].sort();
    }
    return [...new Set(values)].sort();
}

function createDropdown(type, label, values) {
    const currentActive = activeFilters[type];
    let html = `<div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <label for="${type}-filter" class="font-semibold text-gray-700">${label}:</label>
        <select id="${type}-filter" onchange="window.handleFilterChange(event, '${type}')"
                class="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-800 w-full sm:w-auto min-w-[150px]">
            <option value="All" ${currentActive === 'All' ? 'selected' : ''}>-- All ${label} --</option>`;

    values.forEach(value => {
        if (value && value.trim()) {
            html += `<option value="${value}" ${currentActive === value ? 'selected' : ''}>${value}</option>`;
        }
    });
    html += `</select></div>`;
    return html;
}

function renderFilters(data) {
    filtersContainer.innerHTML = '';
    const dayData = data.filter(item => item[dateHeader] === currentDay);
    const staffValues = getUniqueValues(dayData, staffHeader);
    const groupValues = getUniqueValues(dayData, groupHeader);

    let filterHtml = '<div class="flex flex-col md:flex-row w-full gap-4">';
    if (isStaffMode && staffValues.length > 0) {
        filterHtml += createDropdown('staff', 'Staff Allocation', staffValues);
    }
    if (groupValues.length > 0) {
        filterHtml += createDropdown('group', 'Group Applicable', groupValues);
    }
    filterHtml += '</div>';
    filtersContainer.innerHTML = filterHtml;
}

function renderContent(day) {
    let dayData = itineraryData.filter(item => item[dateHeader] === day);
    const filteredData = filterData(dayData);
    const showStaffLogistics = isStaffMode;

    if (filteredData.length === 0) {
        contentContainer.innerHTML = `<p class="text-center text-gray-500 font-semibold p-8">No activities scheduled for "${day}".</p>`;
        return;
    }

    let timelineHtml = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">${day} Schedule (${showStaffLogistics ? 'Staff View' : 'Student View'})</h2>
        <div class="space-y-8 p-4 border-l border-gray-200">`;

    filteredData.forEach((item, index) => {
        if (!item[activityHeader] || item[activityHeader].trim() === '') return;

        const time = item[timeHeader] || 'Time TBD';
        const activity = item[activityHeader] || 'Unknown Activity';
        const location = item[locationHeader];
        const staffLogistics = (item[detailsHeader] || '').trim();
        const extraDetails = (item[extraDetailsHeader] || '').trim();
        const staff = item[staffHeader] || '';
        const group = item[groupHeader] || '';
        const activityId = `${day.replace(/[^a-zA-Z0-9]/g, '')}-${index}`;
        const hasExtraDetailsContent = extraDetails.length > 0;

        timelineHtml += `
            <div class="timeline-item relative group pb-8 last:pb-0">
                <div class="timeline-dot"></div>
                <div class="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-md transition duration-300 group-hover:shadow-lg">
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between">
                        <div class="text-lg font-mono text-emerald-600 sm:w-1/4 mb-2 sm:mb-0">${time}</div>
                        <div class="sm:w-3/4">
                            <h3 class="text-xl font-semibold text-gray-900 mb-1">${activity}</h3>
                            ${location ? `<p class="text-sm text-gray-500 mb-2 flex items-center">
                                <svg class="w-4 h-4 mr-1 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                                ${location}</p>` : ''}
                            <div class="flex flex-wrap gap-2 mt-2">
                                ${staff && showStaffLogistics ? `<span class="px-3 py-1 text-xs font-semibold text-sky-700 bg-sky-100 rounded-full">Staff: ${staff}</span>` : ''}
                                ${group ? `<span class="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">Group: ${group}</span>` : ''}
                            </div>
                            ${staffLogistics && showStaffLogistics ? `<p class="text-base text-gray-700 mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <span class="font-medium text-gray-600">Staff Logistics:</span> ${staffLogistics.replace(/\n/g, '<br>')}</p>` : ''}
                            ${hasExtraDetailsContent ? `
                                <button id="details-button-${activityId}" onclick="window.toggleDetails('${activityId}')"
                                    class="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm transition duration-150 bg-emerald-500 hover:bg-emerald-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2">
                                    Further Details
                                    <svg class="w-4 h-4 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </button>` : `
                                <button disabled class="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full bg-gray-200 text-gray-500 cursor-not-allowed">
                                    Further Details</button>`}
                            <div id="details-content-${activityId}" class="further-details-content">
                                <div class="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <span class="font-bold text-blue-700 block mb-1">Further Details:</span>
                                    ${extraDetails.replace(/\n/g, '<br>')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    timelineHtml += `</div>`;
    contentContainer.innerHTML = timelineHtml;
    renderFilters(itineraryData);
}

// --- Data Fetching ---
async function fetchDataWithRetry(url, maxRetries = 5, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            if (!text || text.trim().length === 0) throw new Error("Empty data received");
            console.log(`✅ Data fetch successful on attempt ${i + 1}`);
            return text;
        } catch (error) {
            console.error(`❌ Attempt ${i + 1} failed: ${error.message}`);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

async function loadItineraryData() {
    showLoading(true);

    try {
        const csvText = await fetchDataWithRetry(LIVE_CSV_URL);
        itineraryData = parseCSV(csvText);

        if (itineraryData.length === 0) {
            throw new Error("Empty data after parsing");
        }

        const errorBanner = document.getElementById('data-error-banner');
        if (errorBanner) errorBanner.remove();

        lastUpdatedElement.textContent = `Last data sync: ${new Date().toLocaleTimeString()} (LIVE)`;
    } catch (error) {
        console.error('❌ Data loading failed:', error);
        contentContainer.innerHTML = `
            <div id="data-error-banner" class="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-xl shadow-inner mt-8">
                <p class="font-bold text-xl mb-2">DATA ERROR</p>
                <p>Failed to fetch itinerary data from Google Sheets.</p>
                <p class="mt-2 text-sm">Error: ${error.message}</p>
                <p class="mt-2 text-xs italic">Check browser console (F12) for details.</p>
            </div>`;
        lastUpdatedElement.textContent = `Last data sync: FAILED`;
        itineraryData = [];
        return;
    } finally {
        determineHeaders(itineraryData);
        renderTabs(itineraryData);
        showLoading(false);
    }
}
