# 🌾 Cold Storage Management System

A full-stack web application for managing farmer accounts and storage records with a focus on mobile-first responsive design.

## ✨ Features

### Dashboard
- 👥 View all farmers with real-time search
- 📊 Display statistics (total farmers, bags stored, remaining capacity)
- ➕ Add new farmers quickly
- 🗑️ Delete farmer accounts

### Farmer Ledger
- 🔄 Multi-season support for each farmer
- 💼 Transaction management (deposits, withdrawals, payments)
- 📈 Dynamic calculations (no stored totals)
- 📋 Comprehensive ledger summary

### Transaction System
Three transaction types:
1. **Deposit**: Add bags to storage
2. **Withdrawal**: Remove bags from storage (with optional payment)
3. **Payment**: Direct payment without withdrawal

### Export & Print
- 📊 Export ledger to Excel (.xlsx)
- 🖨️ Print ledger as PDF
- 📱 Mobile-optimized print layout

### Settings
- ⚙️ Configure total storage capacity
- 💰 Set default rent per bag
- 🎯 Customizable per season

## 🏗️ Project Structure

```
cold_storage_web/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── commonComponents.jsx      # Reusable UI components
│   │   ├── farmerComponents.jsx      # Farmer-specific components
│   │   └── transactionComponents.jsx # Transaction-specific components
│   ├── pages/
│   │   ├── Dashboard.jsx             # Main dashboard page
│   │   ├── FarmerLedger.jsx          # Farmer ledger page
│   │   └── Settings.jsx              # Settings page
│   ├── utils/
│   │   ├── calculations.js           # Business logic & calculations
│   │   ├── firebaseService.js        # Firebase database operations
│   │   └── exportUtils.js            # Export & print utilities
│   ├── firebase.js                   # Firebase configuration
│   ├── App.jsx                       # Main app component
│   ├── index.js                      # React entry point
│   └── index.css                     # Global styles & Tailwind
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 📊 Database Structure

### Firestore Collections

```
farmers/
├── {farmerId}
│   ├── name
│   ├── phone
│   ├── village
│   ├── createdAt
│   └── seasons/
│       └── {seasonId}
│           ├── seasonName
│           ├── rentPerBag
│           ├── createdAt
│           └── transactions/
│               └── {transactionId}
│                   ├── type (deposit|withdrawal|payment)
│                   ├── bags
│                   ├── payment (for withdrawal)
│                   ├── amount (for payment)
│                   ├── date
│                   └── note
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account and project

### Installation

1. **Clone the repository** (if using Git)
   ```bash
   cd cold_storage_web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Go to `src/firebase.js`
   - Replace Firebase config with your project credentials
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px and up)
- 📱 Tablets (768px and up)
- 🖥️ Desktop (1024px and up)

Features:
- Mobile-first approach
- Touch-friendly buttons and inputs
- Card-based layout for mobile
- Collapsible sections
- Optimized fonts and spacing

## 🧮 Calculation Logic

**Important**: All totals are calculated dynamically, NOT stored in the database.

For each farmer-season:
- **Total Deposited** = Sum of all "deposit" transactions
- **Total Withdrawn** = Sum of all "withdrawal" transactions
- **Remaining Bags** = Total Deposited - Total Withdrawn
- **Total Rent** = Total Deposited × Rent per Bag
- **Total Paid** = Sum of payment transactions + Sum of withdrawal payments
- **Pending Amount** = Total Rent - Total Paid

## 🛠️ Technologies Used

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Export**: XLSX (Excel), html2pdf (PDF)
- **Build Tool**: Create React App

## 📦 Available Scripts

### Development
```bash
npm start
```
Runs the app in development mode.

### Build for Production
```bash
npm run build
```
Creates optimized production build.

### Run Tests
```bash
npm test
```
Runs the test suite.

## 🎨 UI Components

### Reusable Components
- `Header` - Page header with back button
- `Card` - Content card container
- `Button` - Styled button with variants
- `Input` - Text input field
- `TextArea` - Multi-line input
- `Select` - Dropdown select
- `Modal` - Dialog component
- `LoadingSpinner` - Loading indicator
- `EmptyState` - Empty state display
- `StatCard` - Statistics display

### Farmer Components
- `FarmerSearch` - Search farmers by name
- `FarmerCard` - Farmer info display
- `AddFarmerForm` - Form to add farmer
- `FarmerStats` - Dashboard statistics

### Transaction Components
- `TransactionForm` - Form to add/edit transactions
- `TransactionList` - List of transactions
- `LedgerSummary` - Ledger summary statistics
- `SeasonCard` - Season info display

## 📋 Features Explained

### 1. Real-time Search
Search farmers by name with instant filtering (no database call needed, filters client-side).

### 2. Multi-Season Support
Each farmer can have multiple seasons. Each season has its own rental rate.

### 3. Flexible Transactions
- Deposit bags without payment
- Withdraw bags with optional payment
- Make direct payments anytime

### 4. Smart Calculations
All financial calculations are done dynamically based on transactions.

### 5. Export Functionality
- Export to Excel for external analysis
- Print as PDF for record keeping

### 6. Settings Management
- Configure storage capacity
- Set default rental rates
- Settings persist in localStorage

## 🔒 Data Persistence

### Local Storage
- `storageCapacity` - Maximum storage capacity
- `defaultRentPerBag` - Default rent per bag

### Firebase Firestore
- All farmer, season, and transaction data

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify Firebase config in `src/firebase.js`
- Check Firebase project is active
- Ensure Firestore database is created

### Missing Data on Refresh
- Check browser's Storage in DevTools
- Verify Firestore security rules allow read/write
- Check network tab for API errors

### Export Not Working
- Ensure browser allows file downloads
- Try a different browser if issue persists
- Check browser console for errors

## 📱 Mobile Optimization Tips

The app includes:
- Responsive breakpoints (sm, md, lg)
- Touch-friendly button sizes (48px minimum)
- Optimized modal behavior (slides up on mobile)
- Responsive grid layouts
- Mobile-first CSS approach

## 🚢 Deployment

### Deploy to Vercel (Recommended)
```bash
npm run build
# Deploy the build/ folder to Vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag and drop build/ folder to Netlify
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
npm run build
firebase login
firebase init hosting
firebase deploy
```

## 📝 License

This project is open source and available under MIT license.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## 📞 Support

For issues, questions, or suggestions, please create an issue in the repository.

---

**Made with ❤️ for Cold Storage Management**
