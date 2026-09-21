import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">Página não encontrada</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Button className="mt-4" asChild>
        <Link href="/dashboard">
          <Home className="mr-2 h-4 w-4" />
          Voltar para o Dashboard
        </Link>
      </Button>
    </div>
  )
}
