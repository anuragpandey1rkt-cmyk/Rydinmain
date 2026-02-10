# 🚗 Rydin - Student Ride-Sharing Platform

Rydin is a **real-time student ride-matching platform** that helps students find co-passengers, save money, and travel safely together.

## ✨ Core Features

### 1. **Hopper** (Primary Feature)
- Create ride requests with pickup/drop locations and departure time
- **Real-time matching** with ±3-5 hours flexibility
- Request → Accept → Chat unlock flow
- Auto-expiry when time passes
- Safety-first design (no spam, verified students only)

### 2. **Events Nearby**
- Browse upcoming events on campus
- Mark events as interested
- Auto-created ride rooms for events (to/from)
- View other students attending

### 3. **Train/Flight Matching**
- Add train/flight numbers silently
- Real-time notifications when other students on same trip
- Convert to Hopper for ride coordination
- No PNR/ticket needed

### 4. **Travel Timings**
- SRM ↔ Chennai shuttle schedules
- Local train timings
- Bus routes
- Always see free alternatives

### 5. **AI Travel Assistant** 🤖
- Smart travel advice: "When should I leave?", "Cheapest way?"
- Real-time cost recommendations
- Hopper vs alternatives comparison
- Chat interface with instant answers

### 6. **Additional Features**
- Cost-saving estimator (live slider showing savings)
- Emergency safety mode (1-click emergency contacts)
- Trust score with badges (gamification)
- Smart fallback (show alternatives when no match)
- Girls-only ride option

---

## 🏗️ Tech Stack

### Frontend
- **Vite** - Lightning-fast build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **shadcn/ui** - Component library

### Backend
- **Firebase** - Google OAuth + SMS OTP verification
- **Supabase** - PostgreSQL database + real-time subscriptions
- **PostgREST** - Auto-generated APIs

### Real-Time Features
- Supabase real-time subscriptions for hoppers
- Firebase Realtime Database for chat
- Live updates across all client connections

---

## 📋 Project Structure

```
src/
├── pages/
│   ├── Auth.tsx                 # Google OAuth login
│   ├── SMSVerification.tsx       # Phone OTP verification
│   ├── ProfileSetup.tsx          # User profile setup
│   ├── Index.tsx                 # Home/dashboard
│   ├── Hopper.tsx               # Ride matching (CORE)
│   ├── Events.tsx               # Event browsing
│   ├── Travel.tsx               # Train/flight/shuttle info
│   ├── AIAssistant.tsx          # AI travel advisor
│   ├── Chat.tsx                 # Real-time messaging
│   ├── Profile.tsx              # User profile
│   ├── Search.tsx               # Search rides
│   └── CreateRide.tsx           # Create ride (legacy)
│
├── components/
│   ├── BottomNav.tsx            # Navigation
│   ├── HopperCard.tsx           # Hopper display
│   ├── HopperRequestDialog.tsx   # Request/accept
│   ├── HopperSafetyOptions.tsx   # Safety toggles
│   ├── EventCard.tsx            # Event display
│   ├── EventModal.tsx           # Event details
│   ├── EventAutoRideRooms.tsx    # Auto-created rides
│   ├── CostSavingEstimator.tsx   # Cost visualization
│   ├── EmergencySafetyMode.tsx   # Emergency features
│   ├── SmartFallbackSystem.tsx    # Fallback options
│   ├── TrustScoreAnimation.tsx   # Trust score display
│   └── ui/                      # shadcn UI components
│
├── contexts/
│   └── AuthContext.tsx          # Google OAuth + SMS + Profile
│
├── hooks/
│   ├── useHopperMatching.ts     # Matching algorithm
│   ├── use-toast.ts             # Toast notifications
│   └── use-mobile.tsx           # Mobile detection
│
├── integrations/
│   ├── firebase/
│   │   └── config.ts            # Firebase setup
│   └── supabase/
│       ├── client.ts            # Supabase client
│       └── schema.sql           # Database schema
│
├── App.tsx                      # Main app routes
└── main.tsx                     # Entry point
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase account with Google OAuth configured
- Supabase account
- Bun or npm

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd rydin

# Install dependencies
npm install

# Create .env file with:
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Start dev server
npm run dev

# Open http://localhost:8080
```

---

## 🔧 Setup Instructions

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project `rydin-a7b19`
3. Enable Authentication:
   - Google OAuth
   - Phone authentication
4. Add authorized domains:
   - `localhost:8080`
   - Your Fly.io domain
   - Your production domain

### 2. Supabase Setup
1. Go to [Supabase](https://supabase.com)
2. Create project
3. Run SQL from `src/integrations/supabase/schema.sql`
4. Add indexes:
```sql
CREATE INDEX idx_hoppers_date_location ON hoppers(date, pickup_location, drop_location);
CREATE INDEX idx_hoppers_time ON hoppers(departure_time);
CREATE INDEX idx_hoppers_active ON hoppers(status) WHERE status = 'active';
CREATE INDEX idx_events_date_category ON events(date, category);
CREATE INDEX idx_hopper_requests_pending ON hopper_requests(status) WHERE status = 'pending';
```

### 3. Enable Real-Time Subscriptions
In Supabase:
```sql
ALTER TABLE hoppers REPLICA IDENTITY FULL;
ALTER TABLE hopper_requests REPLICA IDENTITY FULL;
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE event_interested_users REPLICA IDENTITY FULL;
```

---

## 🔄 Real-Time Features

### Hopper Matching (Real-Time)
- User creates hopper → triggers Postgres trigger
- Other users see new hoppers instantly via Supabase subscriptions
- Request sent → other user sees notification in real-time
- Accept request → chat unlocks immediately (both sides)

### Events Interest (Real-Time)
- Mark interested → counter updates instantly
- Auto ride rooms → users see updated participant count
- Join ride → seat count decreases in real-time

### Train/Flight Matching (Real-Time)
- Add trip → stored in database
- Another user adds same trip → instant notification
- Convert to Hopper → real-time sync

### Chat (Real-Time)
- Messages update instantly
- Typing indicators
- Read receipts

---

## 📱 Key Routes

| Route | Feature | Purpose |
|-------|---------|---------|
| `/auth` | Google Login | Initial authentication |
| `/sms-verification` | Phone OTP | Verify phone number |
| `/profile-setup` | Profile Creation | Complete user info |
| `/` | Home | Dashboard & main feed |
| `/hopper` | Ride Matching | Create & find rides |
| `/events` | Events Nearby | Browse & join events |
| `/travel` | Travel Info | Shuttles, trains, buses |
| `/ai` | AI Assistant | Smart travel advice |
| `/chat` | Messaging | Real-time chat |
| `/profile` | User Profile | Settings & info |

---

## 🔐 Authentication Flow

1. **Landing** → `/auth`
2. **Google OAuth** → User signs in with Google
3. **SMS Verification** → `/sms-verification` (Firebase OTP)
4. **Profile Setup** → `/profile-setup` (name, department, year, gender, emergency contact)
5. **Dashboard** → `/` (Ready to use all features)

---

## 💾 Database Schema

### Main Tables
- `profiles` - User info (Firebase UID)
- `hoppers` - Ride requests (active, expired, completed)
- `hopper_requests` - Join requests (pending, accepted, rejected)
- `events` - Event listings
- `event_interested_users` - User interests
- `event_ride_rooms` - Auto-created event rides
- `shuttle_timings` - Bus/shuttle schedules
- `train_info` - Train numbers & timings

---

## 🎮 Demo Script (5-7 mins for Judges)

```
1. AI Assistant (1 min)
   → Click AI tab
   → Ask "When should I leave for airport?"
   → Show smart response with recommendations

2. Cost Estimator (1 min)
   → Create hopper
   → Slide co-passenger slider
   → Show cost dropping: ₹1200 → ₹300

3. Emergency Mode (30 secs)
   → Click Emergency button
   → Show contacts: Police, Ambulance, etc.

4. Auto Ride Rooms (1 min)
   → Click Events
   → Show auto-created rides
   → Explain: "We create rides around intent"

5. Trust Score (30 secs)
   → Complete a ride
   → Show animation: 72 → 75
   → Badge unlocks

6. Fallback System (30 secs)
   → Search with no matches
   → Show alternatives: Shuttle, Train, Bus

7. Core Hopper (1 min)
   → Create hopper (Campus → Airport, Tomorrow 3:30 PM)
   → Show matching hoppers
   → Send request
   → Show accept flow
```

---

## 🎯 Key Statistics

- ✅ 0 drivers (we're not a cab service)
- ✅ 0 payments (no fintech)
- ✅ 1000+ users supported (Supabase scales)
- ✅ Request/Accept prevents spam
- ✅ Girls-only rides available
- ✅ Emergency mode built-in
- ✅ Real-time updates across all features
- ✅ ₹300-700 savings per trip

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📦 Deployment

### Fly.io
```bash
fly deploy
```

### Vercel
```bash
vercel deploy
```

### Docker
```bash
docker build -t rydin .
docker run -p 8080:8080 rydin
```

---

## 🔒 Security Features

- **Authentication**: Firebase + Google OAuth
- **Phone Verification**: OTP via Firebase
- **Request/Accept Only**: No auto-chat
- **College-Only Access**: @srmist.edu.in emails
- **Verified Badges**: Student ID verification (future)
- **Block/Report Users**: Safety controls
- **Girls-Only Rides**: Optional safety toggle
- **Emergency Mode**: 1-click emergency contacts

---

## 🚧 Future Features

- Student ID verification badges
- Calendar integration (Google Calendar)
- Push notifications
- Ride insurance
- Premium safety features
- Corporate partnerships
- Multi-city expansion
- Reward points system

---

## 🐛 Troubleshooting

### Google Login Not Working
→ Check Firebase authorized domains in Firebase Console

### SMS OTP Not Arriving
→ Check Firebase Phone Auth enabled
→ Verify phone number format (+91XXXXXXXXXX)

### Hopper Not Showing
→ Check database tables created
→ Verify status = 'active' and date >= today

### Slow Matching
→ Run database indexes (see Setup section)

### Real-Time Not Updating
→ Enable REPLICA IDENTITY FULL on tables
→ Check Supabase subscription is active

---

## 📞 Support

- **Firebase Issues**: https://firebase.google.com/support
- **Supabase Issues**: https://supabase.com/docs
- **React Issues**: https://react.dev/learn

---

## 📄 License

This project is licensed under the MIT License.

---

## 🎉 Final Notes

**Rydin isn't just cheaper travel. It's how students travel together, safely, in 2025.**

- Built for students first
- Safety-first architecture
- Network effect driven
- Real-time at scale
- Ready to launch

---

**Last Updated**: February 2025
**Status**: Ready for Production ✅
**Team**: Full-stack implementation complete
