# TODO - Fix EventDetail Page to Load Actual Events

## Problem
The EventDetail.tsx page uses hardcoded mock data instead of fetching actual event from the backend API. When clicking on any event, it always shows "Summer Music Festival 2026".

## Plan

### Step 1: Modify EventDetail.tsx to fetch actual event data
- [ ] Import `useParams` and `useEffect` from react-router-dom
- [ ] Add state for event, loading, and error
- [ ] Use `useParams()` to get the event ID from URL
- [ ] Use `useEffect` to fetch event from API on mount and when ID changes
- [ ] Add loading state display
- [ ] Add error state display (event not found)
- [ ] Replace hardcoded data with fetched data

### Step 2: Test the fix
- [ ] Browse events and click on an event
- [ ] Verify the correct event details are displayed

## Implementation Notes
- API Endpoint: GET /api/events/:id
- Backend returns event with category, venue, organizer, bookings
- Need to handle image path (local vs URL)
- Date/time formatting needed from API response
