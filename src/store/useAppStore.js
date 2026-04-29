import { create } from 'zustand'

const useAppStore = create((set) => ({
  user: null,
  eventId: null,
  event: null,

  setUser: (user) => set({ user }),
  setEventId: (eventId) => set({ eventId }),
  setEvent: (event) => set({ event }),

  reset: () => set({ user: null, eventId: null, event: null }),
}))

export default useAppStore
