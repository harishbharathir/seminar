import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, isSameDay, startOfDay, isAfter, isBefore } from 'date-fns';

// Types
export type UserRole = 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Hall {
  id: string;
  name: string;
  capacity: number;
  features: string[]; // e.g., "Projector", "AC", "Sound System"
  description: string;
  imageUrl?: string;
}

export interface Booking {
  id: string;
  hallId: string;
  userId: string;
  date: string; // ISO string
  slot: number; // 9, 10, 11, 12, 13, 14, 15, 16 (Start hour)
  status: 'confirmed' | 'waitlist';
  purpose: string;
  timestamp: number; // For waitlist ordering
}

// Default Data
const MOCK_HALLS: Hall[] = [
  { 
    id: 'h1', 
    name: 'Main Auditorium', 
    capacity: 500, 
    features: ['Projector', 'AC', 'Surround Sound', 'Stage'], 
    description: 'Our largest venue, perfect for convocations and large seminars.' 
  },
  { 
    id: 'h2', 
    name: 'Lecture Hall A', 
    capacity: 120, 
    features: ['Smart Board', 'AC', 'Mic System'], 
    description: 'Modern tiered seating lecture hall.' 
  },
  { 
    id: 'h3', 
    name: 'Seminar Room 101', 
    capacity: 50, 
    features: ['Projector', 'Whiteboard'], 
    description: 'Intimate setting for department meetings and small workshops.' 
  },
];

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. Sarah Johnson', email: 'faculty@campus.edu', role: 'faculty' },
  { id: 'u2', name: 'Admin Staff', email: 'admin@campus.edu', role: 'admin' },
];

interface AppState {
  currentUser: User | null;
  users: User[];
  halls: Hall[];
  bookings: Booking[];
  login: (email: string, role: UserRole) => boolean;
  signup: (userData: Omit<User, 'id'>) => boolean;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
  addHall: (hall: Omit<Hall, 'id'>) => void;
  deleteHall: (id: string) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'timestamp'>) => { success: boolean; message: string; isWaitlist?: boolean };
  cancelBooking: (bookingId: string) => void;
  getHalls: () => Hall[];
  getBookingsForDate: (date: Date) => Booking[];
  getWaitlistPosition: (bookingId: string) => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: MOCK_USERS,
      halls: MOCK_HALLS,
      bookings: [],

      login: (email, role) => {
        const user = get().users.find(u => u.email === email && u.role === role);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      signup: (userData) => {
        const exists = get().users.find(u => u.email === userData.email && u.role === userData.role);
        if (exists) return false;
        
        const newUser = { ...userData, id: Math.random().toString(36).substr(2, 9) };
        set(state => ({ 
          users: [...state.users, newUser],
          currentUser: newUser
        }));
        return true;
      },

      logout: () => set({ currentUser: null }),

      setCurrentUser: (user) => set({ currentUser: user }),

      addHall: (hallData) => set(state => ({
        halls: [...state.halls, { ...hallData, id: Math.random().toString(36).substr(2, 9) }]
      })),
      
      deleteHall: (id) => set(state => ({
        halls: state.halls.filter(h => h.id !== id),
        bookings: state.bookings.filter(b => b.hallId !== id) // Cascade delete bookings? Or keep them? Let's clean up.
      })),

      addBooking: (bookingData) => {
        const state = get();
        const { currentUser, bookings } = state;
        
        if (!currentUser) return { success: false, message: 'Not logged in' };

        const bookingDate = new Date(bookingData.date);
        
        // 1. Validation: Faculty Constraints
        if (currentUser.role === 'faculty') {
          // Rule: Can book only for two days from present
          const today = startOfDay(new Date());
          const maxDate = addDays(today, 2);
          
          if (isBefore(bookingDate, today) || isAfter(bookingDate, maxDate)) {
            return { success: false, message: 'Faculty can only book up to 2 days in advance.' };
          }

          // Rule: Max 2 hours per day (2 slots)
          const userBookingsForDay = bookings.filter(b => 
            b.userId === currentUser.id && 
            isSameDay(new Date(b.date), bookingDate) &&
            b.status === 'confirmed'
          );

          if (userBookingsForDay.length >= 2) {
             return { success: false, message: 'Daily limit reached (max 2 hours).' };
          }
        }

        // 2. Check Availability & Waitlist
        const existingBooking = bookings.find(b => 
          b.hallId === bookingData.hallId && 
          isSameDay(new Date(b.date), bookingDate) && 
          b.slot === bookingData.slot &&
          b.status === 'confirmed'
        );

        const newBooking: Booking = {
          ...bookingData,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          status: existingBooking ? 'waitlist' : 'confirmed',
        };

        set(state => ({ bookings: [...state.bookings, newBooking] }));

        if (existingBooking) {
          return { success: true, message: 'Slot occupied. You have been added to the waitlist.', isWaitlist: true };
        }

        return { success: true, message: 'Booking confirmed successfully!' };
      },

      cancelBooking: (bookingId) => {
        const state = get();
        const bookingToCancel = state.bookings.find(b => b.id === bookingId);
        
        if (!bookingToCancel) return;

        // If cancelling a confirmed booking, promote the next waitlisted person
        let updatedBookings = state.bookings.filter(b => b.id !== bookingId);

        if (bookingToCancel.status === 'confirmed') {
          const waitlistedBookings = updatedBookings.filter(b => 
            b.hallId === bookingToCancel.hallId && 
            isSameDay(new Date(b.date), new Date(bookingToCancel.date)) && 
            b.slot === bookingToCancel.slot &&
            b.status === 'waitlist'
          ).sort((a, b) => a.timestamp - b.timestamp);

          if (waitlistedBookings.length > 0) {
            const promotedBookingId = waitlistedBookings[0].id;
            updatedBookings = updatedBookings.map(b => 
              b.id === promotedBookingId ? { ...b, status: 'confirmed' } : b
            );
          }
        }

        set({ bookings: updatedBookings });
      },

      getHalls: () => get().halls,

      getBookingsForDate: (date) => {
        return get().bookings.filter(b => isSameDay(new Date(b.date), date));
      },
      
      getWaitlistPosition: (bookingId) => {
        const state = get();
        const myBooking = state.bookings.find(b => b.id === bookingId);
        if (!myBooking || myBooking.status !== 'waitlist') return 0;

        const waitlistBeforeMe = state.bookings.filter(b => 
          b.hallId === myBooking.hallId && 
          isSameDay(new Date(b.date), new Date(myBooking.date)) && 
          b.slot === myBooking.slot &&
          b.status === 'waitlist' &&
          b.timestamp < myBooking.timestamp
        );

        return waitlistBeforeMe.length + 1;
      }

    }),
    {
      name: 'campus-book-storage',
    }
  )
);
