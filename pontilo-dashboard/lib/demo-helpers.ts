// Nomes e sobrenomes para geração de alunos hipotéticos
const firstNames = [
  "Ana",
  "João",
  "Maria",
  "Pedro",
  "Lucas",
  "Julia",
  "Carlos",
  "Beatriz",
  "Miguel",
  "Sofia",
  "Rafael",
  "Laura",
  "Gabriel",
  "Isabela",
  "Matheus",
  "Valentina",
  "Enzo",
  "Helena",
  "Guilherme",
  "Luiza",
]

const lastNames = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Rodrigues",
  "Ferreira",
  "Almeida",
  "Pereira",
  "Lima",
  "Gomes",
  "Costa",
  "Martins",
  "Araújo",
  "Melo",
  "Barbosa",
  "Cardoso",
  "Ribeiro",
  "Carvalho",
  "Mendes",
  "Dias",
]

// Gera um nome aleatório
export function generateRandomName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

// Gera um código de aluno baseado no nome
export function generateStudentCode(name: string): string {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")

  return `${initials}${randomNum}`
}

// Gera um número aleatório entre min e max (inclusive)
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Gera uma lista de alunos hipotéticos
export function generateDemoStudents(classroomId: string, count = 10) {
  const students = []

  for (let i = 0; i < count; i++) {
    const name = generateRandomName()
    const code = generateStudentCode(name)
    const totalPoints = getRandomInt(0, 100)

    students.push({
      id: `demo-student-${i}-${Date.now()}`,
      name,
      code,
      classroomId,
      totalPoints,
    })
  }

  return students
}
