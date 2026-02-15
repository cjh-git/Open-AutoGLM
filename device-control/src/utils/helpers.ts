export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  const ms = date.getMilliseconds().toString().padStart(3, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export const getOSIcon = (os: string): string => {
  const osMap: Record<string, string> = {
    ios: 'apple',
    android: 'android',
    harmonyos: 'harmony'
  }
  return osMap[os] || 'smartphone'
}

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    online: '#10B981',
    offline: '#6B7280',
    pending: '#F59E0B',
    executing: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    paused: '#F59E0B'
  }
  return statusMap[status] || '#6B7280'
}

export const validateApiKey = (key: string, provider: string): boolean => {
  if (!key || key.length < 10) return false
  
  switch (provider) {
    case 'zhipu':
      return key.startsWith('sk-') && key.length > 20
    case 'openai':
      return key.startsWith('sk-') && key.length > 40
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length > 50
    default:
      return key.length > 10
  }
}

export const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return '****'
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}
