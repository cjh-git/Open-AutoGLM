import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LogEntry } from '@/types'
import dayjs from 'dayjs'

export const useLogStore = defineStore('log', () => {
  const logs = ref<LogEntry[]>([])
  const maxLogsSize = 1000
  const autoScroll = ref(true)

  const filterDeviceId = ref<string | undefined>(undefined)
  const filterType = ref<LogEntry['type'] | undefined>(undefined)
  const filterLevel = ref<LogEntry['level'] | undefined>(undefined)
  const filterDateRange = ref<{ start: number; end: number } | undefined>(undefined)
  const filterKeyword = ref<string>('')

  const filteredLogs = computed(() => {
    let result = [...logs.value]

    if (filterDeviceId.value) {
      result = result.filter(l => l.deviceId === filterDeviceId.value)
    }

    if (filterType.value) {
      result = result.filter(l => l.type === filterType.value)
    }

    if (filterLevel.value) {
      result = result.filter(l => l.level === filterLevel.value)
    }

    if (filterDateRange.value) {
      result = result.filter(l => 
        l.timestamp >= filterDateRange.value!.start && 
        l.timestamp <= filterDateRange.value!.end
      )
    }

    if (filterKeyword.value) {
      const keyword = filterKeyword.value.toLowerCase()
      result = result.filter(l => 
        l.message.toLowerCase().includes(keyword) ||
        l.details?.toLowerCase().includes(keyword)
      )
    }

    return result.sort((a, b) => b.timestamp - a.timestamp)
  })

  const todayLogs = computed(() => {
    const today = dayjs().startOf('day')
    return logs.value.filter(l => l.timestamp >= today.valueOf())
  })

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const log: LogEntry = {
      ...entry,
      id,
      timestamp: Date.now()
    }

    logs.value.push(log)

    if (logs.value.length > maxLogsSize) {
      logs.value.shift()
    }

    return id
  }

  const addInfoLog = (message: string, details?: string, deviceId?: string, deviceName?: string) => {
    return addLog({
      level: 'info',
      type: 'system',
      message,
      details,
      deviceId,
      deviceName
    })
  }

  const addWarnLog = (message: string, details?: string, deviceId?: string, deviceName?: string) => {
    return addLog({
      level: 'warn',
      type: 'system',
      message,
      details,
      deviceId,
      deviceName
    })
  }

  const addErrorLog = (message: string, details?: string, deviceId?: string, deviceName?: string) => {
    return addLog({
      level: 'error',
      type: 'system',
      message,
      details,
      deviceId,
      deviceName
    })
  }

  const addDebugLog = (message: string, details?: string, deviceId?: string, deviceName?: string) => {
    return addLog({
      level: 'debug',
      type: 'system',
      message,
      details,
      deviceId,
      deviceName
    })
  }

  const setFilter = (options: {
    deviceId?: string
    type?: LogEntry['type']
    level?: LogEntry['level']
    dateRange?: { start: number; end: number }
    keyword?: string
  }) => {
    if (options.deviceId !== undefined) filterDeviceId.value = options.deviceId
    if (options.type !== undefined) filterType.value = options.type
    if (options.level !== undefined) filterLevel.value = options.level
    if (options.dateRange !== undefined) filterDateRange.value = options.dateRange
    if (options.keyword !== undefined) filterKeyword.value = options.keyword
  }

  const clearFilters = () => {
    filterDeviceId.value = undefined
    filterType.value = undefined
    filterLevel.value = undefined
    filterDateRange.value = undefined
    filterKeyword.value = ''
  }

  const clearLogs = (filteredOnly = false) => {
    if (filteredOnly) {
      logs.value = logs.value.filter(l => !filteredLogs.value.find(f => f.id === l.id))
    } else {
      logs.value = []
    }
  }

  const copyLog = (logId: string): string | null => {
    const log = logs.value.find(l => l.id === logId)
    if (log) {
      const time = dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
      const text = `[${time}] [${log.level.toUpperCase()}] [${log.deviceName || 'System'}] ${log.message}${log.details ? '\n' + log.details : ''}`
      return text
    }
    return null
  }

  const copySelectedLogs = (logIds: string[]): string => {
    const selectedLogs = logs.value.filter(l => logIds.includes(l.id))
    return selectedLogs.map(log => {
      const time = dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
      return `[${time}] [${log.level.toUpperCase()}] [${log.deviceName || 'System'}] ${log.message}${log.details ? '\n' + log.details : ''}`
    }).join('\n\n')
  }

  const exportLogs = (): string => {
    return logs.value.map(log => {
      const time = dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
      return `[${time}] [${log.level.toUpperCase()}] [${log.deviceName || 'System'}] [${log.type}] ${log.message}${log.details ? '\n' + log.details : ''}`
    }).join('\n\n')
  }

  return {
    logs,
    autoScroll,
    filterDeviceId,
    filterType,
    filterLevel,
    filterDateRange,
    filterKeyword,
    filteredLogs,
    todayLogs,
    addLog,
    addInfoLog,
    addWarnLog,
    addErrorLog,
    addDebugLog,
    setFilter,
    clearFilters,
    clearLogs,
    copyLog,
    copySelectedLogs,
    exportLogs
  }
})
