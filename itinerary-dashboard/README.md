# Gap Year Itinerary Dashboard

An interactive daily schedule and logistics viewer that pulls live data from Google Sheets.

## Features

- 📅 **Daily Schedule View** - Tab-based navigation through different days
- 👥 **Staff/Student Modes** - Different views for staff and students
- 🔒 **Staff Login** - Mock authentication system (can be replaced with real auth)
- 📊 **Live Data** - Pulls data directly from Google Sheets
- 🔄 **Real-time Updates** - Data refreshes from the published sheet
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Setup Instructions

### 1. Configure Firebase (Optional but recommended)

If you want to use real staff authentication instead of the mock login:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings > General > Your apps > Add app > Web
4. Copy the Firebase configuration
5. Open `config.js` and replace the placeholder values:

```javascript
export const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

6. Enable Authentication in Firebase Console:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" (for staff login)
   - Optionally enable "Anonymous" (public browsing before staff sign-in)

Once `firebaseConfig` is set, the login modal will use real Firebase email/password via `signInWithEmailAndPassword`. In standalone mode (no Firebase), the mock `staff@example.com / password` credentials remain available.

### 2. Configure Google Sheets

1. Open your Google Sheets itinerary
2. Make sure it has these columns:
   - `Day/Date` - The day/date label
   - `Time` - Time of activity
   - `Activity` - Activity name
   - `Location` - Location (optional)
   - `Logistics` - Staff-only logistics info
   - `Further Details` - Public details (collapsible)
   - `Staff Allocation` - Which staff members
   - `Group Applicable` - Which student group

3. **Publish your sheet as CSV:**
   - File > Share > Publish to web
   - Choose "Link" tab
   - Select the specific sheet/tab
   - Choose "Comma-separated values (.csv)"
   - Click "Publish"
   - Copy the URL

4. Open `config.js` and update the CSV URL:

```javascript
export const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=YOUR_GID&single=true&output=csv";
```

### 3. Run the Application

#### Option A: Simple Local Server (Recommended)

Using Python:
```powershell
cd itinerary-dashboard
python -m http.server 8000
```

Then open: `http://localhost:8000`

#### Option B: VS Code Live Server Extension

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

#### Option C: Direct File Access (May have CORS issues)

Simply open `index.html` in your browser. Note: Some features may not work due to CORS restrictions.

## Usage

### Student Mode (Default)
- View public schedule
- See "Further Details" for activities
- No staff logistics visible

### Staff Login
- Click "Staff Login" button
- Default credentials:
  - Email: `staff@example.com`
  - Password: `password`
- Staff see additional logistics information
- Can filter by staff allocation

### Customization

Edit `config.js` to customize:
- Firebase settings
- Google Sheets URL
- Staff assignment rules

## File Structure

```
itinerary-dashboard/
├── index.html          # Main HTML file
├── app.js             # Application logic
├── config.js          # Configuration (Firebase, URLs)
└── README.md          # This file
```

## Standalone Mode

The app works without Firebase if you don't configure it:
- Uses `sessionStorage` for mock authentication
- Staff login still works with mock credentials
- Perfect for testing or simple deployments

## Deployment

### Deploy to Netlify/Vercel

1. Push the `itinerary-dashboard` folder to a Git repository
2. Connect to Netlify or Vercel
3. Set build directory to `itinerary-dashboard`
4. No build command needed (static site)

### Deploy to GitHub Pages

1. Push to GitHub repository
2. Go to Settings > Pages
3. Select branch and `/itinerary-dashboard` folder
4. Save and get your URL

## Troubleshooting

**Loading screen stuck:**
- Check browser console (F12) for errors
- Verify Google Sheets is published as CSV
- Check if URL in `config.js` is correct

**Firebase errors:**
- Verify API key is correct in `config.js`
- Enable Anonymous authentication in Firebase Console
- Check Firebase project is active

**Data not showing:**
- Verify sheet has data in `Day/Date` column
- Check CSV URL is accessible
- Look for CORS errors in console

## Support

For issues or questions, check the browser console (F12) for detailed error messages.
