import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Bot,
  ArrowLeft,
  Play,
  Square,
  RotateCw,
  RefreshCw,
  Terminal,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Save,
  Plus,
  Code2,
} from 'lucide-react'
import { DatabaseService } from '@/services/database-service'
import type {
  BotApplication,
  GeneralBotSettings,
  BotCommand,
} from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function BotDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [application, setApplication] = useState<BotApplication | null>(null)
  const [settings, setSettings] = useState<GeneralBotSettings | null>(null)
  const [commands, setCommands] = useState<BotCommand[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Ações de controle
  const [controlAction, setControlAction] = useState<'start' | 'stop' | 'restart' | null>(null)
  const [actionProcessing, setActionProcessing] = useState(false)

  // Novo comando modal
  const [isAddCmdOpen, setIsAddCmdOpen] = useState(false)
  const [newCmdName, setNewCmdName] = useState('')
  const [newCmdDesc, setNewCmdDesc] = useState('')
  const [newCmdCategory, setNewCmdCategory] = useState('utilitários')
  const [newCmdPerms, setNewCmdPerms] = useState('SendMessages')

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const [app, setts, cmds] = await Promise.all([
        DatabaseService.getApplicationById(id),
        DatabaseService.getSettings(id),
        DatabaseService.getCommands(id),
      ])
      setApplication(app)
      setSettings(setts)
      setCommands(cmds)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveSettings = async () => {
    if (!id || !settings) return
    setSavingSettings(true)
    setSaveSuccess(false)
    try {
      await DatabaseService.saveSettings(id, settings)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleToggleCommand = async (commandId: string, currentEnabled: boolean) => {
    const updated = await DatabaseService.toggleCommand(commandId, !currentEnabled)
    if (updated) {
      setCommands((prev) =>
        prev.map((c) => (c.id === commandId ? { ...c, enabled: !currentEnabled } : c))
      )
    }
  }

  const handleCreateCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newCmdName.trim()) return

    await DatabaseService.createCommand({
      application_id: id,
      name: newCmdName.trim().toLowerCase(),
      description: newCmdDesc.trim() || 'Sem descrição.',
      category: newCmdCategory,
      enabled: true,
      config: {
        slash_command: true,
        required_permissions: [newCmdPerms],
        cooldown_seconds: 3,
      },
    })

    setNewCmdName('')
    setNewCmdDesc('')
    setIsAddCmdOpen(false)
    const updatedCmds = await DatabaseService.getCommands(id)
    setCommands(updatedCmds)
  }

  const handleExecuteControl = async () => {
    if (!application || !controlAction) return
    setActionProcessing(true)

    try {
      let newStatus: BotApplication['status'] = application.status
      if (controlAction === 'start') newStatus = 'online'
      if (controlAction === 'stop') newStatus = 'offline'
      if (controlAction === 'restart') newStatus = 'restarting'

      await DatabaseService.updateApplication(application.id, {
        status: newStatus,
        last_synced_at: new Date().toISOString(),
      })

      await DatabaseService.logAuditEvent(
        `discloud_control_${controlAction}`,
        controlAction === 'stop' ? 'warn' : 'info',
        { discloud_app_id: application.discloud_app_id, action: controlAction },
        application.id
      )

      if (controlAction === 'restart') {
        setTimeout(async () => {
          await DatabaseService.updateApplication(application.id, {
            status: 'online',
            last_synced_at: new Date().toISOString(),
          })
          await loadData()
        }, 2000)
      }

      await loadData()
      setControlAction(null)
    } finally {
      setActionProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-neutral-900" />
        <Skeleton className="h-32 w-full rounded-xl bg-neutral-900" />
        <Skeleton className="h-64 w-full rounded-xl bg-neutral-900" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-16 space-y-4">
        <Bot className="h-12 w-12 text-neutral-600 mx-auto" />
        <h2 className="text-lg font-semibold text-white">Aplicação não encontrada</h2>
        <p className="text-xs text-neutral-400">
          O bot solicitado não existe ou você não possui permissão para acessá-lo.
        </p>
        <Link to="/bots">
          <Button variant="outline" size="sm" className="mt-2 text-xs border-neutral-800">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar para Meus Bots
          </Button>
        </Link>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="success">Online na Discloud</Badge>
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>
      case 'error':
        return <Badge variant="destructive">Falha / Erro de Execução</Badge>
      case 'restarting':
        return <Badge variant="warning">Reiniciando Container...</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Navigation and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/bots')}
            className="h-8 w-8 text-neutral-400 hover:text-white"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {application.name}
              </h1>
              {getStatusBadge(application.status)}
              <Badge
                variant="outline"
                className="text-[10px] text-neutral-400 border-neutral-800"
              >
                {application.is_manual ? 'Cadastro Manual' : 'Descoberta pela API'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              ID Discloud: <span className="text-neutral-300">{application.discloud_app_id}</span>
              {' • '}
              Última consulta:{' '}
              {application.last_synced_at
                ? new Date(application.last_synced_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'Pendente'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {application.status === 'offline' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setControlAction('start')}
              className="text-xs border-neutral-800 hover:bg-emerald-950/40 hover:text-emerald-300"
            >
              <Play className="h-3 w-3 mr-1.5 text-emerald-400" />
              Iniciar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setControlAction('stop')}
              className="text-xs border-neutral-800 hover:bg-amber-950/40 hover:text-amber-300"
            >
              <Square className="h-3 w-3 mr-1.5 text-amber-400" />
              Parar
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setControlAction('restart')}
            className="text-xs border-neutral-800 hover:bg-neutral-800 text-neutral-300"
          >
            <RotateCw className="h-3 w-3 mr-1.5" />
            Reiniciar
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            className="h-8 w-8 text-neutral-400 hover:text-white"
            title="Recarregar dados"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-neutral-900 border-neutral-800">
          <TabsTrigger value="overview">Visão Geral & Discloud</TabsTrigger>
          <TabsTrigger value="settings">Configurações do Bot</TabsTrigger>
          <TabsTrigger value="commands">Catálogo de Comandos</TabsTrigger>
          <TabsTrigger value="moderation">Moderação & Segurança</TabsTrigger>
          <TabsTrigger value="integration">API do Bot Discord</TabsTrigger>
        </TabsList>

        {/* TAB 1: VISÃO GERAL & DISCLOUD */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-neutral-900/40 border-neutral-800/80">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-neutral-400 flex items-center justify-between">
                  Status do Processo
                  <Bot className="h-4 w-4 text-neutral-500" />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg font-bold text-white uppercase font-mono">
                  {application.status}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Discloud Container</p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900/40 border-neutral-800/80">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-neutral-400 flex items-center justify-between">
                  Memória RAM Alocada
                  <Cpu className="h-4 w-4 text-neutral-500" />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg font-bold text-neutral-200">
                  {application.status === 'online' ? '128 MB / 512 MB' : '0 MB (Inativo)'}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Limite do Plano</p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900/40 border-neutral-800/80">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-neutral-400 flex items-center justify-between">
                  Tempo Ativo (Uptime)
                  <Clock className="h-4 w-4 text-neutral-500" />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg font-bold text-neutral-200">
                  {application.status === 'online' ? '99.8% (5 dias)' : 'Parado'}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Desde o último start</p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900/40 border-neutral-800/80">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-neutral-400 flex items-center justify-between">
                  Ambiente de Execução
                  <Terminal className="h-4 w-4 text-neutral-500" />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-sm font-semibold text-neutral-200 mt-1">
                  Node.js v20.x
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">discord.js v14</p>
              </CardContent>
            </Card>
          </div>

          {/* Console / Logs da Discloud */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader className="p-4 border-b border-neutral-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-neutral-300 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-neutral-400" />
                  Terminal & Logs do Container Discloud
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono border-neutral-800 text-neutral-400">
                  stdout / stderr
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 font-mono text-xs text-neutral-400 bg-neutral-950/80 rounded-b-xl overflow-x-auto space-y-1">
              <div className="text-neutral-500">
                [2026-10-25 12:45:01] [DISCLOUD-INIT] Verificando arquivo discloud.config...
              </div>
              <div className="text-neutral-500">
                [2026-10-25 12:45:02] [DISCLOUD-INIT] Inicializando container Node.js v20.12.0...
              </div>
              <div className="text-neutral-300">
                [2026-10-25 12:45:04] [INFO] Conectado à API do Discord como {application.name}#0000
              </div>
              <div className="text-neutral-300">
                [2026-10-25 12:45:05] [INFO] 7dc Bridge Client: Carregando preferências de configuração...
              </div>
              <div className="text-emerald-400">
                [2026-10-25 12:45:06] [READY] Aplicação pronta e escutando eventos de guild.
              </div>
              {application.status === 'error' && (
                <div className="text-red-400 font-semibold pt-1">
                  [2026-10-25 12:59:12] [FATAL] Processo encerrou inesperadamente com código 1 (UnhandledPromiseRejection).
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CONFIGURAÇÕES DO BOT */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardHeader className="p-5 border-b border-neutral-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-white">
                    Preferências do Bot
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 mt-1">
                    Estas definições são salvas no banco de dados e consumidas pelo processo do bot na Discloud.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-white hover:bg-neutral-200 text-black text-xs font-medium"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Configurações salvas no banco com sucesso!
                </div>
              )}

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Prefixo Tradicional (Opcional)
                  </label>
                  <Input
                    value={settings?.prefix || '!'}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, prefix: e.target.value } : null
                      )
                    }
                    className="bg-neutral-900 border-neutral-800 text-xs h-9 font-mono"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Utilizado para comandos de texto legados.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Idioma Principal
                  </label>
                  <select
                    value={settings?.language || 'pt-BR'}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, language: e.target.value } : null
                      )
                    }
                    className="h-9 w-full px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200"
                  >
                    <option value="pt-BR">Português (pt-BR)</option>
                    <option value="en-US">English (en-US)</option>
                    <option value="es-ES">Español (es-ES)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Fuso Horário
                  </label>
                  <select
                    value={settings?.timezone || 'America/Sao_Paulo'}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, timezone: e.target.value } : null
                      )
                    }
                    className="h-9 w-full px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200"
                  >
                    <option value="America/Sao_Paulo">Brasília (UTC-3)</option>
                    <option value="UTC">UTC Universal</option>
                    <option value="America/New_York">Eastern Time (UTC-5)</option>
                  </select>
                </div>
              </div>

              {/* Módulos Habilitados */}
              <div className="space-y-3 pt-3 border-t border-neutral-800/80">
                <h3 className="text-sm font-semibold text-white">
                  Módulos de Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'moderation', label: 'Moderação Automática', desc: 'Filtros de chat, anti-spam e ações punitivas' },
                    { key: 'automations', label: 'Automações & Gatilhos', desc: 'Respostas prontas, cargos automáticos e boas-vindas' },
                    { key: 'logs', label: 'Auditoria de Eventos', desc: 'Envio de logs para canal Discord dedicado' },
                    { key: 'tickets', label: 'Central de Tickets', desc: 'Abertura de chamados por botões e formulários modais' },
                    { key: 'leveling', label: 'Sistema de Níveis & XP', desc: 'Recompensas de cargos por engajamento no chat' },
                  ].map((mod) => (
                    <div
                      key={mod.key}
                      className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 flex items-center justify-between"
                    >
                      <div className="space-y-0.5 pr-2">
                        <p className="text-xs font-medium text-neutral-200">
                          {mod.label}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {mod.desc}
                        </p>
                      </div>
                      <Switch
                        checked={
                          Boolean(
                            settings?.modules?.[
                              mod.key as keyof typeof settings.modules
                            ]
                          )
                        }
                        onCheckedChange={(checked) =>
                          setSettings((prev) => {
                            if (!prev) return null
                            return {
                              ...prev,
                              modules: {
                                ...prev.modules,
                                [mod.key]: checked,
                              },
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CATÁLOGO DE COMANDOS */}
        <TabsContent value="commands" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Comandos Registrados ({commands.length})
              </h2>
              <p className="text-xs text-neutral-400">
                Diferenciação clara entre configuração no painel e registro efetivo no Discord.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddCmdOpen(true)}
              className="bg-white hover:bg-neutral-200 text-black text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo Comando
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {commands.map((cmd) => (
              <Card
                key={cmd.id}
                className="bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700/80 transition-all"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">
                        /{cmd.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase border-neutral-800 text-neutral-400">
                        {cmd.category}
                      </Badge>
                      <Badge
                        variant={cmd.enabled ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {cmd.enabled ? 'Habilitado' : 'Desabilitado'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {cmd.description}
                    </p>
                    <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-2">
                      <span>Permissão: {cmd.config.required_permissions?.join(', ') || 'Nenhuma'}</span>
                      <span>•</span>
                      <span>Cooldown: {cmd.config.cooldown_seconds || 3}s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={cmd.enabled}
                      onCheckedChange={() => handleToggleCommand(cmd.id, cmd.enabled)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: MODERAÇÃO & SEGURANÇA */}
        <TabsContent value="moderation" className="space-y-4">
          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardHeader className="p-5 border-b border-neutral-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-neutral-400" />
                    Parâmetros de Moderação Automática
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 mt-1">
                    Configure os limites e ações do bot para proteção dos membros e servidores.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-white hover:bg-neutral-200 text-black text-xs font-medium"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Salvar Moderação
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    ID do Canal de Logs no Discord
                  </label>
                  <Input
                    placeholder="Ex: 123456789012345678"
                    value={settings?.moderation.log_channel_id || ''}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              moderation: {
                                ...prev.moderation,
                                log_channel_id: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                    className="bg-neutral-900 border-neutral-800 text-xs font-mono h-9"
                  />
                  <p className="text-[10px] text-neutral-500">
                    O bot deve ter permissão de Enviar Mensagens e Embeds no canal indicado.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Limite de Mensagens p/ Auto-Mute (Anti-Spam)
                  </label>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    value={settings?.moderation.auto_mute_limit || 5}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              moderation: {
                                ...prev.moderation,
                                auto_mute_limit: Number(e.target.value),
                              },
                            }
                          : null
                      )
                    }
                    className="bg-neutral-900 border-neutral-800 text-xs h-9"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Número de mensagens em menos de 5 segundos antes de aplicar mute.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-200">
                      Filtro Anti-Spam
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Detecta e exclui mensagens idênticas enviadas repetidamente.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(settings?.moderation.anti_spam)}
                    onCheckedChange={(checked) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              moderation: {
                                ...prev.moderation,
                                anti_spam: checked,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-200">
                      Filtro Anti-Invite
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Bloqueia links de convite de outros servidores Discord (discord.gg).
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(settings?.moderation.anti_invite)}
                    onCheckedChange={(checked) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              moderation: {
                                ...prev.moderation,
                                anti_invite: checked,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: INTEGRAÇÃO & CONTRATO API */}
        <TabsContent value="integration" className="space-y-4">
          <Card className="bg-neutral-900/40 border-neutral-800/80">
            <CardHeader className="p-5 border-b border-neutral-800/80">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Code2 className="h-4 w-4 text-neutral-400" />
                Contrato de Comunicação entre Painel e Bot
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Como o serviço do bot na Discloud obtém suas configurações e reporta status de forma segura.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-neutral-200 font-semibold font-mono">
                  GET /api/v1/bots/{application.discloud_app_id}/config
                </div>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  O bot autentica via token de serviço seguro (<code className="text-neutral-300 font-mono">X-Bot-Token</code>) armazenado no ambiente da Discloud. O painel web nunca armazena o token do bot no frontend.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-neutral-300">
                  Exemplo de Resposta JSON da API:
                </p>
                <pre className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto">
{JSON.stringify(
  {
    application_id: application.id,
    discloud_app_id: application.discloud_app_id,
    prefix: settings?.prefix,
    modules: settings?.modules,
    moderation: settings?.moderation,
    active_commands: commands.filter((c) => c.enabled).map((c) => c.name),
  },
  null,
  2
)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação de Controle */}
      <Dialog
        open={Boolean(controlAction)}
        onOpenChange={(open) => !actionProcessing && !open && setControlAction(null)}
      >
        <DialogContent className="sm:max-w-md bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Confirmar Operação na Discloud
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              {controlAction === 'stop' &&
                `Tem certeza que deseja desligar o container de "${application.name}"?`}
              {controlAction === 'restart' &&
                `Deseja reiniciar imediatamente a aplicação "${application.name}"?`}
              {controlAction === 'start' &&
                `Deseja iniciar a execução de "${application.name}" na Discloud?`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionProcessing}
              onClick={() => setControlAction(null)}
              className="border-neutral-800 text-neutral-300 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionProcessing}
              onClick={handleExecuteControl}
              className={`text-xs font-medium ${
                controlAction === 'stop'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-white hover:bg-neutral-200 text-black'
              }`}
            >
              {actionProcessing ? 'Executando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Novo Comando */}
      <Dialog open={isAddCmdOpen} onOpenChange={setIsAddCmdOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-white">
              Cadastrar Novo Comando
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Adicione um comando ao catálogo do bot {application.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCommand} className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Nome do Comando (sem barra) *
              </label>
              <Input
                placeholder="Ex: warn, avatar, status"
                value={newCmdName}
                onChange={(e) => setNewCmdName(e.target.value)}
                required
                className="bg-neutral-900 border-neutral-800 text-xs font-mono h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">
                Descrição do Comando *
              </label>
              <Input
                placeholder="Ex: Exibe advertência formal a um membro"
                value={newCmdDesc}
                onChange={(e) => setNewCmdDesc(e.target.value)}
                required
                className="bg-neutral-900 border-neutral-800 text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Categoria
                </label>
                <select
                  value={newCmdCategory}
                  onChange={(e) => setNewCmdCategory(e.target.value)}
                  className="h-9 w-full px-2 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200"
                >
                  <option value="moderação">Moderação</option>
                  <option value="utilitários">Utilitários</option>
                  <option value="diversão">Diversão</option>
                  <option value="automação">Automação</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">
                  Permissão Discord
                </label>
                <select
                  value={newCmdPerms}
                  onChange={(e) => setNewCmdPerms(e.target.value)}
                  className="h-9 w-full px-2 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-200"
                >
                  <option value="SendMessages">Nenhuma (Público)</option>
                  <option value="ModerateMembers">Moderar Membros</option>
                  <option value="KickMembers">Expulsar Membros</option>
                  <option value="BanMembers">Banir Membros</option>
                  <option value="ManageGuild">Gerenciar Servidor</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCmdOpen(false)}
                className="border-neutral-800 text-neutral-300 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-white text-black hover:bg-neutral-200 text-xs font-medium"
              >
                Cadastrar Comando
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
