/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático: gera HTML/JS/CSS puros em out/, sem servidor Node em
  // produção. Publicado como public_html/ na Locaweb. Em produção o
  // frontend chama a API PHP diretamente em /api/... (mesmo domínio),
  // então as antigas rewrites do Next (proxy para o backend Node) e as
  // rotas app/api/* deixaram de existir — ver MIGRATION_NOTES.md.
  output: 'export',
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
