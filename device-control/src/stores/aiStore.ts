import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useConfigStore } from './configStore'
import { useLogStore } from './logStore'
import { useCommandStore } from './commandStore'
import { useDeviceStore } from './deviceStore'

interface AIResponse {
  id: string
  created: number
  model: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface ParsedCommand {
  action: string
  params: Record<string, string | number>
  description: string
}

export const useAIStore = defineStore('ai', () => {
  const isProcessing = ref(false)
  const lastResponse = ref<string>('')
  const error = ref<string | null>(null)
  const conversationHistory = ref<{ role: string; content: string }[]>([])

  const configStore = useConfigStore()
  const logStore = useLogStore()
  const commandStore = useCommandStore()
  const deviceStore = useDeviceStore()

  const canUseAI = computed(() => configStore.isValidApiKey())

  const systemPrompt = `你是一个移动设备控制助手。请将用户的自然语言指令解析为可执行的设备命令。

支持的命令格式：
- 截图：截取当前屏幕
- 点击 [x] [y]：在坐标(x,y)处点击
- 滑动 [x1] [y1] [x2] [y2] [时长]：从(x1,y1)滑动到(x2,y2)
- 输入 [文本]：输入指定文本
- 返回：返回上一界面
- Home：返回主屏幕
- 打开 [应用名]：打开指定应用
- 滚动 [上/下]：滚动屏幕

请直接输出解析后的命令，每条命令一行，不要包含其他解释。`

  const parseCommand = async (userInput: string): Promise<ParsedCommand[]> => {
    if (!canUseAI.value) {
      throw new Error('请先配置有效的API Key')
    }

    isProcessing.value = true
    error.value = null

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.value.slice(-5),
      { role: 'user', content: userInput }
    ]

    try {
      logStore.addInfoLog('正在调用智谱AI解析指令...', userInput)

      const response = await axios.post<AIResponse>(
        `${configStore.aiConfig.endpoint}/chat/completions`,
        {
          model: configStore.aiConfig.model || 'glm-4',
          messages,
          temperature: 0.7,
          max_tokens: 1024
        },
        {
          headers: {
            'Authorization': `Bearer ${configStore.aiConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      const content = response.data.choices[0]?.message?.content || ''
      lastResponse.value = content

      conversationHistory.value.push(
        { role: 'user', content: userInput },
        { role: 'assistant', content }
      )

      if (conversationHistory.value.length > 20) {
        conversationHistory.value = conversationHistory.value.slice(-20)
      }

      const parsedCommands = parseAIResponse(content)
      
      logStore.addInfoLog('AI指令解析完成', `解析出${parsedCommands.length}条命令`, 
        deviceStore.selectedDeviceId, deviceStore.selectedDevice?.name)

      return parsedCommands
    } catch (e: any) {
      const errorMsg = e.response?.data?.error?.message || e.message || 'AI解析失败'
      error.value = errorMsg
      logStore.addErrorLog('AI指令解析失败', errorMsg)
      throw new Error(errorMsg)
    } finally {
      isProcessing.value = false
    }
  }

  const parseAIResponse = (content: string): ParsedCommand[] => {
    const commands: ParsedCommand[] = []
    const lines = content.split('\n').filter(line => line.trim())

    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('截图') || trimmed === '截图') {
        commands.push({
          action: 'screenshot',
          params: {},
          description: '截取屏幕'
        })
      } else if (trimmed.startsWith('点击')) {
        const match = trimmed.match(/点击\s+(\d+)\s+(\d+)/)
        if (match) {
          commands.push({
            action: 'tap',
            params: { x: parseInt(match[1]), y: parseInt(match[2]) },
            description: `点击坐标(${match[1]}, ${match[2]})`
          })
        }
      } else if (trimmed.startsWith('滑动')) {
        const match = trimmed.match(/滑动\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/)
        if (match) {
          commands.push({
            action: 'swipe',
            params: { 
              x1: parseInt(match[1]), 
              y1: parseInt(match[2]), 
              x2: parseInt(match[3]), 
              y2: parseInt(match[4]),
              duration: match[5] ? parseInt(match[5]) : 300
            },
            description: `滑动从(${match[1]}, ${match[2]})到(${match[3]}, ${match[4]})`
          })
        }
      } else if (trimmed.startsWith('输入')) {
        const text = trimmed.replace(/^输入\s*/, '')
        commands.push({
          action: 'input',
          params: { text },
          description: `输入文本: ${text}`
        })
      } else if (trimmed === '返回' || trimmed === 'back') {
        commands.push({
          action: 'back',
          params: {},
          description: '返回上一界面'
        })
      } else if (trimmed === 'Home' || trimmed === 'home' || trimmed === '主页') {
        commands.push({
          action: 'home',
          params: {},
          description: '返回主屏幕'
        })
      } else if (trimmed.startsWith('打开')) {
        const app = trimmed.replace(/^打开\s*/, '')
        commands.push({
          action: 'launch',
          params: { app },
          description: `打开应用: ${app}`
        })
      } else if (trimmed.startsWith('滚动')) {
        const direction = trimmed.includes('上') ? 'up' : 'down'
        commands.push({
          action: 'scroll',
          params: { direction },
          description: `滚动屏幕${direction === 'up' ? '向上' : '向下'}`
        })
      }
    }

    return commands
  }

  const executeAICommand = async (userInput: string, deviceId?: string) => {
    const device = deviceStore.selectedDevice
    const targetDeviceId = deviceId || device?.id

    if (!targetDeviceId) {
      throw new Error('请先选择要控制的设备')
    }

    logStore.addInfoLog('开始AI指令解析与执行', userInput, targetDeviceId, device?.name)

    const commands = await parseCommand(userInput)

    if (commands.length === 0) {
      logStore.addWarnLog('AI未能解析出有效命令', userInput, targetDeviceId, device?.name)
      return
    }

    for (const cmd of commands) {
      const commandStr = `${cmd.action}${cmd.params ? ' ' + JSON.stringify(cmd.params) : ''}`
      await commandStore.executeCommand(commandStr, targetDeviceId, 'ai')
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    logStore.addInfoLog('AI指令执行完成', `共执行${commands.length}条命令`, targetDeviceId, device?.name)
  }

  const testConnection = async (): Promise<boolean> => {
    if (!canUseAI.value) {
      throw new Error('请先配置有效的API Key')
    }

    try {
      const response = await axios.post<AIResponse>(
        `${configStore.aiConfig.endpoint}/chat/completions`,
        {
          model: configStore.aiConfig.model || 'glm-4',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${configStore.aiConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      logStore.addInfoLog('AI服务连接测试成功')
      return true
    } catch (e: any) {
      const errorMsg = e.response?.data?.error?.message || e.message || '连接测试失败'
      logStore.addErrorLog('AI服务连接测试失败', errorMsg)
      throw new Error(errorMsg)
    }
  }

  const clearHistory = () => {
    conversationHistory.value = []
  }

  return {
    isProcessing,
    lastResponse,
    error,
    conversationHistory,
    canUseAI,
    parseCommand,
    executeAICommand,
    testConnection,
    clearHistory
  }
})
