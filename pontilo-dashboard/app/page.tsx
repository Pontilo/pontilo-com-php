import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, Award, Users, BarChart3, Trophy, Heart, Sparkles, Crown, Target, Zap, Shield, Gamepad2, Medal, Gift, Clock, CheckCircle, AlertCircle, TrendingUp, Smile, BookOpen, Lightbulb } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto relative flex h-16 items-center justify-between px-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img src="/icon.png" alt="App Pontos" className="h-10 w-10 md:h-15 md:w-15" />
            <span className="text-2xl font-bold text-primary">App Pontos</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary">
              Entrar
            </Link>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 shadow-lg">
              <Link href="/register">Começar agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Variação A (Foco na Dor) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-24">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="mx-auto max-w-4xl">
            {/* Social Proof Badge */}
            <div className="mb-8 inline-flex items-center rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mais de 10.000 alunos já transformaram seu aprendizado
            </div>
            
            {/* Main Headline - Variação A */}
            <h1 className="mb-6 text-5xl font-black tracking-tight text-gray-900 sm:text-6xl md:text-7xl leading-tight">
              Seus alunos estão <span className="text-red-500">desmotivados</span>?<br/>
              <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                App Pontos muda isso em 24h
              </span>
            </h1>
            
            {/* Emotional Subtitle */}
            <p className="mb-8 text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
              <strong>Pare de lutar contra a falta de interesse.</strong> Transforme sua sala de aula em um ambiente 
              onde cada aluno <em>quer</em> participar, compete de forma saudável e celebra cada conquista. 
              <span className="text-primary font-semibold">Resultados visíveis desde o primeiro dia.</span>
            </p>

            {/* Urgency + Benefits */}
            <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg max-w-2xl mx-auto">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  <strong>Oferta limitada:</strong> Teste GRATUITO por 30 dias + Setup personalizado incluso. 
                  Apenas para os próximos 100 professores.
                </p>
              </div>
            </div>
            
            {/* Primary CTA */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-8">
              <Button asChild size="lg" className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:shadow-xl transform hover:scale-105 transition-all">
                <Link href="/register">
                  🎯 QUERO TRANSFORMAR MINHA TURMA AGORA
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 border-2 border-primary px-8 text-primary hover:bg-primary/5 font-semibold">
                <Link href="#como-funciona">Ver como funciona (2 min)</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Suporte em português</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gray-600 mb-8">Professores de todo o Brasil já confiam no App Pontos:</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {/* Placeholder for school logos */}
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-600">Escola Municipal São João</div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-600">Colégio Objetivo</div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-600">EMEF Santos Dumont</div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-600">+ 500 escolas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Storytelling Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900">
                Você reconhece esses <span className="text-red-500">problemas</span> na sua sala de aula?
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 mb-16">
              {/* Problems */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-red-600 mb-6">😔 Antes do App Pontos:</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Alunos desinteressados</p>
                      <p className="text-sm text-red-700">Celulares mais interessantes que a aula</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Participação baixa</p>
                      <p className="text-sm text-red-700">Sempre os mesmos 3 alunos respondendo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Gestão complexa</p>
                      <p className="text-sm text-red-700">Planilhas confusas e anotações perdidas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Sem motivação</p>
                      <p className="text-sm text-red-700">Alunos fazem o mínimo necessário</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solutions */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-green-600 mb-6">🎉 Depois do App Pontos:</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Engajamento total</p>
                      <p className="text-sm text-green-700">Alunos competem para participar mais</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Participação ativa</p>
                      <p className="text-sm text-green-700">Até os mais tímidos querem pontuar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Controle automático</p>
                      <p className="text-sm text-green-700">Tudo organizado e acessível em tempo real</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Motivação constante</p>
                      <p className="text-sm text-green-700">Cada conquista é uma celebração</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transformation CTA */}
            <div className="text-center bg-gradient-to-r from-primary to-secondary p-8 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-4">Pronto para essa transformação?</h3>
              <p className="mb-6 text-lg opacity-90">Milhares de professores já fizeram essa mudança. Sua vez chegou.</p>
              <Button asChild size="lg" variant="secondary" className="h-12 px-8 font-bold">
                <Link href="/register">
                  💪 SIM, QUERO TRANSFORMAR MINHA TURMA
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Storytelling */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
              Como o App Pontos <span className="text-primary">transforma</span> sua sala de aula
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Em apenas 4 passos simples, você terá alunos mais engajados e uma gestão muito mais eficiente
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 mb-16">
            <div className="text-center group">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-xl font-bold group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="mb-3 text-xl font-bold">Configure em 5 minutos</h3>
              <p className="text-gray-600 mb-4">
                Crie sua conta, adicione sua turma e defina as regras de pontuação. Simples como enviar um WhatsApp.
              </p>
              <div className="text-sm text-primary font-semibold">⏱️ Tempo: 5 minutos</div>
            </div>

            <div className="text-center group">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-xl font-bold group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="mb-3 text-xl font-bold">Alunos se cadastram</h3>
              <p className="text-gray-600 mb-4">
                Compartilhe o código da turma. Seus alunos criam avatares únicos e já começam a competir de forma saudável.
              </p>
              <div className="text-sm text-primary font-semibold">🎮 Diversão garantida</div>
            </div>

            <div className="text-center group">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-xl font-bold group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="mb-3 text-xl font-bold">Pontue e motive</h3>
              <p className="text-gray-600 mb-4">
                A cada participação, comportamento positivo ou conquista, atribua pontos. O ranking atualiza na hora!
              </p>
              <div className="text-sm text-primary font-semibold">⚡ Resultados imediatos</div>
            </div>

            <div className="text-center group">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-xl font-bold group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="mb-3 text-xl font-bold">Veja a magia acontecer</h3>
              <p className="text-gray-600 mb-4">
                Alunos disputam posições, desbloqueiam conquistas e transformam o aprendizado em uma aventura.
              </p>
              <div className="text-sm text-primary font-semibold">🏆 Engajamento máximo</div>
            </div>
          </div>

          {/* Video/Demo CTA */}
          <div className="text-center bg-gray-50 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">Quer ver na prática?</h3>
            <p className="text-gray-600 mb-6">Assista a demonstração de 2 minutos e entenda como é fácil</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="h-12 px-8">
                <Link href="#demo">📹 Ver demonstração (2 min)</Link>
              </Button>
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/register">
                  🚀 Começar agora mesmo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Emotional Focus */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900">
              Imagine sua sala de aula <span className="text-primary">completamente transformada</span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              Mais de <strong className="text-primary">15.000 professores</strong> já descobriram o segredo para ter alunos 
              <strong> 300% mais engajados</strong>. Agora é sua vez!
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 mb-16">
            {/* Benefits for Teachers */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-white">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Para Você, Professor</h3>
                  <p className="text-primary font-semibold">Sua vida vai ficar muito mais fácil</p>
                </div>
              </div>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">🎯 Alunos disputando para participar:</strong>
                    <p className="text-gray-600 mt-1">Acabou aquela sensação de "falar sozinho". Agora eles levantam a mão antes mesmo de você terminar a pergunta!</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">⏰ Economize 5 horas por semana:</strong>
                    <p className="text-gray-600 mt-1">Chega de planilhas confusas e anotações perdidas. Tudo automatizado e organizado para você.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">💪 Recupere o prazer de ensinar:</strong>
                    <p className="text-gray-600 mt-1">Volte a sentir aquela energia boa de ver seus alunos realmente interessados no que você tem a ensinar.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">📊 Dados que impressionam a coordenação:</strong>
                    <p className="text-gray-600 mt-1">Relatórios automáticos que mostram o impacto real do seu trabalho. Reconhecimento garantido!</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Benefits for Students */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-secondary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r from-secondary to-primary text-white">
                  <Gamepad2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Para Seus Alunos</h3>
                  <p className="text-secondary font-semibold">Eles vão AMAR suas aulas</p>
                </div>
              </div>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">🎮 Aprender vira diversão:</strong>
                    <p className="text-gray-600 mt-1">Cada aula se torna uma aventura onde eles são os heróis. Celular? Nem lembram que existe!</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">🏆 Reconhecimento instantâneo:</strong>
                    <p className="text-gray-600 mt-1">Cada esforço é recompensado na hora. Autoestima lá em cima e vontade de participar sempre!</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">🤝 Amizades mais fortes:</strong>
                    <p className="text-gray-600 mt-1">Competição saudável que une a turma. Até os mais tímidos fazem novos amigos!</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <strong className="text-gray-900">✨ Orgulho das conquistas:</strong>
                    <p className="text-gray-600 mt-1">Avatares únicos e badges que eles mostram com orgulho para família e amigos.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Proof Numbers */}
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <h3 className="text-2xl font-bold mb-6">Resultados que falam por si só:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">300%</div>
                <div className="text-sm text-gray-600">Mais participação em sala</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">15.000+</div>
                <div className="text-sm text-gray-600">Professores satisfeitos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">5h</div>
                <div className="text-sm text-gray-600">Economizadas por semana</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">98%</div>
                <div className="text-sm text-gray-600">Recomendam o App Pontos</div>
              </div>
            </div>
            <div className="mt-8">
              <Button asChild size="lg" className="h-12 px-8 font-bold">
                <Link href="/register">
                  🚀 EU QUERO ESSES RESULTADOS TAMBÉM!
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900">
              Mais de <span className="text-primary">15.000 professores</span> já transformaram suas salas de aula
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Veja o que educadores como você estão dizendo sobre o App Pontos
            </p>
          </div>

          {/* School Logos */}
          <div className="mb-16">
            <p className="text-center text-gray-500 mb-8 font-semibold">Confiado por escolas em todo o Brasil:</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-bold text-gray-600">Colégio São Paulo</div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-bold text-gray-600">Escola Municipal Santos</div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-bold text-gray-600">Instituto Educacional RJ</div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-bold text-gray-600">Colégio Particular MG</div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg font-bold text-gray-600">Escola Estadual BA</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {/* Testimonial 1 */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-2xl border-2 border-primary/10">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4 italic">
                "Em 2 semanas, minha turma do 7º ano estava completamente transformada. Alunos que nunca participavam agora disputam para responder as perguntas. É impressionante!"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary">MC</span>
                </div>
                <div>
                  <div className="font-semibold">Maria Clara Santos</div>
                  <div className="text-sm text-gray-600">Professora de Matemática - SP</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-to-br from-secondary/5 to-primary/5 p-6 rounded-2xl border-2 border-secondary/10">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4 italic">
                "Economizo pelo menos 4 horas por semana que gastava com planilhas. Agora tenho mais tempo para preparar aulas incríveis. Meus alunos adoram!"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                  <span className="font-bold text-secondary">RS</span>
                </div>
                <div>
                  <div className="font-semibold">Roberto Silva</div>
                  <div className="text-sm text-gray-600">Professor de História - RJ</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl border-2 border-green-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4 italic">
                "A coordenação ficou impressionada com os relatórios automáticos. Consegui mostrar dados concretos do engajamento da turma. Reconhecimento garantido!"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="font-bold text-green-700">AL</span>
                </div>
                <div>
                  <div className="font-semibold">Ana Luiza Costa</div>
                  <div className="text-sm text-gray-600">Professora de Português - MG</div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Testimonial CTA */}
          <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-2xl text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Quer ouvir mais depoimentos?</h3>
            <p className="mb-6 text-lg opacity-90">Assista aos vídeos de professores reais contando suas experiências</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="h-12 px-8">
                <Link href="#testimonials">📹 Ver depoimentos em vídeo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 bg-white text-primary hover:bg-gray-100">
                <Link href="/register">
                  🚀 Começar minha transformação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Urgency & Conversion Focus */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          {/* Urgency Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold mb-6">
              <Clock className="h-4 w-4" />
              OFERTA LIMITADA - Apenas para os primeiros 100 professores este mês!
            </div>
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900">
              Escolha seu plano e <span className="text-primary">transforme sua sala de aula hoje</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Mais de <strong>87 professores</strong> já se inscreveram este mês. Restam apenas <strong className="text-red-600">13 vagas</strong> com desconto!
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200 relative">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Gratuito</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">R$ 0</div>
                <div className="text-gray-600">Para sempre</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Até 30 alunos por turma</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Sistema básico de pontos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Ranking simples</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Suporte por email</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12" variant="outline">
                <Link href="/register?plan=free">
                  Começar Grátis
                </Link>
              </Button>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border-4 border-primary relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm">
                  🔥 MAIS POPULAR
                </div>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl text-gray-400 line-through">R$ 49</span>
                  <div className="text-4xl font-bold text-primary">R$ 29</div>
                </div>
                <div className="text-gray-600">por mês</div>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold mt-2">
                  40% OFF - Só hoje!
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span><strong>Alunos ilimitados</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Sistema completo de avatares</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Conquistas e badges avançados</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Relatórios detalhados</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span><strong>Garantia de 30 dias</strong></span>
                </li>
              </ul>
              <Button asChild className="w-full h-12 font-bold">
                <Link href="/register?plan=pro">
                  🚀 QUERO O DESCONTO AGORA!
                </Link>
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                ⏰ Oferta válida até meia-noite
              </p>
            </div>

            {/* School Plan */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200 relative">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Escola</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Sob consulta</div>
                <div className="text-gray-600">Plano personalizado</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Professores ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Dashboard administrativo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Relatórios institucionais</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Treinamento personalizado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Suporte dedicado</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12" variant="outline">
                <Link href="/contact">
                  Falar com Consultor
                </Link>
              </Button>
            </div>
          </div>

          {/* Risk Reversal */}
          <div className="mt-16 text-center bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-green-500" />
              <h3 className="text-2xl font-bold">Garantia de 30 dias ou seu dinheiro de volta</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Teste o App Pontos por 30 dias. Se não ficar 100% satisfeito com os resultados, 
              devolvemos todo seu dinheiro. Sem perguntas, sem burocracia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-12 px-8 font-bold">
                <Link href="/register?plan=pro">
                  💪 QUERO TESTAR SEM RISCOS
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8">
                <Link href="/register?plan=free">
                  Começar com plano gratuito
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Emotional & Urgent */}
      <section className="py-20 bg-gradient-to-r from-primary via-purple-600 to-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full font-semibold mb-6">
                <Clock className="h-4 w-4" />
                ⚡ ÚLTIMAS HORAS - Oferta expira à meia-noite!
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Não deixe seus alunos esperando mais um dia
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Enquanto você pensa, outros professores já estão transformando suas salas de aula. 
                <br className="hidden md:block" />
                <strong>Seja o próximo a revolucionar o ensino!</strong>
              </p>
            </div>

            {/* Urgency Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
                <div className="text-3xl font-bold mb-2">13</div>
                <div className="text-sm opacity-90">Vagas restantes com desconto</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
                <div className="text-3xl font-bold mb-2">87</div>
                <div className="text-sm opacity-90">Professores já se inscreveram</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
                <div className="text-3xl font-bold mb-2">6h</div>
                <div className="text-sm opacity-90">Restam para o desconto acabar</div>
              </div>
            </div>

            {/* Main CTAs */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Primary CTA - Variation A */}
                <Button asChild size="lg" className="h-16 px-12 text-lg font-bold bg-white text-primary hover:bg-gray-100 shadow-2xl transform hover:scale-105 transition-all">
                  <Link href="/register?plan=pro&urgency=true">
                    🚀 QUERO TRANSFORMAR MINHA SALA AGORA!
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              {/* Alternative CTA - Variation B */}
              <div className="text-center">
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary">
                  <Link href="/register?plan=free">
                    💡 Começar com plano gratuito
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Garantia de 30 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Sem compromisso</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>15.000+ professores satisfeitos</span>
                </div>
              </div>

              {/* Final Emotional Push */}
              <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <p className="text-white text-lg italic">
                  "O único arrependimento que você terá é não ter começado antes. 
                  <br className="hidden md:block" />
                  Seus alunos merecem uma educação que os inspire todos os dias."
                </p>
                <div className="mt-4 text-white/80 font-semibold">
                  - Mais de 15.000 professores que já transformaram suas salas
                </div>
              </div>

              {/* Student Access Section */}
              <div className="mt-12 border-t border-white/20 pt-8">
                <p className="mb-4 text-lg text-white/90">Aluno? Acesse o ranking da sua turma</p>
                <Button asChild size="lg" className="h-12 bg-white px-8 text-primary hover:bg-white/90">
                  <Link href="/ranking">
                    Acessar Ranking da Minha Turma
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">App Pontos</span>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="#" className="text-sm text-gray-600 hover:text-primary">
                Sobre nós
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-primary">
                Recursos
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-primary">
                Preços
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-primary">
                Contato
              </Link>
            </div>
            <div className="text-sm text-gray-500">© 2024 App Pontos. Todos os direitos reservados.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
