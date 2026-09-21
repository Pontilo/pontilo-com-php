import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

// 1. Defina uma interface para os dados do usuário
// Ajuste esta interface para corresponder aos campos que seu backend retorna
interface User {
  id: string
  email: string
  name?: string // Exemplo, adicione outros campos se necessário
}

interface AuthState {
  token: string | null
  user: User | null // 2. Adicione a propriedade 'user' ao estado
  login: (data: { token: string; user?: User; teacher?: User }) => void // Ação de login pode receber 'user' ou 'teacher'
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (data) => {
        // Prioriza data.user, mas usa data.teacher se data.user não estiver presente
        const userData = data.user || data.teacher;
        set({ token: data.token, user: userData || null })
      },
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage), // ou sessionStorage se preferir
    },
  ),
)
