# SETUP GUIDE - Cold Storage Management System

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Create a Firestore database (test mode is fine for development)
3. Get your Firebase config from Project Settings
4. Open `src/firebase.js` and replace:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",           // from Firebase
     authDomain: "YOUR_AUTH_DOMAIN",   // from Firebase
     projectId: "YOUR_PROJECT_ID",     // from Firebase
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Step 3: Start Development Server
```bash
npm start
```
This opens http://localhost:3000 automatically.

## What to Test First

1. **Add a Farmer**
   - Click "Add New Farmer" button
   - Fill in name (required), phone & village (optional)
   - Submit

2. **Add a Season**
   - Click on farmer's name
   - Click "Add Season"
   - Enter season name (e.g., "2025-26")
   - Enter rent per bag (e.g., "50")

3. **Add Transactions**
   - Click "Add Transaction"
   - Try each type:
     - **Deposit**: 100 bags
     - **Withdrawal**: 30 bags
     - **Payment**: ₹2500
   - View calculations update

4. **Export & Print**
   - Click "Export Excel" to download CSV
   - Click "Print" to view PDF layout

5. **Settings**
   - Go to "Settings" (⚙️ button)
   - Change storage capacity (e.g., 5000)
   - Change rent per bag (e.g., 50)
   - Save and go back to dashboard

## Project Structure

```
cold_storage_web/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Full page components
│   ├── utils/              # Utilities & services
│   ├── App.jsx             # Main app (routing logic)
│   ├── index.js            # React entry point
│   ├── index.css           # Global styles
│   └── firebase.js         # Firebase config
├── public/
│   └── index.html          # HTML template
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind config
└── README.md              # Full documentation
```

## Key Features Already Implemented

✅ Farmer management (add, search, delete)
✅ Multi-season support
✅ Three types of transactions
✅ Dynamic calculations (no stored totals)
✅ Excel export
✅ PDF print
✅ Settings management
✅ Mobile responsive design
✅ Firestore integration
✅ Error handling

## Common Issues & Solutions

### Firebase Not Connecting
**Problem**: Data not saving
**Solution**:
1. Check Firebase config in `src/firebase.js`
2. Verify Firestore database is created
3. Check security rules allow read/write:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

### Styles Not Showing
**Problem**: Page looks unstyled
**Solution**:
1. Run `npm install` again
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart dev server: Ctrl+C, then `npm start`

### Port 3000 Already in Use
**Problem**: "Port 3000 is already in use"
**Solution**:
```bash
# Windows: Kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux: Kill process
lsof -ti:3000 | xargs kill -9
```

## What Happens Next

The application will:
1. Load farmers from Firestore database
2. Show them on dashboard with search
3. Let you manage seasons per farmer
4. Track all transactions dynamically
5. Calculate totals in real-time
6. Export and print reports

## Build for Production

```bash
npm run build
```

This creates optimized build in `build/` folder. Deploy it to:
- Vercel (recommended)
- Netlify
- Firebase Hosting
- Any static host (GitHub Pages, etc.)

## Need Help?

1. Check README.md for full documentation
2. Check components JSDoc comments
3. Check console (F12) for error messages
4. Check .github/copilot-instructions.md for dev guidelines

## Next Steps

1. ✅ Run `npm install`
2. ✅ Setup Firebase config
3. ✅ Run `npm start`
4. ✅ Test basic workflow
5. 📝 Customize as needed:
   - Change colors in tailwind.config.js
   - Add more fields to farmers
   - Add custom validations
   - Integrate payment gateway

---

**Happy farming! 🌾**
