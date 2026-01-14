# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # Install dependencies
npm start        # Dev server on port 3000
npm run build    # Production build to build/
npm test         # Run tests with Jest (interactive watch mode)
npm test -- --watchAll=false  # Run tests once (CI mode)
```

## Architecture

Sweat Bridge Box is a gym/fitness box management app built with React 19, TypeScript, and Firebase.

### Tech Stack
- **React 19** with TypeScript
- **Firebase**: Firestore (database) + Auth (authentication)
- **React Router DOM 7**: Routing with protected routes
- **FullCalendar**: Class scheduling calendar
- **react-datepicker + date-fns**: Date input handling
- **Lucide React**: Icon library

### State Management
Uses React Context + useReducer pattern (no Redux):
- `AuthContext`: Authentication state (login/logout)
- `ClassContext`: Class events with useReducer
- `PageContext`: Page header/navigation state

### Data Flow Pattern
```
User Action → Modal/Page → Custom Hook → Service → Firebase Firestore
                              ↓
                    Context Update → UI Re-render
```

### Firestore Data Structure
Collections are scoped per box: `/box/{boxName}/collection/{documentId}`

Box name is stored in localStorage as `boxName`.

### Key Directories
- `src/services/`: Firebase operations (memberService, membershipService, classService, etc.)
- `src/hooks/`: Business logic hooks (useClassManagement, useMemberManagement, etc.)
- `src/contexts/`: React Context providers
- `src/components/modals/`: Modal components organized by feature (class/, member/, membership/, locker/, revenue/)
- `src/pages/`: Route page components
- `src/types/`: TypeScript interfaces for all entities

### UI Patterns
- Heavy use of modal dialogs for CRUD operations
- `ProtectedRoute` component guards authenticated routes
- `MainLayout` wraps all authenticated pages with sidebar + header
- `DateInput` component for all date inputs (uses react-datepicker with Korean locale, year range 2000-2999)

### Color Theme
- Primary: `#2563EB` (blue)
- Success: `#16A34A` (green)
- Warning: `#F59E0B` (orange)
- Error: `#DC2626` (red)
- Background: `#F8FAFC` (light gray)

### Date Utilities
- `src/utils/dateUtils.ts`: Date formatting and calculation utilities
- `getDaysBetween(start, end)`: Returns inclusive day count (both start and end dates included)
  - Example: 01.04 ~ 01.05 = 2 days

## Firebase Configuration

Requires `.env` file with:
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```
