# SpotYourVibe Backend

Express.js REST API for the SpotYourVibe event management system. Built with Prisma ORM, SQLite/PostgreSQL, JWT authentication, and role-based access control.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables by creating a `.env` file:
```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-change-this-in-production
DATABASE_URL=file:./dev.db
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. (Optional) Seed the database with sample data:
```bash
npm run seed
```

### Running the Development Server

```bash
npm run dev
```

The API will start on **http://localhost:5000**

### Available Scripts

- `npm run dev` - Start the development server with auto-reload
- `npm start` - Start the production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:generate` - Generate Prisma Client
- `npm run seed` - Seed database with sample data

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js                    # Express app setup
│   ├── config/
│   │   ├── database.js              # Prisma client configuration
│   │   └── multer.js                # File upload configuration
│   ├── controllers/                 # Request handlers
│   │   ├── authController.js        # Authentication logic
│   │   ├── eventController.js       # Event management
│   │   ├── bookingController.js     # Booking management
│   │   ├── organizerController.js   # Organizer features
│   │   └── adminController.js       # Admin features
│   ├── routes/                      # API endpoints
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── organizerRoutes.js
│   │   ├── adminRoutes.js
│   │   └── publicRoutes.js
│   ├── middlewares/                 # Express middleware
│   │   ├── auth.js                  # JWT authentication
│   │   ├── errorHandler.js          # Global error handling
│   │   └── roleCheck.js             # Role-based authorization
│   ├── validators/                  # Input validation (Zod)
│   │   ├── authValidator.js
│   │   ├── eventValidator.js
│   │   ├── bookingValidator.js
│   │   └── organizerValidator.js
│   └── utils/
│       └── jwt.js                   # JWT utility functions
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── seed.js                      # Database seeding script
│   ├── migrations/                  # Database migrations
│   └── dev.db                       # SQLite database file
├── uploads/                         # User-uploaded files
│   ├── documents/
│   └── events/
├── .env                            # Environment variables
├── package.json
└── README.md
```

## 🔑 Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (USER, ORGANIZER, ADMIN, SUPERADMIN)
- Secure password hashing with bcrypt
- Token refresh mechanism

### Event Management
- Create, read, update, delete events
- Event categories and filtering
- Event scheduling with date/time validation
- Event image uploads

### Booking System
- Purchase tickets for events
- Seat selection and management
- Booking confirmation and tracking
- Cancellation handling

### Organizer Features
- Dashboard with event analytics
- Revenue tracking
- Attendee management
- Event promotion tools

### Comments & Notifications
- Full CRUD comments/reviews on events
- Real-time notification system

### Admin Features
- User management
- Event moderation
- Revenue reports
- System analytics

### File Uploads
- Support for event images
- Document uploads for organizers
- Multer configuration for file handling

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (organizer)
- `PUT /api/events/:id` - Update event (organizer)
- `DELETE /api/events/:id` - Delete event (organizer)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Organizer
- `GET /api/organizer/dashboard` - Organizer dashboard data
- `GET /api/organizer/events` - Organizer's events
- `GET /api/organizer/revenue` - Revenue analytics

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/role` - Change user role
- `GET /api/admin/events` - Manage events
- `GET /api/admin/analytics` - System analytics

### Public
- `GET /api/public/events` - Public event listing
- `GET /api/public/events/:id` - Public event details

### Health Check
- `GET /health` - API health check

## 📦 Key Dependencies

- **Express** - Web framework
- **Prisma** - ORM and database management
- **SQLite** - Database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File upload middleware
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **zod** - TypeScript-first schema validation

## 🔐 Environment Variables

Create a `.env` file with:

```
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-key-change-in-production
DATABASE_URL=file:./dev.db
```

## 🗄️ Database

The backend uses **SQLite** with **Prisma** ORM for database management.

### Database Schema

Key models:
- **User** - User accounts with roles (USER, ORGANIZER, ADMIN)
- **Event** - Event information and details
- **Booking** - User bookings for events
- **Review** - User reviews for events
- **Organizer** - Organizer profiles and verification

### View Database

Open Prisma Studio:
```bash
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` where you can view and edit database records.

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Different permissions for different user roles
- **Password Hashing** - Bcrypt with salt rounds
- **CORS Protection** - Configured for frontend origin
- **Input Validation** - Zod schema validation
- **Error Handling** - Global error handler prevents sensitive info leakage

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows (find PID and kill)
```

### Database Issues
```bash
# Reset database
rm prisma/dev.db
npm run prisma:migrate
npm run seed
```

### JWT Authentication Failed
- Ensure `JWT_SECRET` is set in `.env`
- Check that the token is being sent in the Authorization header
- Verify token hasn't expired

### CORS Errors
- Check that `FRONTEND_URL` matches your frontend's actual URL
- Verify the frontend is making requests to the correct API endpoint

## 🚀 Production Deployment

1. Set appropriate environment variables:
```bash
NODE_ENV=production
JWT_SECRET=<secure-random-string>
FRONTEND_URL=<your-frontend-url>
```

2. Build and start:
```bash
npm start
```

3. Use a process manager like PM2:
```bash
pm2 start src/server.js --name "eventflow-api"
```

## 📝 API Response Format

All endpoints return JSON in this format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates database and tables)
npx prisma migrate dev --name init

# Seed database with sample data
npm run seed
```

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start at `http://localhost:5000`

---

## 📦 Database Schema

The SQLite database includes:

- **Users** - Authentication and role management
- **OrganizerApplications** - Organizer verification workflow
- **Events** - Event management with approval system
- **Bookings** - Seat reservations
- **Venues** - Event locations
- **Categories** - Event types

---

## 🔐 Authentication

### Test Accounts (created by seed script)

**Admin:**
- Email: `admin@spotyourvibe.com`
- Password: `admin123`

**Organizer (Verified):**
- Email: `organizer@spotyourvibe.com`
- Password: `organizer123`

**Regular User:**
- Email: `user@spotyourvibe.com`
- Password: `user123`

### How to Use JWT Authentication

Include JWT token in Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

---

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login and get JWT token
GET    /api/auth/me           - Get current user (requires auth)
```

### Events (Public)

```
GET    /api/events            - Get all approved events (with filters)
GET    /api/events/:id        - Get event by ID
```

Query parameters for filtering:
- `?search=keyword` - Search by title
- `?category=categoryId` - Filter by category
- `?venue=venueId` - Filter by venue
- `?startDate=2026-01-01` - Events starting after date
- `?endDate=2026-12-31` - Events starting before date
- `?availableOnly=true` - Only events with available seats

### Events (Organizer)

```
POST   /api/events            - Create new event (requires auth + verified organizer)
PUT    /api/events/:id        - Update event (requires auth + owner/admin)
DELETE /api/events/:id        - Delete event (requires auth + owner/admin)
GET    /api/events/my/events  - Get my events (requires auth + organizer)
```

### Bookings

```
POST   /api/bookings          - Create booking (requires auth + user role)
GET    /api/bookings/my       - Get my bookings (requires auth)
GET    /api/bookings/:id      - Get booking by ID (requires auth)
DELETE /api/bookings/:id      - Cancel booking (requires auth + owner/admin)
```

### Organizer Application

```
POST   /api/organizer/apply           - Submit organizer application (requires auth)
GET    /api/organizer/my-application  - Get my application status (requires auth)
```

### Public Data

```
GET    /api/public/categories - Get all categories
GET    /api/public/venues     - Get all venues
```

### Admin Panel

All admin routes require authentication and ADMIN role.

**Organizer Applications:**
```
GET    /api/admin/organizer-applications           - Get all applications
PATCH  /api/admin/organizer-applications/:id/approve
PATCH  /api/admin/organizer-applications/:id/reject
```

**Events:**
```
PATCH  /api/admin/events/:id/approve
PATCH  /api/admin/events/:id/reject
```

**Users:**
```
GET    /api/admin/users       - Get all users
PUT    /api/admin/users/:id   - Update user
DELETE /api/admin/users/:id   - Delete user
```

**Bookings:**
```
GET    /api/admin/bookings    - Get all bookings
```

**Venues:**
```
POST   /api/admin/venues      - Create venue
GET    /api/admin/venues      - Get all venues
PUT    /api/admin/venues/:id  - Update venue
DELETE /api/admin/venues/:id  - Delete venue
```

**Categories:**
```
POST   /api/admin/categories      - Create category
GET    /api/admin/categories      - Get all categories
PUT    /api/admin/categories/:id  - Update category
DELETE /api/admin/categories/:id  - Delete category
```

**Dashboard Stats:**
```
GET    /api/admin/stats       - Get dashboard statistics
```

---

## 📁 File Uploads

### Event Images

- Endpoint: `POST /api/events` (multipart/form-data)
- Field name: `image`
- Accepted formats: JPEG, JPG, PNG, WEBP
- Max size: 5MB
- Storage: `/uploads/events/`

### Organizer Documents

- Endpoint: `POST /api/organizer/apply` (multipart/form-data)
- Field name: `document`
- Accepted formats: PDF, DOC, DOCX, images
- Max size: 5MB
- Storage: `/uploads/documents/`

---

## 🔒 Security Features

✅ Password hashing with bcrypt  
✅ JWT token authentication  
✅ Role-based access control  
✅ Input validation with Zod  
✅ SQL injection protection (Prisma)  
✅ File upload restrictions  
✅ CORS configuration  

---

## 🗄️ Database Management

### View Database

```bash
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555` - GUI for viewing/editing database.

### Create Migration

```bash
npx prisma migrate dev --name migration_name
```

### Reset Database

```bash
npx prisma migrate reset
npm run seed
```

---

## 🧪 Testing API with cURL

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@spotyourvibe.com",
    "password": "admin123"
  }'
```

### Get Events (with token)

```bash
curl -X GET http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Database Connection Error

Make sure Prisma is set up correctly:
```bash
npx prisma generate
npx prisma migrate dev
```

### File Upload Errors

Check that upload directories exist:
```bash
mkdir -p uploads/events uploads/documents
```

### JWT Token Errors

- Check JWT_SECRET in .env file
- Ensure token is sent in Authorization header
- Verify token format: `Bearer <token>`

### Port Already in Use

Change PORT in .env file or kill existing process:
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

---

## 🚢 Deployment

### Environment Variables for Production

Update these in production:
- `JWT_SECRET` - Use strong random string
- `NODE_ENV=production`
- `FRONTEND_URL` - Your frontend domain
- `DATABASE_URL` - Production database path

### Deploy to Render/Railway/Fly.io

1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Build command: `npx prisma generate && npx prisma migrate deploy`
5. Start command: `npm start`

---

## 📝 License

MIT

---

## 👨‍💻 Support

For issues or questions:
1. Check this README
2. Review API documentation above
3. Check Prisma logs: `npx prisma studio`
4. Enable development logging in .env

---

**Built with ❤️ for EventFlow**
