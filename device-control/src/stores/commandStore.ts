import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Command, CommandStep } from '@/types'

export const useCommandStore = defineStore('command', () => {
  const currentCommand = ref<string>('')
  const commandQueue = ref<Command[]>([])
  const currentExecutingId = ref<string | null>(null)
  const history = ref<Command[]>([])
  const maxHistorySize = 100

  const currentExecuting = computed(() => 
    commandQueue.value.find(c => c.id === currentExecutingId.value)
  )

  const isExecuting = computed(() => currentExecutingId.value !== null)

  const quickCommands = [
    { id: 'screenshot', label: '截图', icon: 'camera' },
    { id: 'swipe_up', label: '上滑', icon: 'arrow-up' },
    { id: 'swipe_down', label: '下滑', icon: 'arrow-down' },
    { id: 'swipe_left', label: '左滑', icon: 'arrow-left' },
    { id: 'swipe_right', label: '右滑', icon: 'arrow-right' },
    { id: 'tap', label: '点击', icon: 'mouse-pointer' },
    { id: 'input', label: '输入', icon: 'keyboard' },
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'back', label: '返回', icon: 'corner-down-left' },
    { id: 'power', label: '电源', icon: 'power' }
  ]

  const executeCommand = async (content: string, deviceId?: string, type: Command['type'] = 'text') => {
    const id = 'cmd_' + Date.now()
    const command: Command = {
      id,
      content,
      type,
      status: 'pending',
      deviceId,
      createdAt: Date.now(),
      steps: generateSteps(content)
    }
    
    commandQueue.value.push(command)
    history.value.unshift(command)
    
    if (history.value.length > maxHistorySize) {
      history.value.pop()
    }

    currentExecutingId.value = id
    command.status = 'executing'
    
    return id
  }

  const generateSteps = (content: string): CommandStep[] => {
    const steps: CommandStep[] = []
    const parts = content.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    
    if (parts.length === 0) {
      steps.push({
        id: 'step_1',
        description: '执行指令',
        status: 'pending',
        progress: 0
      })
    } else {
      parts.forEach((part, index) => {
        steps.push({
          id: `step_${index + 1}`,
          description: part,
          status: 'pending',
          progress: 0
        })
      })
    }
    
    return steps
  }

  const pauseCommand = (commandId: string) => {
    const command = commandQueue.value.find(c => c.id === commandId)
    if (command && command.status === 'executing') {
      command.status = 'paused'
    }
  }

  const resumeCommand = (commandId: string) => {
    const command = commandQueue.value.find(c => c.id === commandId)
    if (command && command.status === 'paused') {
      command.status = 'executing'
    }
  }

  const stopCommand = (commandId: string) => {
    const command = commandQueue.value.find(c => c.id === commandId)
    if (command) {
      command.status = 'failed'
      command.completedAt = Date.now()
      command.error = '用户手动停止'
      
      if (currentExecutingId.value === commandId) {
        currentExecutingId.value = null
      }
    }
  }

  const completeCommand = (commandId: string, result?: string) => {
    const command = commandQueue.value.find(c => c.id === commandId)
    if (command) {
      command.status = 'completed'
      command.completedAt = Date.now()
      command.result = result
      command.progress = 100
      
      if (command.steps) {
        command.steps.forEach(s => {
          s.status = 'completed'
          s.progress = 100
        })
      }
      
      if (currentExecutingId.value === commandId) {
        currentExecutingId.value = null
      }
    }
  }

  const updateProgress = (commandId: string, progress: number, stepIndex?: number) => {
    const command = commandQueue.value.find(c => c.id === commandId)
    if (command) {
      command.progress = progress
      
      if (stepIndex !== undefined && command.steps && command.steps[stepIndex]) {
        command.steps[stepIndex].status = 'executing'
        command.steps[stepIndex].progress = progress
        
        if (stepIndex > 0) {
          command.steps[stepIndex - 1].status = 'completed'
          command.steps[stepIndex - 1].progress = 100
        }
      }
    }
  }

  const reExecuteCommand = (commandId: string) => {
    const command = history.value.find(c => c.id === commandId)
    if (command) {
      return executeCommand(command.content, command.deviceId, command.type)
    }
    return null
  }

  const deleteHistoryItem = (commandId: string) => {
    const index = history.value.findIndex(c => c.id === commandId)
    if (index !== -1) {
      history.value.splice(index, 1)
    }
  }

  const clearHistory = () => {
    history.value = []
  }

  const clearQueue = () => {
    commandQueue.value = []
    currentExecutingId.value = null
  }

  return {
    currentCommand,
    commandQueue,
    currentExecutingId,
    history,
    quickCommands,
    currentExecuting,
    isExecuting,
    executeCommand,
    pauseCommand,
    resumeCommand,
    stopCommand,
    completeCommand,
    updateProgress,
    reExecuteCommand,
    deleteHistoryItem,
    clearHistory,
    clearQueue
  }
})
