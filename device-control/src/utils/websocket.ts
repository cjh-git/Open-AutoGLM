import { ref } from 'vue'
import { useLogStore } from '@/stores/logStore'
import { useDeviceStore } from '@/stores/deviceStore'
import { useConfigStore } from '@/stores/configStore'

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private isConnected = ref(false)
  private messageQueue: any[] = []

  constructor() {}

  connect() {
    const configStore = useConfigStore()
    const logStore = useLogStore()
    const { wsUrl } = configStore.connectionConfig

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.isConnected.value = true
        logStore.addInfoLog('WebSocket连接已建立', wsUrl)
        this.startHeartbeat()
        this.flushMessageQueue()
      }

      this.ws.onclose = (event) => {
        this.isConnected.value = false
        logStore.addWarnLog('WebSocket连接已关闭', `code: ${event.code}, reason: ${event.reason}`)
        this.stopHeartbeat()
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        logStore.addErrorLog('WebSocket连接错误', String(error))
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }
    } catch (error) {
      logStore.addErrorLog('WebSocket连接失败', String(error))
      this.scheduleReconnect()
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data)
      const logStore = useLogStore()
      const deviceStore = useDeviceStore()

      switch (message.type) {
        case 'device_status':
          deviceStore.updateDeviceStatus(message.deviceId, message.status)
          logStore.addInfoLog(
            `设备状态更新: ${message.status}`,
            message.deviceId,
            message.deviceId
          )
          break

        case 'device_data':
          logStore.addDebugLog('收到设备数据', message.data, message.deviceId)
          break

        case 'command_result':
          logStore.addInfoLog(
            `命令执行结果: ${message.result}`,
            message.details,
            message.deviceId
          )
          break

        case 'error':
          logStore.addErrorLog(
            `服务端错误: ${message.message}`,
            message.details
          )
          break

        default:
          logStore.addDebugLog('收到未知消息', message)
      }
    } catch (error) {
      console.error('Failed to parse message:', error)
    }
  }

  private startHeartbeat() {
    const configStore = useConfigStore()
    const { heartbeatInterval } = configStore.connectionConfig

    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect() {
    const configStore = useConfigStore()
    const logStore = useLogStore()
    const { reconnectAttempts, reconnectInterval } = configStore.connectionConfig

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectTimer = window.setTimeout(() => {
      logStore.addInfoLog('尝试重新连接WebSocket...')
      this.connect()
    }, reconnectInterval)
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      this.messageQueue.push(data)
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift()
      this.send(data)
    }
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected.value = false
  }

  getConnectionStatus() {
    return this.isConnected.value
  }

  sendCommand(deviceId: string, command: string) {
    this.send({
      type: 'command',
      deviceId,
      command,
      timestamp: Date.now()
    })
  }
}

export const wsService = new WebSocketService()
