import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Search,
  Plus,
  Play,
  Square,
  RotateCw,
  Trash2,
  Sliders,
  AlertTriangle,
} from 'lucide-react'
import { DatabaseService } from '@/services/database-service'
import type { BotApplication } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function BotsPage() {
  const [applications, setApplications] = useState<BotApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [originFilter, setOriginFilter] = useState<string>('all')

  // Modais de Controle e Ações
  const [actionModal, setActionModal] = useState<{
    open: boolean
    type: 'start' | 'stop' | 'restart' | 'delete'
    app: BotApplication | null
  }>({
    open: false,
    type: 'restart',
    app: null,
  })
  const [actionLoading, setActionLoading] = useState(false)

  // Modal para Adicionar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [newDiscloudId, setNewDiscloudId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isManual, setIsManual] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const loadApplications = async () => {
    try {
      const data = await DatabaseService.getApplications()
      setApplications(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        search === '' ||
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.discloud_app_id.toLowerCase().includes(search.toLowerCase()) ||
        (app.description && app.description.toLowerCase().includes(search.toLowerCase()))

      const matchStatus =
        statusFilter === 'all' || app.status === statusFilter

      const matchOrigin =
        originFilter === 'all' ||
        (originFilter === 'manual' && app.is_manual) ||
        (originFilter === 'discovered' && !app.is_manual)

      return matchSearch && matchStatus && matchOrigin
    })
  }, [applications, search, statusFilter, originFilter])

  const handleConfirmAction = async () => {
    if (!actionModal.app) return
    setActionLoading(true)

    const app = actionModal.app
    try {
      if (actionModal.type === 'delete') {
        await DatabaseService.deleteApplication(app.id)
      } else {
        let newStatus: BotApplication['status'] = app.status
        if (actionModal.type === 'start') newStatus = 'online'
        if (actionModal.type === 'stop') newStatus = 'offline'
        if (actionModal.type === 'restart') newStatus = 'restarting'

        await DatabaseService.updateApplication(app.id, {
          status: newStatus,
          last_synced_at: new Date().toISOString(),
        })

        await DatabaseService.logAuditEvent(
          `app_action_${actionModal.type}`,
          actionModal.type === 'stop' ? 'warn' : 'info',
          { app_id: app.id, discloud_id: app.discloud_app_id, action: actionModal.type },
          app.id
        )

        // Se foi reiniciar, simula retorno a online após 2 segundos
        if (actionModal.type === 'restart') {
          setTimeout(async () => {
            await DatabaseService.updateApplication(app.id, {
              status: 'online',
              last_synced_at: new Date().toISOString(),
            })
            await loadApplications()
          }, 2000)
        }
      }

      await loadApplications()
      setActionModal({ open: false, type: 'restart', app: null })
    } finally {
      setActionLoading(false)
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

      setNewAppName('')
      setNewDiscloudId('')
      setNewDescription('')
      setNewNotes('')
      setIsManual(true)
      setIsAddModalOpen(false)
      await loadApplications()
    } finally {
      setFormSubmitting(false)
    }
  }

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Meus Bots Discord
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Gerenciamento completo das aplicações, parâmetros de execução e status na Discloud.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-white hover:bg-neutral-200 text-black font-medium text-xs h-9"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Cadastrar Aplicação
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Buscar por nome, Discloud ID ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-neutral-900/60 border-neutral-800 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500 cursor-pointer w-full md:w-auto"
          >
            <option value="all">Status: Todos</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="error">Com Erro</option>
            <option value="restarting">Reiniciando</option>
          </select>

          {/* Origin Filter */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-500 cursor-pointer w-full md:w-auto"
          >
            <option value="all">Origem: Todas</option>
            <option value="manual">Manual</option>
            <option value="discovered">Descoberta</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl bg-neutral-900/60" />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <Card className="bg-neutral-900/30 border-neutral-800/60 text-center py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-neutral-800/80 flex items-center justify-center text-neutral-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">
                Nenhuma aplicação encontrada
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {search || statusFilter !== 'all' || originFilter !== 'all'
                  ? 'Tente ajustar os filtros ou a busca textual.'
                  : 'Cadastre sua primeira aplicação para começar.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredApps.map((app) => (
            <Card
              key={app.id}
              className="bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700/80 transition-all group"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-neutral-800/90 border border-neutral-700/60 flex items-center justify-center text-white shrink-0 group-hover:bg-neutral-800 transition-colors">
                    <Bot className="h-6 w-6 text-neutral-300" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/bots/${app.id}`}
                        className="font-bold text-base text-neutral-100 hover:text-white transition-colors"
                      >
                        {app.name}
                      </Link>
                      {getStatusBadge(app.status)}
                      <Badge
                        variant="outline"
                        className="text-[10px] text-neutral-400 border-neutral-800"
                      >
                        {app.is_manual ? 'Cadastro Manual' : 'Descoberta pela API'}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
                      {app.description || 'Sem descrição cadastrada no momento.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500 font-mono">
                      <span>ID Discloud: <strong>{app.discloud_app_id}</strong></span>
                      <span>•</span>
                      <span>
                        Sincronizado:{' '}
                        {app.last_synced_at
                          ? new Date(app.last_synced_at).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Pendente'}
                      </span>
                      {app.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-neutral-400">"{app.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/60 w-full md:w-auto justify-end">
                  {/* Start / Stop Toggle */}
                  {app.status === 'offline' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setActionModal({ open: true, type: 'start', app })
                      }
                      className="h-8 text-xs border-neutral-800 hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-800"
                      title="Iniciar aplicação na Discloud"
                    >
                      <Play className="h-3 w-3 mr-1 text-emerald-400" />
                      Iniciar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setActionModal({ open: true, type: 'stop', app })
                      }
                      className="h-8 text-xs border-neutral-800 hover:bg-amber-950/40 hover:text-amber-300 hover:border-amber-800"
                      title="Parar aplicação na Discloud"
                    >
                      <Square className="h-3 w-3 mr-1 text-amber-400" />
                      Parar
                    </Button>
                  )}

                  {/* Restart */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setActionModal({ open: true, type: 'restart', app })
                    }
                    className="h-8 text-xs border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                    title="Reiniciar aplicação"
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    Reiniciar
                  </Button>

                  {/* Manage / Details */}
                  <Link to={`/bots/${app.id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs bg-neutral-800 hover:bg-neutral-700 text-white"
                    >
                      <Sliders className="h-3 w-3 mr-1" />
                      Gerenciar
                    </Button>
                  </Link>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setActionModal({ open: true, type: 'delete', app })
                    }
                    className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-red-950/30"
                    title="Remover registro"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Destructive / Control Actions */}
      <Dialog
        open={actionModal.open}
        onOpenChange={(open) => !actionLoading && setActionModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Confirmar Ação de Controle
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              {actionModal.type === 'delete' &&
                `Tem certeza que deseja remover o registro de "${actionModal.app?.name}"? Esta ação remove as configurações locais e do banco.`}
              {actionModal.type === 'stop' &&
                `Tem certeza que deseja parar o container de "${actionModal.app?.name}" na Discloud? O bot ficará offline até ser iniciado novamente.`}
              {actionModal.type === 'restart' &&
                `Deseja enviar comando de reinício para o bot "${actionModal.app?.name}" na Discloud?`}
              {actionModal.type === 'start' &&
                `Deseja iniciar o container de "${actionModal.app?.name}" na Discloud?`}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1">
            <div className="text-neutral-400">
              Aplicação: <span className="text-white font-medium">{actionModal.app?.name}</span>
            </div>
            <div className="text-neutral-400 font-mono text-[11px]">
              ID Discloud: <span className="text-neutral-300">{actionModal.app?.discloud_app_id}</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => setActionModal({ open: false, type: 'restart', app: null })}
              className="border-neutral-800 text-neutral-300 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionLoading}
              onClick={handleConfirmAction}
              className={`text-xs font-medium ${
                actionModal.type === 'delete' || actionModal.type === 'stop'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-white hover:bg-neutral-200 text-black'
              }`}
            >
              {actionLoading
                ? 'Processando...'
                : actionModal.type === 'delete'
                ? 'Confirmar Exclusão'
                : actionModal.type === 'stop'
                ? 'Confirmar Parada'
                : actionModal.type === 'start'
                ? 'Iniciar Bot'
                : 'Confirmar Reinício'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                id="modalIsManual"
                checked={isManual}
                onChange={(e) => setIsManual(e.target.checked)}
                className="rounded border-neutral-800 text-neutral-100 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="modalIsManual"
                className="text-xs text-neutral-300 cursor-pointer select-none"
              >
                Cadastrado manualmente
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
