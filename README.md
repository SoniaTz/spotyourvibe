# SpotYourVibe - Event Management System

A full-stack event management and ticketing platform built with React, Express.js, Prisma, and PostgreSQL. Create, manage, and book events with seat selection, analytics, comments, and real-time notifications.

> 🌐 **Live Demo**: [https://www.spotyourvibe.com](https://www.spotyourvibe.com)

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Live Demo](#live-demo)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Running Both Frontend & Backend](#running-both-frontend--backend)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Troubleshooting](#troubleshooting)

## Overview

SpotYourVibe is a comprehensive event management platform that allows users to:
- Browse and discover events with filtering and search
- Create and manage events (as organizers) with venue and category selection
- Book tickets with interactive seat map selection
- Leave comments and reviews on events
- Generate and download PDF tickets
- Access personalized dashboards
- View real-time notifications
- Perform administrative functions with venue/category management

The platform supports four user roles: **User**, **Organizer**, **Admin**, and **SuperAdmin**, each with different capabilities and access levels.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Framer Motion** - Animations
- **Leaflet** - Interactive maps for venue locations
- **jsPDF** - PDF ticket generation
- **react-datepicker** - Date picker component

### Backend
- **Node.js & Express** - Server framework
- **Prisma** - ORM
- **PostgreSQL** - Database (production)
- **SQLite** - Database (development fallback)
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Zod** - Data validation

## Live Demo

The application is deployed and accessible at:

| Service | URL | Hosting |
|---------|-----|---------|
| **Frontend** | [https://www.spotyourvibe.com](https://www.spotyourvibe.com) | Vercel |
| **Backend API** | [https://spotyourvibe-api.onrender.com](https://spotyourvibe-api.onrender.com) | Render |
| **Health Check** | [https://spotyourvibe-api.onrender.com/health](https://spotyourvibe-api.onrender.com/health) | Render |

### Demo Credentials

After running the seed script, you can log in with:
- **SuperAdmin**: `info@spotyourvibe.com` / `superadmin123`
- **Admin**: `admin@spotyourvibe.com` / `admin123`
- **Organizer**: `organizer@spotyourvibe.com` / `organizer123`
- **User**: `user@spotyourvibe.com` / `user123`

## Project Structure

```
spotyourvibe/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LocationPicker.tsx   # Map-based venue picker (Leaflet)
│   │   │   ├── Navigation.tsx
│   │   │   ├── NotificationsDropdown.tsx
│   │   │   ├── OrganizerRequiredModal.tsx
│   │   │   ├── SeatMap.tsx          # Interactive seat selection
│   │   │   └── Toaster.tsx
│   │   ├── contexts/         # React contexts (Auth)
│   │   ├── lib/              # Utilities and helpers
│   │   │   ├── api.ts              # Fetch API client
│   │   │   ├── fontBase64.ts       # Embedded fonts for PDF
│   │   │   ├── generateTicketPdf.ts # PDF ticket generation
│   │   │   └── utils.ts            # Utility functions
│   │   ├── pages/            # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── BrowseEvents.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── Confirmation.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── BecomeOrganizer.tsx
│   │   │   ├── OrganizerDashboard.tsx
│   │   │   ├── CreateEvent.tsx
│   │   │   ├── EditEvent.tsx
│   │   │   ├── EventAnalytics.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── TermsPage.tsx
│   │   ├── App.tsx           # Main app component with routes
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── server.js         # Express setup and route mounting
│   │   ├── config/           # Configuration (Multer setup)
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API routes
│   │   ├── middlewares/      # Auth, RBAC, error handling
│   │   ├── validators/       # Input validation (Zod schemas)
│   │   └── utils/            # Utility functions
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.js           # Database seed data
│   │   └── migrations/       # DB migrations
│   ├── uploads/              # Uploaded files (event images, documents)
│   ├── .env                  # Environment variables
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── package.json              # Root package.json (NPM workspaces)
└── vite.config.js            # Root Vite config
```

## Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **PostgreSQL** (for production-like environment) or SQLite (development)

### Option 1: Run Everything Together (Recommended)

1. **Install root dependencies:**
```bash
npm install
```

2. **Create backend `.env` file:**

For **SQLite** (easiest for local development):
```bash
cd backend
cat > .env << EOF
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-change-this-in-production
DATABASE_URL=file:./dev.db
EOF
cd ..
```

For **PostgreSQL** (matches production):
```bash
cd backend
cat > .env << EOF
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-change-this-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spotyourvibe
UPLOAD_DIR=./uploads
EOF
cd ..
```

3. **Create frontend `.env.local` file:**
```bash
cd frontend
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000/api
EOF
cd ..
```

4. **Initialize the database:**
```bash
# For SQLite:
cd backend
npm run prisma:migrate
npm run seed
cd ..

# For PostgreSQL:
cd backend
npx prisma db push
npm run seed
cd ..
```

5. **Run both servers:**
```bash
npm run dev
```

Both servers will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### Option 2: Run Frontend and Backend Separately

#### Terminal 1 - Backend
```bash
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev
# API will be at http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# App will be at http://localhost:5173
```

## Running Both Frontend & Backend

### Using the Root Package.json (NPM Workspaces)

From the root directory, you have these commands:

```bash
# Run both frontend and backend
npm run dev

# Run only frontend
npm run dev:frontend

# Run only backend
npm run dev:backend

# Build frontend only
npm run build:frontend

# Lint frontend code
npm run lint
```

## Environment Setup

### Backend `.env` File

Create `backend/.env` (see `backend/.env.example`):

For **SQLite** (development):
```
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-key-change-in-production
DATABASE_URL=file:./dev.db
```

For **PostgreSQL** (production):
```
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-key-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/spotyourvibe
UPLOAD_DIR=./uploads
```

### Frontend `.env.local` File

Create `frontend/.env.local` (see `frontend/.env.example`):
```
VITE_API_URL=http://localhost:5000/api
```

## Deployment

### Backend (Render)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma migrate deploy && node src/server.js`
5. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - `DATABASE_URL` = your Render PostgreSQL connection string
   - `JWT_SECRET` = a strong random secret
   - `UPLOAD_DIR=/tmp/uploads`
6. Create a **Render PostgreSQL** database and copy the Internal Database URL
7. Deploy

### Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL=https://your-render-app.onrender.com/api`
5. Deploy

> ⚠️ **Important**: Make sure `FRONTEND_URL` on Render has **no trailing slash**, and `VITE_API_URL` on Vercel **ends with `/api`**.

## Features

### User Features
- Browse and search events with category/venue filtering
- View event details with images, lineup, and important info
- Book tickets with interactive seat map selection (assigned seating)
- General admission or assigned seating support
- Download PDF tickets for bookings
- Manage bookings (view, cancel)
- User profile with editing capabilities
- Change password with strength validation
- Delete account
- Real-time notifications
- Leave comments and reviews on events
- Phone number with country code selector
- Forgot password via security questions

### Organizer Features
- Create and manage events with venue and category selection
- Upload event images
- Configure seating type (general / assigned) with row/column layout
- Set important info bullet points and performer lineup
- Configure max tickets per order
- Interactive map-based venue location picker
- Per-event analytics dashboard with charts
- Revenue tracking and booking trends
- Attendee management
- Cancel bookings for their events
- Create and manage venues and categories
- Organizer application with admin approval workflow

### Admin Features
- User management (view, edit roles, delete)
- Event moderation (approve/reject)
- System-wide analytics dashboard with stats
- Revenue reports
- Organizer application approval workflow (approve/reject)
- Venue CRUD management
- Category CRUD management
- Booking management (view all, delete)
- SuperAdmin: promote/demote admin users

### Authentication & Security
- JWT-based authentication with role-based access control (RBAC)
- Four roles: User, Organizer, Admin, SuperAdmin
- Secure password hashing (bcrypt)
- Protected API endpoints with middleware
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Email validation
- Phone number validation (10 digits + country code)
- Security question-based password reset
- Optional auth for public routes

### UI/UX Features
- Beautiful, modern design with Tailwind CSS
- Smooth animations with Framer Motion
- Toast notifications (Sonner)
- Responsive design (mobile-friendly)
- Custom confirmation modals (no browser alerts)
- Real-time notifications dropdown
- Loading states and spinners
- Image fallback handling
- Interactive seat map for assigned seating
- Leaflet map for venue location display and selection
- PDF ticket generation and download
- Date picker for event creation/editing

### Notifications System
- Real-time notification dropdown
- New booking notifications (for organizers)
- Booking cancellation notifications (for users)
- Admin notifications for cancellations
- Event approval/rejected notifications
- Organizer application approval/rejected notifications
- Mark as read / mark all as read
- Delete notifications

### Comments System
- Users can leave comments on event detail pages
- Edit and delete own comments
- Organizers and admins can delete any comment

## API Documentation

### Health Check
```
GET http://localhost:5000/health
```

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | User registration | No |
| POST | `/login` | User login | No |
| GET | `/me` | Get current user | Yes |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PUT | `/change-password` | Change password | Yes |
| GET | `/security-question` | Get security question for reset | No |
| POST | `/reset-password` | Reset password via security answer | No |
| DELETE | `/delete-account` | Delete user account | Yes |

### Event Routes (`/api/events`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all approved events (optional auth for filtering) | Optional |
| GET | `/:id` | Get event details | Optional |
| POST | `/` | Create event (organizer, with image upload) | Yes (Organizer) |
| PUT | `/:id` | Update event (with image upload) | Yes (Organizer) |
| DELETE | `/:id` | Delete event | Yes (Organizer) |
| GET | `/my/events` | Get organizer's events | Yes (Organizer) |

### Booking Routes (`/api/bookings`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/seats/:eventId` | Get seat map for an event | No |
| POST | `/` | Create booking with seat selection | Yes (User) |
| GET | `/my` | Get user's bookings | Yes (User) |
| GET | `/:id` | Get booking details | Yes (User) |
| DELETE | `/:id` | Cancel booking | Yes (User) |

### Comment Routes (`/api/comments`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/events/:eventId` | Get comments for an event | Optional |
| POST | `/events/:eventId` | Create a comment | Yes (User) |
| PUT | `/:id` | Update a comment (owner/organizer/admin) | Yes |
| DELETE | `/:id` | Delete a comment (owner/organizer/admin) | Yes |

### Analytics Routes (`/api/analytics`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Organizer dashboard analytics | Yes (Organizer) |
| GET | `/events/:id` | Per-event analytics | Yes (Organizer) |

### Organizer Routes (`/api/organizer`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/apply` | Apply to become an organizer (with document upload) | Yes |
| GET | `/my-application` | Get own application status | Yes |
| POST | `/venues` | Create a venue | Yes (Organizer) |
| GET | `/venues` | List all venues | Yes (Organizer) |
| PUT | `/venues/:id` | Update a venue | Yes (Organizer) |
| POST | `/categories` | Create a category | Yes (Organizer) |
| GET | `/categories` | List all categories | Yes (Organizer) |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats` | Dashboard statistics | Yes (Admin) |
| GET | `/organizer-applications` | List all organizer applications | Yes (Admin) |
| PATCH | `/organizer-applications/:id/approve` | Approve application | Yes (Admin) |
| PATCH | `/organizer-applications/:id/reject` | Reject application | Yes (Admin) |
| GET | `/events` | List all events | Yes (Admin) |
| PATCH | `/events/:id/approve` | Approve event | Yes (Admin) |
| PATCH | `/events/:id/reject` | Reject event | Yes (Admin) |
| DELETE | `/events/:id` | Delete event | Yes (Admin) |
| GET | `/users` | List all users | Yes (Admin) |
| PUT | `/users/:id` | Update user | Yes (Admin) |
| DELETE | `/users/:id` | Delete user | Yes (Admin) |
| GET | `/bookings` | List all bookings | Yes (Admin) |
| DELETE | `/bookings/:id` | Delete booking | Yes (Admin) |
| POST | `/venues` | Create venue | Yes (Admin) |
| GET | `/venues` | List all venues | Yes (Admin) |
| PUT | `/venues/:id` | Update venue | Yes (Admin) |
| DELETE | `/venues/:id` | Delete venue | Yes (Admin) |
| POST | `/categories` | Create category | Yes (Admin) |
| GET | `/categories` | List all categories | Yes (Admin) |
| PUT | `/categories/:id` | Update category | Yes (Admin) |
| DELETE | `/categories/:id` | Delete category | Yes (Admin) |
| POST | `/users/:id/promote` | Promote user to admin | Yes (SuperAdmin) |
| POST | `/users/:id/demote` | Demote admin to user | Yes (SuperAdmin) |

### Notification Routes (`/api/notifications`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get user's notifications | Yes |
| PUT | `/read-all` | Mark all as read | Yes |
| PUT | `/:id/read` | Mark one as read | Yes |
| DELETE | `/:id` | Delete a notification | Yes |

### Public Routes (`/api/public`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | List all categories | No |
| GET | `/venues` | List all venues | No |
| GET | `/contact` | Get contact information | No |

For complete API documentation, see [backend/README.md](backend/README.md)

## Database

The backend uses **PostgreSQL** in production (Render) and can use **SQLite** for local development.

### Local Development with SQLite

1. **Initialize database:**
```bash
cd backend
npm run prisma:migrate
```

2. **(Optional) Seed with sample data:**
```bash
npm run seed
```

3. **View database in Prisma Studio:**
```bash
npm run prisma:studio
```
This opens a GUI at `http://localhost:5555`

### Local Development with PostgreSQL

1. Make sure PostgreSQL is running locally
2. Update `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spotyourvibe
```
3. Push the schema:
```bash
npx prisma db push
```
4. Seed:
```bash
npm run seed
```

### Production (Render + PostgreSQL)

The database is managed through Render PostgreSQL. Migrations run automatically on deploy via the start command:
```
npx prisma migrate deploy && node src/server.js
```

### Database Schema

Key models:
- **User** - Users with roles (USER, ORGANIZER, ADMIN), security questions for password reset
- **Event** - Events with status (PENDING, APPROVED, REJECTED), seating config, lineup, important info
- **Booking** - Event bookings with seat reservations and contact info
- **Seat** - Individual seats for assigned seating events (available/held/booked)
- **Comment** - User comments and reviews on events
- **Notification** - User notifications with types (EVENT_APPROVED, NEW_BOOKING, etc.)
- **OrganizerApplication** - Organizer approval workflow with document uploads
- **Venue** - Event venues with address, city, and capacity
- **Category** - Event categories

## Troubleshooting

### Port Already in Use

**Port 5173 (Frontend):**
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Port 5000 (Backend):**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend

1. Ensure backend is running on port 5000
2. Check `VITE_API_URL` is set correctly in `frontend/.env.local`
3. Verify CORS is enabled in backend (check `FRONTEND_URL` in backend `.env`)

### Database Reset

**SQLite:**
```bash
cd backend
rm prisma/dev.db
npm run prisma:migrate
npm run seed
```

**PostgreSQL:**
```bash
cd backend
npx prisma migrate reset --force
npm run seed
```

### Module Not Found

```bash
# Clear and reinstall frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear and reinstall backend dependencies
cd ../backend
rm -rf node_modules package-lock.json
npm install
```

### Dependencies Conflict

If you see ERESOLVE errors during frontend installation:
```bash
cd frontend
npm install --legacy-peer-deps
```

## Installing Dependencies

### Frontend Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

### Backend Dependencies
```bash
cd backend
npm install
```

### Root Dependencies
```bash
npm install
```

## Production Build

### Build Frontend
```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

### Deploy Backend
```bash
cd backend
NODE_ENV=production npm start
```

## Documentation

- **Frontend**: See [frontend/README.md](frontend/README.md)
- **Backend**: See [backend/README.md](backend/README.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create a pull request

## Project Status

- **Live**: [https://www.spotyourvibe.com](https://www.spotyourvibe.com)
- **Backend API**: [https://spotyourvibe-api.onrender.com](https://spotyourvibe-api.onrender.com)
- **Backend** - Fully implemented with all APIs (auth, events, bookings, comments, analytics, notifications, admin, organizer)
- **Frontend** - All pages and components created (17 pages, 8 components)
- **Database** - Prisma schema and migrations complete (9 models) — PostgreSQL in production
- **Authentication** - JWT with security questions for password reset
- **Styling** - Tailwind CSS configured
- **Notifications** - Real-time notification system
- **Validation** - Zod backend + frontend validation
- **Comments** - Full CRUD comment system on events
- **Seat Maps** - Interactive seat selection for assigned seating events
- **Analytics** - Organizer dashboard and per-event analytics with charts
- **PDF Tickets** - Generate and download PDF tickets via jsPDF
- **Maps** - Leaflet integration for venue location display and selection
- **Roles** - User, Organizer, Admin, SuperAdmin with RBAC

## License

MIT

---

Ready to start developing?

1. Clone or extract the project
2. Follow the **Quick Start** section above
3. Visit http://localhost:5173 in your browser
4. The API will be running at http://localhost:5000
5. Or check out the live version at [https://www.spotyourvibe.com](https://www.spotyourvibe.com)
