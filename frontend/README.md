# SpotYourVibe Frontend

A modern React + TypeScript event management platform frontend built with Vite, Tailwind CSS, and React Router — part of the SpotYourVibe ecosystem.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create `.env.local` file in the frontend directory:
```bash
VITE_API_URL=http://localhost:5000/api
```

### Running the Development Server

```bash
npm run dev
```

The application will start on **http://localhost:5173**

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ConfirmModal.tsx
│   │   ├── Footer.tsx
│   │   ├── LocationPicker.tsx     # Map-based venue picker (Leaflet)
│   │   ├── Navigation.tsx
│   │   ├── NotificationsDropdown.tsx
│   │   ├── OrganizerRequiredModal.tsx
│   │   ├── SeatMap.tsx            # Interactive seat selection
│   │   └── Toaster.tsx
│   ├── contexts/                  # React Context for state management
│   │   └── AuthContext.tsx
│   ├── lib/                       # Utility libraries
│   │   └── api.ts                 # API request helper
│   ├── pages/                     # Page components for each route
│   │   ├── LandingPage.tsx
│   │   ├── BrowseEvents.tsx
│   │   ├── EventDetail.tsx
│   │   ├── Checkout.tsx
│   │   ├── Confirmation.tsx
│   │   ├── UserDashboard.tsx
│   │   ├── OrganizerDashboard.tsx
│   │   ├── CreateEvent.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── TermsPage.tsx
│   ├── App.tsx                    # Main app component with routes
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global styles
├── public/                        # Static assets
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## 🎨 Features

- **Browse Events** - Explore and discover upcoming events with filtering
- **Event Details** - View detailed information with lineup, images, and seating
- **User Dashboard** - Manage bookings, profile, password, and notifications
- **Organizer Dashboard** - Create/manage events with analytics and revenue tracking
- **Admin Dashboard** - User management, event moderation, venue/category CRUD
- **Event Creation** - Create events with images, seat maps, and venue selection
- **Seat Selection** - Interactive seat map for assigned seating events
- **PDF Tickets** - Generate and download PDF tickets for bookings
- **Comments & Reviews** - Leave and manage comments on events
- **Real-time Notifications** - Stay updated on bookings and event changes
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Authentication** - Secure login, signup, and password recovery

## 🔗 API Connection

The frontend connects to the backend API using axios. The API base URL is configured via the `VITE_API_URL` environment variable.

Default: `http://localhost:5000/api`

## 📦 Key Dependencies

- **React 18** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Framer Motion** - Animation library
- **Recharts** - Data visualization
- **Leaflet** - Interactive maps for venue location
- **jsPDF** - PDF ticket generation
- **react-datepicker** - Date picker component

## 🛠️ Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`:
```tsx
<Route path="/your-route" element={<YourPage />} />
```

### Using the Auth Context

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // Use auth methods and data
}
```

## 📝 Environment Variables

Create a `.env.local` file with:

```
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port.

### API Connection Issues
- Ensure the backend is running on `http://localhost:5000`
- Check that `VITE_API_URL` environment variable is correctly set
- Verify CORS is enabled on the backend

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 🚀 Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## 📄 License

MIT
