import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ApiKeyStore {
  apiKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (key: string) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: "" }),
    }),
    {
      name: "api-key-storage",
    },
  ),
)
