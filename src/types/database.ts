export type BotStatus = 'online' | 'offline' | 'error' | 'restarting' | 'unknown'
export type LogLevel = 'info' | 'warn' | 'error' | 'security'
export type AdminRole = 'superadmin' | 'admin' | 'operator'

export interface AdminProfile {
  id: string
  display_name: string
  role: AdminRole
  created_at: string
}

export interface BotApplication {
  id: string
  owner_id: string
  name: string
  discloud_app_id: string
  description?: string | null
  notes?: string | null
  status: BotStatus
  is_manual: boolean
  last_synced_at?: string | null
  created_at: string
  updated_at: string
}

export interface ModerationSettings {
  enabled: boolean
  log_channel_id?: string
  anti_spam: boolean
  anti_invite: boolean
  auto_mute_limit: number
  action_delay_seconds: number
}

export interface GeneralBotSettings {
  prefix: string
  language: string
  timezone: string
  modules: {
    moderation: boolean
    automations: boolean
    logs: boolean
    tickets: boolean
    leveling: boolean
  }
  moderation: ModerationSettings
  custom?: Record<string, unknown>
}

export interface BotSettings {
  id: string
  application_id: string
  settings: GeneralBotSettings
  updated_at: string
}

export interface BotCommand {
  id: string
  application_id: string
  name: string
  description: string
  category: string
  enabled: boolean
  config: {
    cooldown_seconds?: number
    required_permissions?: string[]
    slash_command?: boolean
    aliases?: string[]
  }
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_id: string
  actor_name?: string
  application_id?: string | null
  application_name?: string | null
  action: string
  level: LogLevel
  details: Record<string, unknown>
  created_at: string
}

export interface DiscloudAppInfo {
  id: string
  name: string
  status: string
  ram: string
  cpu: string
  avatar?: string
  lang?: string
  version?: string
}
