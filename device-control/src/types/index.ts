export interface Device {
  id: string
  name: string
  model: string
  os: 'ios' | 'android' | 'harmonyos'
  status: 'online' | 'offline'
  connectedAt?: number
  ip?: string
  port?: number
  groupId?: string
  screenshot?: string
  aspectRatio?: string
}

export interface DeviceGroup {
  id: string
  name: string
  color: string
  deviceIds: string[]
}

export interface Command {
  id: string
  content: string
  type: 'text' | 'action' | 'ai'
  status: 'pending' | 'executing' | 'paused' | 'completed' | 'failed'
  deviceId?: string
  createdAt: number
  executedAt?: number
  completedAt?: number
  progress?: number
  steps?: CommandStep[]
  result?: string
  error?: string
}

export interface CommandStep {
  id: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  progress: number
}

export interface LogEntry {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  deviceId?: string
  deviceName?: string
  type: 'execute' | 'stop' | 'pause' | 'ai_parse' | 'connection' | 'system'
  message: string
  details?: string
}

export interface AIConfig {
  provider: 'zhipu' | 'openai' | 'anthropic' | 'custom'
  apiKey: string
  endpoint?: string
  model?: string
}

export interface ConnectionConfig {
  wsUrl: string
  heartbeatInterval: number
  reconnectAttempts: number
  reconnectInterval: number
  autoRefreshInterval: number
}

export interface AppConfig {
  ai: AIConfig
  connection: ConnectionConfig
  selectedDeviceId?: string
  logLevel: 'info' | 'warn' | 'error' | 'debug'
  autoScroll: boolean
}
