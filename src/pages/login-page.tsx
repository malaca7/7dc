import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function LoginPage() {
  const { signIn, signInDemo, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.')
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setErrorMessage(error)
    } else {
      navigate(from, { replace: true })
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    await signInDemo()
    setLoading(false)
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#1f1f1f_0%,transparent_60%)] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-white text-black flex items-center justify-center font-black text-lg shadow-xl mb-3 tracking-tighter">
            7d
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">7dc</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Painel Administrativo de Bots Discord
          </p>
        </div>

        <Card className="border-neutral-800/80 bg-neutral-900/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                <Lock className="h-4 w-4 text-neutral-400" />
                Acesso Administrativo
              </CardTitle>
              <Badge
                variant={configured ? 'outline' : 'warning'}
                className="text-[10px] uppercase tracking-wider font-semibold"
              >
                {configured ? 'Firebase Auth' : 'Ambiente Demo'}
              </Badge>
            </div>
            <CardDescription className="text-neutral-400 text-xs">
              Autentique-se com sua conta autorizada para gerenciar a frota de bots.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-neutral-500" />
                  E-mail do Administrador
                </label>
                <Input
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-neutral-950/60 border-neutral-800 text-neutral-100 focus:border-neutral-500 text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-neutral-500" />
                  Senha de Acesso
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-neutral-950/60 border-neutral-800 text-neutral-100 focus:border-neutral-500 text-sm h-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all mt-2 cursor-pointer shadow-md"
                disabled={loading}
              >
                {loading ? 'Validando acesso...' : 'Entrar no Painel'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-neutral-900 px-2 text-neutral-500 font-semibold tracking-wider">
                  Ou acesse rapidamente
                </span>
              </div>
            </div>

            {/* Botão de Demonstração */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full h-10 border-neutral-700 bg-neutral-800/40 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Entrar no Modo de Demonstração (Sandbox)</span>
            </Button>

            {/* Aviso de Segurança Estrita */}
            <div className="pt-2 text-center">
              <p className="text-[11px] text-neutral-500 leading-relaxed flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-neutral-400 inline" />
                Acesso restrito. Cadastros públicos desabilitados por política de segurança.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé institucional */}
        <p className="text-center text-[11px] text-neutral-600 mt-6 font-mono">
          7dc Bot Management System • v1.0.0 MVP
        </p>
      </div>
    </div>
  )
}
