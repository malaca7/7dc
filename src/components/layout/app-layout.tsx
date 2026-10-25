import { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  Sliders,
  ScrollText,
  Blocks,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ShieldCheck,
  Radio,
  Server,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Meus bots', path: '/bots', icon: Bot },
  { label: 'Configurações', path: '/configuracoes', icon: Sliders },
  { label: 'Logs e atividades', path: '/logs', icon: ScrollText },
  { label: 'Integrações', path: '/integracoes', icon: Blocks },
]

export function AppLayout() {
  const { user, adminProfile, isDemoMode, configured, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isCurrentPath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row antialiased selection:bg-neutral-800 selection:text-white dark:bg-[#0a0a0a]">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d0d] border-r border-neutral-800/80 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-800/80">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="h-7 w-7 rounded-md bg-white text-black flex items-center justify-center font-black text-xs shadow-sm">
              7d
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-none text-neutral-100">
                7dc
              </span>
              <span className="text-[10px] text-neutral-500 font-normal mt-0.5 tracking-wider uppercase">
                Bot Operations
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-neutral-400 hover:text-white p-1 rounded-md"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Integration Status Indicator */}
        <div className="px-4 py-2.5 mx-3 mt-3 rounded-lg border border-neutral-800 bg-neutral-900/40 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 font-medium flex items-center gap-1.5">
              <Radio
                className={cn(
                  'h-3.5 w-3.5 animate-pulse',
                  isDemoMode ? 'text-amber-400' : configured ? 'text-emerald-400' : 'text-neutral-400'
                )}
              />
              Ambiente
            </span>
            <Badge
              variant={isDemoMode ? 'warning' : configured ? 'success' : 'secondary'}
              className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0"
            >
              {isDemoMode ? 'Demonstração' : configured ? 'Firebase' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isCurrentPath(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group select-none',
                  active
                    ? 'bg-neutral-800/90 text-white shadow-sm border border-neutral-700/60'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    active ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Quick Discloud Link Indicator */}
        <div className="px-4 py-3 mx-3 mb-2 rounded-lg bg-neutral-900/30 border border-neutral-800/60">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Server className="h-3.5 w-3.5 text-neutral-400" />
            <span>Discloud App Bridge</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
            {isDemoMode
              ? 'Conexão simulada via Sandbox 7dc.'
              : 'Conexão segura via backend.'}
          </p>
        </div>

        {/* Sidebar Footer: Profile and Controls */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center justify-between gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 text-left p-1.5 rounded-lg hover:bg-neutral-900 transition-colors w-full overflow-hidden text-neutral-200">
                  <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold shrink-0 text-white">
                    {adminProfile?.display_name?.charAt(0) || 'A'}
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-medium text-neutral-100 truncate">
                      {adminProfile?.display_name || user?.email || 'Administrador'}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-neutral-400 inline" />
                      {adminProfile?.role || 'Superadmin'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800">
                <DropdownMenuLabel>
                  <span className="text-xs font-normal text-neutral-400">Autenticado como</span>
                  <div className="font-semibold text-sm truncate text-white">
                    {adminProfile?.display_name || 'Admin'}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate">
                    {user?.email || 'admin@7dc.internal'}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" /> Modo Claro
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" /> Modo Escuro
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-400 focus:text-red-400 focus:bg-red-950/40 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Encerrar sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-neutral-400 hover:text-white h-8 w-8 shrink-0"
              title="Alternar tema"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile / Tablet Header */}
        <header className="h-14 border-b border-neutral-800/80 px-4 flex items-center justify-between md:hidden bg-[#0d0d0d] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-300"
              aria-label="Abrir menu lateral"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="h-6 w-6 rounded bg-white text-black flex items-center justify-center text-xs font-black">
                7d
              </span>
              <span className="text-sm">7dc</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-neutral-400 hover:text-red-400 h-8 w-8"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Demo Mode Banner (se ativo) */}
        {isDemoMode && (
          <div className="bg-amber-950/30 border-b border-amber-900/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                <strong>Modo de Demonstração Ativo:</strong> Dados armazenados localmente e integrações simuladas. As credenciais do Firebase (artemis-e4d33) estão prontas no arquivo <code className="bg-amber-900/40 px-1 py-0.5 rounded text-[11px]">.env</code> para autenticação real.
              </span>
            </div>
            <Link
              to="/integracoes"
              className="underline text-amber-300 hover:text-white font-medium shrink-0 ml-4 hidden sm:inline"
            >
              Configurar Integrações →
            </Link>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
