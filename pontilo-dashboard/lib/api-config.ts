// Em produção o frontend (export estático) e a API PHP ficam no mesmo
// domínio (apppontos.com.br), então "/api" já resolve corretamente.
// Em desenvolvimento local, aponte para onde a API PHP está rodando via
// NEXT_PUBLIC_PONTILO_BACKEND_URL (ex.: http://localhost:8000/api).
const BACKEND_URL = process.env.NEXT_PUBLIC_PONTILO_BACKEND_URL || "/api";

const normalize = (url: string) => url.replace(/\/+$/, "");
const apiUrl = (endpoint: string) => `${normalize(BACKEND_URL)}/${endpoint.replace(/^\/+/, "")}`;

export { apiUrl };
export default apiUrl;
