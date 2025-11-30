// Firebase Configuration
// Replace these values with your actual Firebase project credentials
// Get them from: Firebase Console > Project Settings > General > Your apps > Web app

export const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Google Sheets CSV URL
// Make sure your sheet is published: File > Share > Publish to web > Link tab > CSV
export const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRip3XVrk7VVTw8BTxJIFiEfr26jDhhuyMnGBDrB191c3wjVaz3DJ4ra4ZMrvXW0HbNAMl28rxMrqcB/pub?gid=1836297205&single=true&output=csv";

// Staff Assignment Configuration
export const MANDATORY_STAFF_ASSIGNMENTS = ['All Staff', 'UK Staff'];
