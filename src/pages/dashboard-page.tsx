import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Layers,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { DatabaseService } from '@/services/database-service'
import type { BotApplication, AuditLog } from '@/types/database'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function DashboardPage() {
  const [applications, setApplications] = useState<BotApplication[]>([])
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // Modal para cadastrar aplicação
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [newDiscloudId, setNewDiscloudId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isManual, setIsManual] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [apps, logs] = await Promise.all([
        DatabaseService.getApplications(),
        DatabaseService.getAuditLogs(),
      ])
      setApplications(apps)
      setRecentLogs(logs.slice(0, 5))
      setLastSyncTime(new Date())
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      // Simulação / chamada de sincronização
      await new Promise((resolve) => setTimeout(resolve, 800))
      await DatabaseService.logAuditEvent('batch_sync', 'info', {
        count: applications.length,
        source: 'dashboard_manual_trigger',
      })
      await loadData()
    } finally {
      setSyncing(false)
    }
  }

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAppName.trim() || !newDiscloudId.trim()) return

    setFormSubmitting(true)
    try {
      await DatabaseService.createApplication({
        owner_id: '00000000-0000-0000-0000-000000000001',
        name: newAppName.trim(),
        discloud_app_id: newDiscloudId.trim(),
        description: newDescription.trim() || null,
        notes: newNotes.trim() || null,
        status: 'online',
        is_manual: isManual,
        last_synced_at: new Date().toISOString(),
      })

      // Reset form
      setNewAppName('')
      setNewDiscloudId('')
      setNewDescription('')
      setNewNotes('')
      setIsManual(true)
      setIsAddModalOpen(false)
      await loadData()
    } finally {
      setFormSubmitting(false)
    }
  }

  // Contadores
  const totalApps = applications.length
  const onlineApps = applications.filter((a) => a.status === 'online').length
  const offlineApps = applications.filter((a) => a.status === 'offline').length
  const errorApps = applications.filter((a) => a.status === 'error').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="success">Online</Badge>
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>
      case 'error':
        return <Badge variant="destructive">Com Erro</Badge>
      case 'restarting':
        return <Badge variant="warning">Reiniciando</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Visão Geral da Frota
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monitoramento de status, integridade e hospedagem na Discloud em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncing || loading}
            className="border-neutral-800 text-neutral-300 hover:text-white"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white hover:bg-neutral-200 text-black font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova Aplicação
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-neutral-900/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {/* Total */}
          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-neutral-400 flex items-center justify-between">
                Total de Aplicações
                <Layers className="h-4 w-4 text-neutral-500" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-white">{totalApps}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Registradas no 7dc</p>
            </CardContent>
          </Card>

          {/* Online */}
          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-neutral-400 flex items-center justify-between">
                Online
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-400">{onlineApps}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Operando normalmente</p>
            </CardContent>
          </Card>

          {/* Offline */}
          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-neutral-400 flex items-center justify-between">
                Offline
                <Activity className="h-4 w-4 text-neutral-500" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-neutral-300">{offlineApps}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Containers desligados</p>
            </CardContent>
          </Card>

          {/* Com Erro */}
          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-neutral-400 flex items-center justify-between">
                Com Erro
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-red-400">{errorApps}</div>
              <p className="text-[11px] text-neutral-500 mt-1">Requerem intervenção</p>
            </CardContent>
          </Card>

          {/* Última Sincronização */}
          <Card className="bg-neutral-900/40 border-neutral-800/80 col-span-2 sm:col-span-1">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-neutral-400 flex items-center justify-between">
                Última Consulta
                <Clock className="h-4 w-4 text-neutral-500" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm font-semibold text-neutral-200 mt-1">
                {lastSyncTime.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">API Discloud Bridge</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Grid: Applications Table + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Bot className="h-4 w-4 text-neutral-400" />
              Aplicações Vinculadas
            </h2>
            <Link
              to="/bots"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Ver todas ({totalApps})
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl bg-neutral-900/60" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <Card className="bg-neutral-900/30 border-neutral-800/60 text-center py-10">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-neutral-800/80 flex items-center justify-center text-neutral-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    Nenhuma aplicação cadastrada
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Adicione seu primeiro bot para monitorar status e configurações.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-white text-black hover:bg-neutral-200 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Aplicação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Card
                  key={app.id}
                  className="bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700/80 transition-all group"
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-lg bg-neutral-800/90 border border-neutral-700/60 flex items-center justify-center text-white shrink-0 group-hover:bg-neutral-800 transition-colors">
                        <Bot className="h-5 w-5 text-neutral-300" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/bots/${app.id}`}
                            className="font-semibold text-sm text-neutral-100 hover:text-white transition-colors"
                          >
                            {app.name}
                          </Link>
                          {getStatusBadge(app.status)}
                          <Badge
                            variant="outline"
                            className="text-[10px] text-neutral-400 border-neutral-800"
                          >
                            {app.is_manual ? 'Manual' : 'Descoberta'}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-1">
                          {app.description || 'Sem descrição cadastrada.'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                          <span>ID: {app.discloud_app_id}</span>
                          <span>•</span>
                          <span>
                            Sync:{' '}
                            {app.last_synced_at
                              ? new Date(app.last_synced_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link to={`/bots/${app.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                        >
                          Gerenciar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Column: Recent Activity Logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-neutral-400" />
              Atividades Recentes
            </h2>
            <Link
              to="/logs"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Histórico
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardContent className="p-4 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full bg-neutral-900" />
                  ))}
                </div>
              ) : recentLogs.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-6">
                  Nenhuma atividade registrada ainda.
                </p>
              ) : (
                <div className="space-y-3 divide-y divide-neutral-800/60">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="pt-3 first:pt-0 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-medium text-neutral-200">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(log.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {log.application_name || 'Sistema 7dc'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info Box */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-neutral-200">
              <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
              <span>Regra de Operação</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              As ações de controle (iniciar, parar e reiniciar) são enviadas de forma segura ao backend e exigem confirmação explícita.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Cadastrar Aplicação */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-white">
              Cadastrar Nova Aplicação
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Vincule um bot Discord hospedado na Discloud ao painel 7dc.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateApplication} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Nome do Bot *
              </label>
              <Input
                placeholder="Ex: Moderador Alpha"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                required
                className="bg-neutral-900 border-neutral-800 text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Identificador na Discloud (App ID) *
              </label>
              <Input
                placeholder="Ex: app-123456 ou subdomínio"
                value={newDiscloudId}
                onChange={(e) => setNewDiscloudId(e.target.value)}
                required
                className="bg-neutral-900 border-neutral-800 text-xs font-mono h-9"
              />
              <p className="text-[10px] text-neutral-500">
                Disponível no painel da Discloud ou na resposta da API.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Descrição do Bot
              </label>
              <Input
                placeholder="Ex: Responsável por tickets e moderação automática"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="bg-neutral-900 border-neutral-800 text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Observações internas
              </label>
              <Input
                placeholder="Ex: Hospedado no plano Platinum Discloud"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-neutral-900 border-neutral-800 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isManualCheck"
                checked={isManual}
                onChange={(e) => setIsManual(e.target.checked)}
                className="rounded border-neutral-800 text-neutral-100 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="isManualCheck"
                className="text-xs text-neutral-300 cursor-pointer select-none"
              >
                Cadastrado manualmente (não descoberto via sync automática)
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="border-neutral-800 text-neutral-300 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={formSubmitting || !newAppName.trim() || !newDiscloudId.trim()}
                className="bg-white text-black hover:bg-neutral-200 text-xs font-medium"
              >
                {formSubmitting ? 'Salvando...' : 'Cadastrar Aplicação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
