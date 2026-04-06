# Cold Storage Management System - Development Guide

## Project Overview
Full-stack web application for managing farmer cold storage accounts with React frontend and Firebase backend.

## Key Technologies
- **Frontend**: React 18 with Functional Components & Hooks
- **Styling**: Tailwind CSS (mobile-first, fully responsive)
- **Database**: Firebase Firestore
- **Export**: XLSX & html2pdf for reports

## Architecture

### Components Structure
```
components/
├── commonComponents.jsx      # Button, Card, Input, Modal, etc.
├── farmerComponents.jsx      # FarmerCard, FarmerSearch, AddFarmerForm
└── transactionComponents.jsx # TransactionForm, TransactionList, etc.
```

### Pages Structure
```
pages/
├── Dashboard.jsx    # Main dashboard with farmer list
├── FarmerLedger.jsx # Farmer ledger with transactions
└── Settings.jsx     # Configuration page
```

### Utilities Structure
```
utils/
├── calculations.js       # All business logic & formulas
├── firebaseService.js    # Firestore CRUD operations
└── exportUtils.js        # Excel & PDF export functions
```

## Database Schema

### Firestore Collections
```
farmers {farmerId}
  ├── name: string
  ├── phone: string (optional)
  ├── village: string (optional)
  ├── createdAt: timestamp
  └── seasons {seasonId}
      ├── seasonName: string
      ├── rentPerBag: number
      ├── createdAt: timestamp
      └── transactions {txnId}
          ├── type: "deposit" | "withdrawal" | "payment"
          ├── bags: number (for deposit/withdrawal)
          ├── payment: number (for withdrawal)
          ├── amount: number (for payment)
          ├── date: timestamp
          └── note: string
```

## Important Calculation Rules
- **Never store totals** - Always calculate dynamically
- Totals = sum of all transactions of that type
- Remaining Bags = Deposited - Withdrawn
- Total Rent = Deposited Bags × Rent Per Bag
- Pending = Total Rent - Total Paid

## Code Guidelines

### Component Development
1. Use functional components with hooks
2. Keep components focused and reusable
3. Export related components together from one file
4. Use Tailwind classes for styling
5. Include JSDoc comments for functions

### State Management
- Use useState for component-level state
- Use useEffect for side effects
- No Redux/Context needed for this app scope

### Firebase Operations
- All Firebase calls in `firebaseService.js`
- Use async/await pattern
- Add error handling (console.error + user alert)
- Query with orderBy for better UX

### Responsive Design
- Mobile-first approach
- Use Tailwind breakpoints (sm, md, lg, xl)
- Touch-friendly sizes: min 48px buttons
- Test on multiple viewports

## Development Workflow

### Adding a New Feature
1. Create component in `components/`
2. Add calculation logic to `utils/calculations.js`
3. Add Firebase operations to `utils/firebaseService.js`
4. Use component in appropriate page
5. Test on mobile & desktop

### Styling Guidelines
- Use Tailwind utility classes
- Responsive classes: `md:` for medium and up
- Colors: Blue for primary, green for success, red for danger
- Spacing: 4px baseline (use Tailwind scale)

### Error Handling
- Wrap Firebase calls in try/catch
- Show user-friendly error messages
- Log technical errors to console
- Always enable/disable loading state

## Setup for Development

1. Install dependencies: `npm install`
2. Configure Firebase in `src/firebase.js`
3. Start dev server: `npm start`
4. Build for production: `npm run build`

## Testing Checklist
- [ ] Mobile view (320px, 480px)
- [ ] Tablet view (768px)
- [ ] Desktop view (1024px+)
- [ ] Add farmer flow
- [ ] Add season flow
- [ ] Add all 3 transaction types
- [ ] Export to Excel
- [ ] Print as PDF
- [ ] Settings save/load
- [ ] Search functionality
- [ ] Delete confirmations

## Performance Considerations
- Avoid unnecessary re-renders
- Use useCallback for expensive functions
- Lazy load pages if needed
- Optimize bundle size

## Accessibility
- Use semantic HTML
- Add aria-labels to buttons
- Ensure color contrast ratio ≥ 4.5:1
- Keyboard navigation support
- Focus styles for all interactive elements

## Deployment
- Build: `npm run build`
- Test build locally: `npx serve -s build`
- Deploy to Vercel, Netlify, or Firebase Hosting
