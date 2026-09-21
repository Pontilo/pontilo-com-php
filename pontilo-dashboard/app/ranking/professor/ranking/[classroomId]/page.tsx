import TeacherClassroomRankingClient from "./classroom-ranking-client"

// Ver comentário equivalente em app/dashboard/classrooms/[id]/page.tsx --
// necessário para "output: export". O componente cliente lê o classroomId
// real via useParams(), então funciona para qualquer turma mesmo servindo
// sempre o mesmo HTML "placeholder" (ver .htaccess).
export function generateStaticParams() {
  return [{ classroomId: "placeholder" }]
}

export default function TeacherClassroomRankingPage() {
  return <TeacherClassroomRankingClient />
}
