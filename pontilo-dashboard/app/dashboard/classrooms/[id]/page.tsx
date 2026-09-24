import ClassroomPageClient from "./classroom-page-client"

// Necessário para "output: export" (build estático) -- o Next.js precisa
// saber, em tempo de build, quais valores de [id] existem. Como o id real
// só é conhecido em runtime (dados vêm da API), geramos um único HTML
// "placeholder" e o .htaccess do frontend reescreve qualquer
// /dashboard/classrooms/<id> para esse arquivo. O componente cliente lê o
// id real da URL via useParams() (NÃO via prop "params" -- essa fica
// travada no valor de build time em páginas exportadas estaticamente).
export function generateStaticParams() {
  return [{ id: "placeholder" }]
}

export default function ClassroomPage() {
  return <ClassroomPageClient />
}
