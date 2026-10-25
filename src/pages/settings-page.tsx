import { useState } from 'react'
import {
  Sliders,
  User,
  ShieldCheck,
  Moon,
  Sun,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function SettingsPage() {
  const { user, adminProfile, isDemoMode, configured } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [displayName, setDisplayName] = useState(
    adminProfile?.display_name || 'Administrador 7dc'
  )
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('30')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleResetDemoData = () => {
    if (confirm('Deseja resetar os dados locais de demonstração para os padrões de fábrica?')) {
      localStorage.removeItem('7dc_demo_applications')
      localStorage.removeItem('7dc_demo_settings')
      localStorage.removeItem('7dc_demo_commands')
      localStorage.removeItem('7dc_demo_logs')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Configurações do Painel
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Preferências administrativas, perfil de acesso e parâmetros do sistema 7dc.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Preferências atualizadas com sucesso!
        </div>
      )}

      {/* Perfil Administrativo */}
      <Card className="bg-neutral-900/40 border-neutral-800/80">
        <CardHeader className="p-5 border-b border-neutral-800/80">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <User className="h-4 w-4 text-neutral-400" />
            Perfil Administrativo
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Credenciais e identificação da conta que opera o painel 7dc.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Nome de Exibição
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-neutral-900 border-neutral-800 text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                E-mail Administrativo
              </label>
              <Input
                value={user?.email || 'admin@7dc.internal'}
                disabled
                className="bg-neutral-950 border-neutral-800 text-xs h-9 text-neutral-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Badge variant="outline" className="text-xs border-neutral-800 text-neutral-300">
              <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400 inline" />
              Nível de Acesso: {adminProfile?.role || 'Superadmin'}
            </Badge>
            <Badge variant={isDemoMode ? 'warning' : configured ? 'success' : 'secondary'} className="text-xs">
              {isDemoMode ? 'Sandbox Local' : 'Firebase Auth Conectado (artemis-e4d33)'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preferências de Interface */}
      <Card className="bg-neutral-900/40 border-neutral-800/80">
        <CardHeader className="p-5 border-b border-neutral-800/80">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-neutral-400" />
            Preferências de Visualização & Sincronização
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Ajuste de intervalo e tema monocromático.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Tema da Interface
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={theme === 'dark' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={toggleTheme}
                    className="text-xs h-9 border-neutral-800"
                  >
                    <Moon className="h-3.5 w-3.5 mr-1.5" />
                    Modo Escuro (Padrão)
                  </Button>
                  <Button
                    type="button"
                    variant={theme === 'light' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={toggleTheme}
                    className="text-xs h-9 border-neutral-800"
                  >
                    <Sun className="h-3.5 w-3.5 mr-1.5" />
                    Modo Claro
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Intervalo de Polling da Discloud (Segundos)
                </label>
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(e.target.value)}
                  className="h-9 w-full px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200"
                >
                  <option value="15">A cada 15 segundos</option>
                  <option value="30">A cada 30 segundos (Recomendado)</option>
                  <option value="60">A cada 60 segundos</option>
                  <option value="manual">Apenas manual</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              className="bg-white hover:bg-neutral-200 text-black text-xs font-medium"
            >
              Salvar Preferências
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ações de Manutenção / Modo Demo */}
      <Card className="bg-neutral-900/40 border-neutral-800/80">
        <CardHeader className="p-5 border-b border-neutral-800/80">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-neutral-400" />
            Manutenção & Dados de Teste
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Gerenciamento do estado local persistido durante simulações e sandbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs text-neutral-400">
            Se você estiver testando o painel sem credenciais ativas do Supabase, você pode resetar o banco local para o estado inicial a qualquer momento.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDemoData}
            className="text-xs border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Resetar Dados da Demonstração
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
