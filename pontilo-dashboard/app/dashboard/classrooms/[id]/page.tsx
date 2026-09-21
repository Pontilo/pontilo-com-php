import ClassroomPageClient from "./classroom-page-client"

// Necessário para "output: export" (build estático) -- o Next.js precisa
// saber, em tempo de build, quais valores de [id] existem. Como o id real
// só é conhecido em runtime (dados vêm da API), geramos um único HTML
// "placeholder" e o .htaccess do frontend reescreve qualquer
// /dashboard/classrooms/<id> para esse arquivo. No navegador, o componente
// cliente lê o id real da própria URL (via params/useParams), então a
// página funciona normalmente para qualquer turma.
export function generateStaticParams() {
  return [{ id: "placeholder" }]
}

export default function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  return <ClassroomPageClient params={params} />
}
