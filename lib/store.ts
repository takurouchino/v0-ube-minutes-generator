import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface MinutesRecord {
  id: string
  title: string
  date: string
  content: string
  factory: string
  department: string
  emails: string[]
}

interface MinutesStore {
  minutes: MinutesRecord[]
  addMinutes: (record: Omit<MinutesRecord, "id">) => string
  getMinutes: (id: string) => MinutesRecord | undefined
}

export const useMinutesStore = create<MinutesStore>()(
  persist(
    (set, get) => ({
      minutes: [],
      addMinutes: (record) => {
        const id = Date.now().toString()
        set((state) => ({
          minutes: [{ ...record, id }, ...state.minutes],
        }))
        return id
      },
      getMinutes: (id) => {
        return get().minutes.find((record) => record.id === id)
      },
    }),
    {
      name: "minutes-storage",
    },
  ),
)
