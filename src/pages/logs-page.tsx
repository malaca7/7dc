import { useEffect, useState, useMemo } from 'react'
import {
  ScrollText,
  Search,
  RefreshCw,
  Eye,
  Shield,
  AlertTriangle,
  Info,
  AlertOctagon,
  Bot,
} from 'lucide-react'
import { DatabaseService } from '@/services/database-service'
import type { AuditLog, BotApplication } from '@/types/database'
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
} from '@/components/ui/dialog'

export function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [applications, setApplications] = useState<BotApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [appFilter, setAppFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const [allLogs, apps] = await Promise.all([
        DatabaseService.getAuditLogs(),
        DatabaseService.getApplications(),
      ])
      setLogs(allLogs)
      setApplications(apps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        search === '' ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.application_name &&
          log.application_name.toLowerCase().includes(search.toLowerCase())) ||
        JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase())

      const matchLevel = levelFilter === 'all' || log.level === levelFilter
      const matchApp = appFilter === 'all' || log.application_id === appFilter

      return matchSearch && matchLevel && matchApp
    })
  }, [logs, search, levelFilter, appFilter])

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return (
          <Badge variant="outline" className="text-neutral-300 border-neutral-700 text-[10px]">
            <Info className="h-3 w-3 mr-1 text-blue-400" />
            INFO
          </Badge>
        )
      case 'warn':
        return (
          <Badge variant="warning" className="text-[10px]">
            <AlertTriangle className="h-3 w-3 mr-1" />
            WARN
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="text-[10px]">
            <AlertOctagon className="h-3 w-3 mr-1" />
            ERROR
          </Badge>
        )
      case 'security':
        return (
          <Badge variant="default" className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800">
            <Shield className="h-3 w-3 mr-1 text-purple-400" />
            SECURITY
          </Badge>
        )
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Logs e Auditoria do Sistema
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Registro cronológico e imutável de ações administrativas, erros de integração e comandos de controle.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={loading}
          className="text-xs border-neutral-800 text-neutral-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Logs
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Buscar por ação, mensagem, bot ou payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-neutral-900/60 border-neutral-800 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 focus:outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="all">Nível: Todos</option>
            <option value="info">Info</option>
            <option value="warn">Avisos (Warn)</option>
            <option value="error">Erros</option>
            <option value="security">Segurança</option>
          </select>

          {/* Application Filter */}
          <select
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 focus:outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="all">Aplicação: Todas</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>

          {(search || levelFilter !== 'all' || appFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setLevelFilter('all')
                setAppFilter('all')
              }}
              className="text-xs text-neutral-400 hover:text-white h-9 px-2.5"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full bg-neutral-900/60" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="bg-neutral-900/30 border-neutral-800/60 text-center py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <ScrollText className="h-10 w-10 text-neutral-600" />
            <p className="text-sm font-medium text-neutral-300">
              Nenhum evento registrado encontrado
            </p>
            <p className="text-xs text-neutral-500">
              Tente alterar os filtros ou a busca textual aplicada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-neutral-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800/80 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5 pl-4">Timestamp</th>
                  <th className="p-3.5">Nível</th>
                  <th className="p-3.5">Ação</th>
                  <th className="p-3.5">Aplicação</th>
                  <th className="p-3.5">Ator</th>
                  <th className="p-3.5 text-right pr-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-neutral-900/50 transition-colors group"
                  >
                    <td className="p-3.5 pl-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {getLevelBadge(log.level)}
                    </td>
                    <td className="p-3.5 font-mono font-medium text-white whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-neutral-300 whitespace-nowrap">
                      {log.application_name ? (
                        <span className="flex items-center gap-1.5">
                          <Bot className="h-3 w-3 text-neutral-500" />
                          {log.application_name}
                        </span>
                      ) : (
                        <span className="text-neutral-500 font-mono text-[11px]">Sistema</span>
                      )}
                    </td>
                    <td className="p-3.5 text-neutral-400 whitespace-nowrap">
                      {log.actor_name || 'Admin'}
                    </td>
                    <td className="p-3.5 text-right pr-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 text-[11px] px-2 text-neutral-400 hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Inspecionar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Log */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="sm:max-w-lg bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-neutral-400" />
              Auditoria de Evento • Detalhes
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Payload sanitizado e metadados gravados para este evento.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-neutral-300">
                <div>
                  <span className="text-neutral-500 block text-[10px]">AÇÃO:</span>
                  <span className="font-mono font-bold text-white">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">DATA / HORA:</span>
                  <span className="font-mono text-neutral-300">
                    {new Date(selectedLog.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-500 block text-[10px]">PAYLOAD JSON (SANITIZADO):</span>
                <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <p className="text-[10px] text-neutral-500 italic">
                * Conforme guardrails de segurança do 7dc, nenhum token, segredo ou senha é mantido nos logs de auditoria.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
