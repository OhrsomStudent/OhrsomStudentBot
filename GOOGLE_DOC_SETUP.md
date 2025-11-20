# Google Doc FAQ Setup

Your bot now supports fetching FAQ content from a public Google Doc export link. This allows you to update the FAQ in Google Docs without redeploying the site.

## How to Set Up

### 1. Make Your Google Doc Public
1. Open your FAQ Google Doc
2. Click **Share** (top right)
3. Change access to **Anyone with the link** → **Viewer**
4. Copy the document URL (it will look like: `https://docs.google.com/document/d/DOCUMENT_ID/edit`)

### 2. Get the Export Link
Convert your Google Doc URL to a plain text export URL:

**Original URL:**
```
https://docs.google.com/document/d/DOCUMENT_ID/edit
```

**Export URL (use this):**
```
https://docs.google.com/document/d/DOCUMENT_ID/export?format=txt
```

Just replace `DOCUMENT_ID` with your actual document ID from the URL.

### 3. Add to Netlify Environment Variables
1. Go to your Netlify dashboard
2. Navigate to: **Site Settings** → **Environment Variables**
3. Click **Add a variable**
4. Set:
   - **Key:** `FAQ_URL`
   - **Value:** Your export URL (e.g., `https://docs.google.com/document/d/DOCUMENT_ID/export?format=txt`)
5. Click **Save**
6. Redeploy your site (or wait for next automatic deploy)

## How It Works

- **Cache:** The FAQ is fetched from Google Docs and cached for 10 minutes
- **Auto-refresh:** After 10 minutes, the next user request will fetch the latest version
- **Fallback:** If Google Docs is unavailable, the bot falls back to the local `faq.txt` file
- **No redeployment needed:** Update your Google Doc anytime, and changes will appear within 10 minutes

## Testing

After setting `FAQ_URL`:
1. Update your Google Doc FAQ
2. Wait ~10 minutes (for cache to expire)
3. Ask the bot a question - it should use the updated FAQ

## Optional: Skip Google Doc Integration

If you don't set `FAQ_URL` in Netlify, the bot will continue using the local `faq.txt` file (current behavior).
