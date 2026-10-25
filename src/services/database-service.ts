import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type {
  BotApplication,
  BotCommand,
  AuditLog,
  GeneralBotSettings,
  LogLevel,
} from '@/types/database'

// Coleções do Firestore
const COLLECTIONS = {
  APPLICATIONS: 'bot_applications',
  SETTINGS: 'bot_settings',
  COMMANDS: 'bot_commands',
  LOGS: 'audit_logs',
}

// Chaves de armazenamento local para fallback / modo offline
const STORAGE_KEYS = {
  APPLICATIONS: '7dc_demo_applications',
  SETTINGS: '7dc_demo_settings',
  COMMANDS: '7dc_demo_commands',
  LOGS: '7dc_demo_logs',
}

// Circuit breaker para o Firestore
let firestoreCircuitBreaker = true

// Helper com timeout rápido para chamadas de rede do Firestore
async function withTimeout<T>(promise: Promise<T>, ms = 1000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      firestoreCircuitBreaker = false
      reject(new Error(`[7dc] Firestore timeout excedido (${ms}ms)`))
    }, ms)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timer!)
    return result
  } catch (err) {
    clearTimeout(timer!)
    firestoreCircuitBreaker = false
    throw err
  }
}

// Dados padrão iniciais (utilizados para bootstrap do Firestore se vazio)
const INITIAL_APPLICATIONS: BotApplication[] = [
  {
    id: 'app-001',
    owner_id: 'artemis-admin-master',
    name: 'SentinelBot Pro',
    discloud_app_id: 'sentinel-prod-01',
    description: 'Bot principal de moderação, segurança e automação do servidor.',
    notes: 'Configurado com auto-mute e filtro de spam agressivo.',
    status: 'online',
    is_manual: false,
    last_synced_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 'app-002',
    owner_id: 'artemis-admin-master',
    name: 'TicketMaster 7dc',
    discloud_app_id: 'ticket-srv-99',
    description: 'Sistema avançado de atendimento e abertura de tickets com botões.',
    notes: 'Aguardando atualização de dependências.',
    status: 'online',
    is_manual: true,
    last_synced_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'app-003',
    owner_id: 'artemis-admin-master',
    name: 'AudioStreamer DJ',
    discloud_app_id: 'music-stream-03',
    description: 'Bot de áudio e streaming para salas de voz.',
    notes: 'Em manutenção na Discloud devido a reinício de container.',
    status: 'error',
    is_manual: false,
    last_synced_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
]

const INITIAL_SETTINGS: Record<string, GeneralBotSettings> = {
  'app-001': {
    prefix: '!',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    modules: {
      moderation: true,
      automations: true,
      logs: true,
      tickets: false,
      leveling: true,
    },
    moderation: {
      enabled: true,
      log_channel_id: '123456789012345678',
      anti_spam: true,
      anti_invite: true,
      auto_mute_limit: 5,
      action_delay_seconds: 2,
    },
  },
  'app-002': {
    prefix: '/',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    modules: {
      moderation: false,
      automations: true,
      logs: true,
      tickets: true,
      leveling: false,
    },
    moderation: {
      enabled: false,
      anti_spam: false,
      anti_invite: false,
      auto_mute_limit: 3,
      action_delay_seconds: 1,
    },
  },
}

const INITIAL_COMMANDS: BotCommand[] = [
  {
    id: 'cmd-001',
    application_id: 'app-001',
    name: 'ban',
    description: 'Aplica banimento ao membro com justificativa registrada.',
    category: 'moderação',
    enabled: true,
    config: {
      slash_command: true,
      required_permissions: ['BanMembers'],
      cooldown_seconds: 3,
    },
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cmd-002',
    application_id: 'app-001',
    name: 'kick',
    description: 'Expulsa um membro do servidor.',
    category: 'moderação',
    enabled: true,
    config: {
      slash_command: true,
      required_permissions: ['KickMembers'],
      cooldown_seconds: 3,
    },
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cmd-003',
    application_id: 'app-001',
    name: 'clear',
    description: 'Apaga até 100 mensagens recentes de um canal.',
    category: 'moderação',
    enabled: true,
    config: {
      slash_command: true,
      required_permissions: ['ManageMessages'],
      cooldown_seconds: 5,
    },
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cmd-004',
    application_id: 'app-001',
    name: 'ping',
    description: 'Verifica a latência do bot e da API do Discord.',
    category: 'utilitários',
    enabled: true,
    config: {
      slash_command: true,
      required_permissions: [],
      cooldown_seconds: 2,
    },
    updated_at: new Date().toISOString(),
  },
]

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    actor_id: 'artemis-admin-master',
    actor_name: 'Administrador 7dc',
    application_id: 'app-001',
    application_name: 'SentinelBot Pro',
    action: 'status_check',
    level: 'info',
    details: { message: 'Sincronização de status com Discloud executada com sucesso via Firebase.' },
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 'log-002',
    actor_id: 'artemis-admin-master',
    actor_name: 'Administrador 7dc',
    application_id: 'app-001',
    application_name: 'SentinelBot Pro',
    action: 'settings_update',
    level: 'info',
    details: { module: 'moderation', anti_spam: true, anti_invite: true },
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'log-003',
    actor_id: 'artemis-admin-master',
    actor_name: 'Administrador 7dc',
    application_id: 'app-003',
    application_name: 'AudioStreamer DJ',
    action: 'discloud_error',
    level: 'error',
    details: { code: 'CONTAINER_CRASH', info: 'Reinício de container falhou por falta de memória.' },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'log-004',
    actor_id: 'artemis-admin-master',
    actor_name: 'Administrador 7dc',
    application_id: null,
    application_name: null,
    action: 'admin_login',
    level: 'security',
    details: { ip: '127.0.0.1', auth_type: 'firebase_auth' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]

// Helpers de fallback local
function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error(`Erro ao salvar no storage local (${key}):`, err)
  }
}

export const DatabaseService = {
  // APLICAÇÕES
  async getApplications(): Promise<BotApplication[]> {
    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const colRef = collection(db, COLLECTIONS.APPLICATIONS)
        const snap = await withTimeout(getDocs(colRef), 1000)

        if (!snap.empty) {
          const apps: BotApplication[] = []
          snap.forEach((docSnap) => {
            apps.push({ id: docSnap.id, ...(docSnap.data() as Omit<BotApplication, 'id'>) })
          })
          apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          return apps
        } else {
          for (const initialApp of INITIAL_APPLICATIONS) {
            await setDoc(doc(db, COLLECTIONS.APPLICATIONS, initialApp.id), initialApp)
          }
          return INITIAL_APPLICATIONS
        }
      } catch (err) {
        console.warn('[7dc] Falha ao consultar Firestore, utilizando fallback local:', err)
      }
    }

    return getLocalItem<BotApplication[]>(
      STORAGE_KEYS.APPLICATIONS,
      INITIAL_APPLICATIONS
    )
  },

  async getApplicationById(id: string): Promise<BotApplication | null> {
    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.APPLICATIONS, id)
        const snap = await withTimeout(getDoc(docRef), 1000)
        if (snap.exists()) {
          return { id: snap.id, ...(snap.data() as Omit<BotApplication, 'id'>) }
        }
      } catch (err) {
        console.warn(`[7dc] Falha ao buscar bot ${id} no Firestore:`, err)
      }
    }

    const apps = await this.getApplications()
    return apps.find((a) => a.id === id) || null
  },

  async createApplication(
    payload: Omit<BotApplication, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BotApplication> {
    const newId = crypto.randomUUID ? crypto.randomUUID() : `app-${Date.now()}`
    const now = new Date().toISOString()
    const newApp: BotApplication = {
      ...payload,
      id: newId,
      created_at: now,
      updated_at: now,
    }

    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.APPLICATIONS, newId)
        await withTimeout(setDoc(docRef, newApp), 1000)

        await this.logAuditEvent(
          'application_create',
          'info',
          { name: newApp.name, discloud_app_id: newApp.discloud_app_id },
          newApp.id
        )
        return newApp
      } catch (err) {
        console.warn('[7dc] Erro ao gravar aplicação no Firestore, salvando localmente:', err)
      }
    }

    // Fallback Local
    const current = getLocalItem<BotApplication[]>(
      STORAGE_KEYS.APPLICATIONS,
      INITIAL_APPLICATIONS
    )
    const updated = [newApp, ...current]
    setLocalItem(STORAGE_KEYS.APPLICATIONS, updated)

    await this.logAuditEvent(
      'application_create',
      'info',
      { name: newApp.name, discloud_app_id: newApp.discloud_app_id },
      newApp.id
    )

    return newApp
  },

  async updateApplication(
    id: string,
    updates: Partial<BotApplication>
  ): Promise<BotApplication | null> {
    const now = new Date().toISOString()
    const updatedPayload = { ...updates, updated_at: now }

    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.APPLICATIONS, id)
        await withTimeout(updateDoc(docRef, updatedPayload), 1000)

        const updatedSnap = await withTimeout(getDoc(docRef), 1000)
        if (updatedSnap.exists()) {
          return { id: updatedSnap.id, ...(updatedSnap.data() as Omit<BotApplication, 'id'>) }
        }
      } catch (err) {
        console.warn(`[7dc] Erro ao atualizar aplicação ${id} no Firestore:`, err)
      }
    }

    const current = getLocalItem<BotApplication[]>(
      STORAGE_KEYS.APPLICATIONS,
      INITIAL_APPLICATIONS
    )
    const index = current.findIndex((a) => a.id === id)
    if (index === -1) return null

    const updatedApp = {
      ...current[index],
      ...updatedPayload,
    }
    current[index] = updatedApp
    setLocalItem(STORAGE_KEYS.APPLICATIONS, current)
    return updatedApp
  },

  async deleteApplication(id: string): Promise<boolean> {
    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.APPLICATIONS, id)
        await withTimeout(deleteDoc(docRef), 1000)
        await this.logAuditEvent('application_delete', 'warn', { id }, id)
        return true
      } catch (err) {
        console.warn(`[7dc] Erro ao remover aplicação ${id} no Firestore:`, err)
      }
    }

    const current = getLocalItem<BotApplication[]>(
      STORAGE_KEYS.APPLICATIONS,
      INITIAL_APPLICATIONS
    )
    const filtered = current.filter((a) => a.id !== id)
    setLocalItem(STORAGE_KEYS.APPLICATIONS, filtered)

    await this.logAuditEvent('application_delete', 'warn', { id }, id)
    return true
  },

  // CONFIGURAÇÕES
  async getSettings(applicationId: string): Promise<GeneralBotSettings> {
    const defaultSettings: GeneralBotSettings = {
      prefix: '!',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      modules: {
        moderation: true,
        automations: true,
        logs: true,
        tickets: false,
        leveling: false,
      },
      moderation: {
        enabled: true,
        anti_spam: true,
        anti_invite: false,
        auto_mute_limit: 5,
        action_delay_seconds: 2,
      },
    }

    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.SETTINGS, applicationId)
        const snap = await withTimeout(getDoc(docRef), 1000)
        if (snap.exists() && snap.data().settings) {
          return snap.data().settings as GeneralBotSettings
        }
      } catch (err) {
        console.warn(`[7dc] Erro ao buscar configurações de ${applicationId} no Firestore:`, err)
      }
    }

    const allSettings = getLocalItem<Record<string, GeneralBotSettings>>(
      STORAGE_KEYS.SETTINGS,
      INITIAL_SETTINGS
    )
    return allSettings[applicationId] || defaultSettings
  },

  async saveSettings(
    applicationId: string,
    settings: GeneralBotSettings
  ): Promise<boolean> {
    const now = new Date().toISOString()

    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.SETTINGS, applicationId)
        await withTimeout(setDoc(docRef, {
          application_id: applicationId,
          settings,
          updated_at: now,
        }), 1000)

        await this.logAuditEvent(
          'settings_update',
          'info',
          { updated_fields: Object.keys(settings) },
          applicationId
        )
        return true
      } catch (err) {
        console.warn(`[7dc] Erro ao gravar configurações no Firestore:`, err)
      }
    }

    const allSettings = getLocalItem<Record<string, GeneralBotSettings>>(
      STORAGE_KEYS.SETTINGS,
      INITIAL_SETTINGS
    )
    allSettings[applicationId] = settings
    setLocalItem(STORAGE_KEYS.SETTINGS, allSettings)

    await this.logAuditEvent(
      'settings_update',
      'info',
      { updated_fields: Object.keys(settings) },
      applicationId
    )
    return true
  },

  // COMANDOS
  async getCommands(applicationId: string): Promise<BotCommand[]> {
    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const colRef = collection(db, COLLECTIONS.COMMANDS)
        const q = query(colRef, where('application_id', '==', applicationId))
        const snap = await withTimeout(getDocs(q), 1000)

        if (!snap.empty) {
          const cmds: BotCommand[] = []
          snap.forEach((docSnap) => {
            cmds.push({ id: docSnap.id, ...(docSnap.data() as Omit<BotCommand, 'id'>) })
          })
          cmds.sort((a, b) => a.name.localeCompare(b.name))
          return cmds
        }
      } catch (err) {
        console.warn(`[7dc] Erro ao buscar comandos no Firestore:`, err)
      }
    }

    const all = getLocalItem<BotCommand[]>(
      STORAGE_KEYS.COMMANDS,
      INITIAL_COMMANDS
    )
    return all.filter((c) => c.application_id === applicationId)
  },

  async toggleCommand(
    commandId: string,
    enabled: boolean
  ): Promise<BotCommand | null> {
    const now = new Date().toISOString()

    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.COMMANDS, commandId)
        await withTimeout(updateDoc(docRef, { enabled, updated_at: now }), 1000)

        const snap = await withTimeout(getDoc(docRef), 1000)
        if (snap.exists()) {
          const data = { id: snap.id, ...(snap.data() as Omit<BotCommand, 'id'>) }
          await this.logAuditEvent(
            'command_toggle',
            'info',
            { command_id: commandId, enabled },
            data.application_id
          )
          return data
        }
      } catch (err) {
        console.warn(`[7dc] Erro ao atualizar comando ${commandId} no Firestore:`, err)
      }
    }

    const all = getLocalItem<BotCommand[]>(
      STORAGE_KEYS.COMMANDS,
      INITIAL_COMMANDS
    )
    const index = all.findIndex((c) => c.id === commandId)
    if (index === -1) return null

    all[index].enabled = enabled
    all[index].updated_at = now
    setLocalItem(STORAGE_KEYS.COMMANDS, all)

    await this.logAuditEvent(
      'command_toggle',
      'info',
      { command_name: all[index].name, enabled },
      all[index].application_id
    )

    return all[index]
  },

  async createCommand(
    payload: Omit<BotCommand, 'id' | 'updated_at'>
  ): Promise<BotCommand> {
    const newId = crypto.randomUUID ? crypto.randomUUID() : `cmd-${Date.now()}`
    const now = new Date().toISOString()
    const newCmd: BotCommand = {
      ...payload,
      id: newId,
      updated_at: now,
    }

    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.COMMANDS, newId)
        await withTimeout(setDoc(docRef, newCmd), 1000)

        await this.logAuditEvent(
          'command_create',
          'info',
          { name: newCmd.name },
          newCmd.application_id
        )
        return newCmd
      } catch (err) {
        console.warn(`[7dc] Erro ao criar comando no Firestore:`, err)
      }
    }

    const all = getLocalItem<BotCommand[]>(
      STORAGE_KEYS.COMMANDS,
      INITIAL_COMMANDS
    )
    all.push(newCmd)
    setLocalItem(STORAGE_KEYS.COMMANDS, all)

    await this.logAuditEvent(
      'command_create',
      'info',
      { name: newCmd.name },
      newCmd.application_id
    )

    return newCmd
  },

  // LOGS DE AUDITORIA
  async getAuditLogs(filters?: {
    application_id?: string
    level?: string
    search?: string
  }): Promise<AuditLog[]> {
    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const colRef = collection(db, COLLECTIONS.LOGS)
        let q = query(colRef, orderBy('created_at', 'desc'), limit(100))

        if (filters?.application_id && filters.application_id !== 'all') {
          q = query(colRef, where('application_id', '==', filters.application_id), orderBy('created_at', 'desc'), limit(100))
        }

        const snap = await withTimeout(getDocs(q), 1000)
        if (!snap.empty) {
          const logs: AuditLog[] = []
          snap.forEach((docSnap) => {
            logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<AuditLog, 'id'>) })
          })

          let filtered = logs
          if (filters?.level && filters.level !== 'all') {
            filtered = filtered.filter((l) => l.level === filters.level)
          }
          if (filters?.search) {
            const term = filters.search.toLowerCase()
            filtered = filtered.filter(
              (l) =>
                l.action.toLowerCase().includes(term) ||
                (l.application_name && l.application_name.toLowerCase().includes(term)) ||
                JSON.stringify(l.details).toLowerCase().includes(term)
            )
          }
          return filtered
        }
      } catch (err) {
        console.warn('[7dc] Erro ao buscar logs no Firestore:', err)
      }
    }

    let logs = getLocalItem<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS)

    if (filters?.application_id && filters.application_id !== 'all') {
      logs = logs.filter((l) => l.application_id === filters.application_id)
    }
    if (filters?.level && filters.level !== 'all') {
      logs = logs.filter((l) => l.level === filters.level)
    }
    if (filters?.search) {
      const term = filters.search.toLowerCase()
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(term) ||
          (l.application_name && l.application_name.toLowerCase().includes(term)) ||
          JSON.stringify(l.details).toLowerCase().includes(term)
      )
    }

    return logs
  },

  async logAuditEvent(
    action: string,
    level: LogLevel = 'info',
    details: Record<string, unknown> = {},
    applicationId?: string | null
  ): Promise<void> {
    // Sanitização de segurança: NUNCA gravar tokens, senhas ou credenciais
    const sanitizedDetails = { ...details }
    delete sanitizedDetails.token
    delete sanitizedDetails.secret
    delete sanitizedDetails.password
    delete sanitizedDetails.apiKey
    delete sanitizedDetails.authorization

    const newId = crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`
    const newLog: AuditLog = {
      id: newId,
      actor_id: 'artemis-admin-master',
      actor_name: 'Administrador 7dc',
      application_id: applicationId || null,
      action,
      level,
      details: sanitizedDetails,
      created_at: new Date().toISOString(),
    }

    if (isFirebaseConfigured() && firestoreCircuitBreaker) {
      try {
        const docRef = doc(db, COLLECTIONS.LOGS, newId)
        await withTimeout(setDoc(docRef, newLog), 1000)
        return
      } catch (err) {
        console.warn('[7dc] Erro ao gravar log no Firestore:', err)
      }
    }

    const currentLogs = getLocalItem<AuditLog[]>(
      STORAGE_KEYS.LOGS,
      INITIAL_LOGS
    )
    currentLogs.unshift(newLog)
    setLocalItem(STORAGE_KEYS.LOGS, currentLogs.slice(0, 200))
  },
}
