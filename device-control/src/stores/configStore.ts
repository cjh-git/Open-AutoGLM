import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { AppConfig, AIConfig, ConnectionConfig } from '@/types'

const STORAGE_KEY = 'device_control_config'

const defaultAIConfig: AIConfig = {
  provider: 'zhipu',
  apiKey: '',
  endpoint: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'glm-4'
}

const defaultConnectionConfig: ConnectionConfig = {
  wsUrl: 'ws://localhost:8080/ws',
  heartbeatInterval: 30000,
  reconnectAttempts: 3,
  reconnectInterval: 5000,
  autoRefreshInterval: 60000
}

const defaultConfig: AppConfig = {
  ai: defaultAIConfig,
  connection: defaultConnectionConfig,
  selectedDeviceId: undefined,
  logLevel: 'info',
  autoScroll: true
}

export const useConfigStore = defineStore('config', () => {
  const aiConfig = ref<AIConfig>({ ...defaultAIConfig })
  const connectionConfig = ref<ConnectionConfig>({ ...defaultConnectionConfig })
  const selectedDeviceId = ref<string | undefined>(undefined)
  const logLevel = ref<AppConfig['logLevel']>('info')
  const autoScroll = ref(true)

  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config: AppConfig = JSON.parse(stored)
        aiConfig.value = { ...defaultAIConfig, ...config.ai }
        connectionConfig.value = { ...defaultConnectionConfig, ...config.connection }
        selectedDeviceId.value = config.selectedDeviceId
        logLevel.value = config.logLevel || 'info'
        autoScroll.value = config.autoScroll !== false
      }
    } catch (e) {
      console.error('Failed to load config:', e)
    }
  }

  const saveConfig = () => {
    try {
      const config: AppConfig = {
        ai: aiConfig.value,
        connection: connectionConfig.value,
        selectedDeviceId: selectedDeviceId.value,
        logLevel: logLevel.value,
        autoScroll: autoScroll.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (e) {
      console.error('Failed to save config:', e)
    }
  }

  const updateAIConfig = (config: Partial<AIConfig>) => {
    aiConfig.value = { ...aiConfig.value, ...config }
    saveConfig()
  }

  const updateConnectionConfig = (config: Partial<ConnectionConfig>) => {
    connectionConfig.value = { ...connectionConfig.value, ...config }
    saveConfig()
  }

  const setSelectedDevice = (deviceId: string | undefined) => {
    selectedDeviceId.value = deviceId
    saveConfig()
  }

  const setLogLevel = (level: AppConfig['logLevel']) => {
    logLevel.value = level
    saveConfig()
  }

  const setAutoScroll = (enabled: boolean) => {
    autoScroll.value = enabled
    saveConfig()
  }

  const resetConfig = () => {
    aiConfig.value = { ...defaultAIConfig }
    connectionConfig.value = { ...defaultConnectionConfig }
    selectedDeviceId.value = undefined
    logLevel.value = 'info'
    autoScroll.value = true
    saveConfig()
  }

  const isValidApiKey = (): boolean => {
    return !!aiConfig.value.apiKey && aiConfig.value.apiKey.length > 10
  }

  watch([aiConfig, connectionConfig, selectedDeviceId, logLevel, autoScroll], () => {
    saveConfig()
  }, { deep: true })

  loadConfig()

  return {
    aiConfig,
    connectionConfig,
    selectedDeviceId,
    logLevel,
    autoScroll,
    loadConfig,
    saveConfig,
    updateAIConfig,
    updateConnectionConfig,
    setSelectedDevice,
    setLogLevel,
    setAutoScroll,
    resetConfig,
    isValidApiKey
  }
})
