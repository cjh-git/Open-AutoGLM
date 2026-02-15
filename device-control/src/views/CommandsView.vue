<template>
  <div class="commands-page">
    <div class="commands-layout">
      <div class="command-panel">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">指令输入</h3>
            <div class="flex gap-2">
              <button 
                class="btn btn-sm btn-ghost"
                :disabled="!aiStore.canUseAI"
                @click="executeAICommand"
              >
                <Sparkles />
                AI解析
              </button>
            </div>
          </div>
          
          <div class="command-input-area">
            <textarea 
              v-model="commandStore.currentCommand"
              class="command-textarea"
              placeholder="输入指令，每条指令以逗号分隔...&#10;&#10;示例:&#10;tap 500 500&#10;screenshot&#10;swipe 500 1000 500 300 300"
              rows="6"
            ></textarea>
            
            <div class="command-actions">
              <button 
                class="btn btn-primary"
                :disabled="!commandStore.currentCommand || commandStore.isExecuting"
                @click="executeCommand"
              >
                <Play v-if="!commandStore.isExecuting" />
                <Loader2 v-else class="spinner" />
                {{ commandStore.isExecuting ? '执行中...' : '执行' }}
              </button>
              <button 
                v-if="commandStore.isExecuting"
                class="btn btn-warning"
                @click="pauseCommand"
              >
                <Pause />
                暂停
              </button>
              <button 
                v-if="commandStore.isExecuting"
                class="btn btn-danger"
                @click="stopCommand"
              >
                <Square />
                停止
              </button>
            </div>
          </div>

          <div class="quick-commands">
            <h4 class="text-sm text-muted mb-2">快捷指令</h4>
            <div class="quick-grid">
              <button 
                v-for="cmd in commandStore.quickCommands"
                :key="cmd.id"
                class="quick-btn"
                @click="executeQuickCommand(cmd.id)"
              >
                <component :is="getQuickIcon(cmd.icon)" />
                <span>{{ cmd.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="commandStore.currentExecuting" class="card mt-4">
          <div class="card-header">
            <h3 class="card-title">执行进度</h3>
            <span class="badge" :class="getStatusBadgeClass(commandStore.currentExecuting.status)">
              {{ getStatusText(commandStore.currentExecuting.status) }}
            </span>
          </div>
          
          <div class="progress-info">
            <div class="progress-bar">
              <div 
                class="progress-bar-fill"
                :style="{ width: `${commandStore.currentExecuting.progress || 0}%` }"
              ></div>
            </div>
            <div class="progress-text text-sm text-muted mt-2">
              {{ commandStore.currentExecuting.progress || 0 }}%
            </div>
          </div>

          <div v-if="commandStore.currentExecuting.steps" class="steps-list mt-4">
            <div 
              v-for="(step, index) in commandStore.currentExecuting.steps"
              :key="step.id"
              class="step-item"
              :class="step.status"
            >
              <div class="step-indicator">
                <CheckCircle2 v-if="step.status === 'completed'" />
                <XCircle v-else-if="step.status === 'failed'" />
                <Loader2 v-else-if="step.status === 'executing'" class="spinner" />
                <Circle v-else />
              </div>
              <div class="step-content">
                <div class="step-description">{{ step.description }}</div>
                <div v-if="step.status === 'executing'" class="progress-bar mt-1">
                  <div class="progress-bar-fill" :style="{ width: `${step.progress}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="history-panel">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">指令历史</h3>
            <button 
              v-if="commandStore.history.length > 0"
              class="btn btn-sm btn-ghost text-danger"
              @click="clearHistory"
            >
              <Trash2 />
              清空
            </button>
          </div>

          <div class="history-list">
            <div 
              v-for="cmd in commandStore.history"
              :key="cmd.id"
              class="history-item"
            >
              <div class="history-content">
                <div class="history-main">
                  <span class="command-text font-mono">{{ cmd.content }}</span>
                  <span class="badge" :class="getStatusBadgeClass(cmd.status)">
                    {{ getStatusText(cmd.status) }}
                  </span>
                </div>
                <div class="history-meta text-xs text-muted">
                  <span>{{ formatTime(cmd.createdAt) }}</span>
                  <span v-if="cmd.deviceId">设备ID: {{ cmd.deviceId }}</span>
                  <span v-if="cmd.type === 'ai'" class="ai-badge">
                    <Sparkles />
                    AI
                  </span>
                </div>
              </div>
              <div class="history-actions">
                <button class="btn btn-sm btn-ghost" @click="copyCommand(cmd.content)">
                  <Copy />
                </button>
                <button class="btn btn-sm btn-ghost" @click="reExecuteCommand(cmd.id)">
                  <RotateCcw />
                </button>
                <button class="btn btn-sm btn-ghost text-danger" @click="deleteHistoryItem(cmd.id)">
                  <Trash2 />
                </button>
              </div>
            </div>

            <div v-if="commandStore.history.length === 0" class="empty-state">
              <History />
              <div class="empty-state-title">暂无指令历史</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAIResult" class="ai-result-overlay" @click.self="showAIResult = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">
            <Sparkles style="color: var(--accent);" />
            AI解析结果
          </h3>
          <button class="btn btn-ghost btn-icon" @click="showAIResult = false">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="aiStore.isProcessing" class="ai-loading">
            <Loader2 class="spinner" />
            <span>正在解析指令...</span>
          </div>
          <div v-else-if="aiStore.error" class="ai-error">
            <AlertCircle style="color: var(--danger);" />
            <p>{{ aiStore.error }}</p>
          </div>
          <div v-else class="ai-success">
            <div class="form-group">
              <label class="form-label">原始指令</label>
              <p class="ai-original">{{ aiUserInput }}</p>
            </div>
            <div class="form-group">
              <label class="form-label">解析结果</label>
              <pre class="ai-parsed">{{ aiStore.lastResponse }}</pre>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showAIResult = false">关闭</button>
          <button 
            v-if="!aiStore.isProcessing && !aiStore.error"
            class="btn btn-primary"
            @click="executeAIResult"
          >
            <Play />
            执行解析结果
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Play, 
  Pause, 
  Square, 
  Loader2, 
  Sparkles,
  Trash2,
  Copy,
  RotateCcw,
  History,
  X,
  AlertCircle,
  Camera,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MousePointer,
  Keyboard,
  Home,
  CornerDownLeft,
  Power,
  CheckCircle2,
  XCircle,
  Circle
} from 'lucide-vue-next'
import { useCommandStore } from '@/stores/commandStore'
import { useDeviceStore } from '@/stores/deviceStore'
import { useLogStore } from '@/stores/logStore'
import { useAIStore } from '@/stores/aiStore'
import { copyToClipboard } from '@/utils/helpers'

const commandStore = useCommandStore()
const deviceStore = useDeviceStore()
const logStore = useLogStore()
const aiStore = useAIStore()

const showAIResult = ref(false)
const aiUserInput = ref('')

const quickIconMap: Record<string, any> = {
  'camera': Camera,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'mouse-pointer': MousePointer,
  'keyboard': Keyboard,
  'home': Home,
  'corner-down-left': CornerDownLeft,
  'power': Power
}

const getQuickIcon = (icon: string) => {
  return quickIconMap[icon] || MousePointer
}

const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    completed: 'badge-success',
    failed: 'badge-danger',
    executing: 'badge-info',
    paused: 'badge-warning',
    pending: 'badge-warning'
  }
  return map[status] || 'badge-info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    completed: '成功',
    failed: '失败',
    executing: '执行中',
    paused: '已暂停',
    pending: '等待中'
  }
  return map[status] || status
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const executeCommand = async () => {
  const device = deviceStore.selectedDevice
  if (!device) {
    logStore.addWarnLog('请先选择要控制的设备')
    return
  }
  
  if (device.status !== 'online') {
    logStore.addWarnLog('设备离线，无法执行指令')
    return
  }

  const commandId = await commandStore.executeCommand(
    commandStore.currentCommand, 
    device.id, 
    'text'
  )
  
  logStore.addInfoLog(`执行指令: ${commandStore.currentCommand}`, `设备: ${device.name}`, device.id, device.name)

  const steps = commandStore.currentExecuting?.steps || []
  for (let i = 0; i < steps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    commandStore.updateProgress(commandId, ((i + 1) / steps.length) * 100, i)
  }
  
  commandStore.completeCommand(commandId, '执行成功')
  commandStore.currentCommand = ''
}

const executeAICommand = async () => {
  if (!commandStore.currentCommand) {
    logStore.addWarnLog('请输入要解析的指令')
    return
  }
  
  aiUserInput.value = commandStore.currentCommand
  showAIResult.value = true
  
  try {
    await aiStore.parseCommand(commandStore.currentCommand)
  } catch (e: any) {
    console.error('AI parse error:', e)
  }
}

const executeAIResult = async () => {
  showAIResult.value = false
  await executeCommand()
}

const pauseCommand = () => {
  if (commandStore.currentExecutingId) {
    commandStore.pauseCommand(commandStore.currentExecutingId)
    logStore.addInfoLog('指令已暂停')
  }
}

const stopCommand = () => {
  if (commandStore.currentExecutingId) {
    commandStore.stopCommand(commandStore.currentExecutingId)
    logStore.addInfoLog('指令已停止')
  }
}

const executeQuickCommand = async (commandId: string) => {
  const device = deviceStore.selectedDevice
  if (!device) {
    logStore.addWarnLog('请先选择要控制的设备')
    return
  }
  
  if (device.status !== 'online') {
    logStore.addWarnLog('设备离线，无法执行指令')
    return
  }

  const actionMap: Record<string, string> = {
    screenshot: 'screenshot',
    swipe_up: 'swipe 500 1000 500 300 300',
    swipe_down: 'swipe 500 300 500 1000 300',
    swipe_left: 'swipe 800 500 200 500 300',
    swipe_right: 'swipe 200 500 800 500 300',
    tap: 'tap 500 500',
    input: 'input',
    home: 'home',
    back: 'back',
    power: 'power'
  }

  const command = actionMap[commandId]
  if (command) {
    commandStore.currentCommand = command
    await executeCommand()
  }
}

const copyCommand = async (content: string) => {
  const success = await copyToClipboard(content)
  if (success) {
    logStore.addInfoLog('指令已复制到剪贴板')
  }
}

const reExecuteCommand = async (commandId: string) => {
  const newId = commandStore.reExecuteCommand(commandId)
  if (newId) {
    logStore.addInfoLog('重新执行指令')
    await executeCommand()
  }
}

const deleteHistoryItem = (commandId: string) => {
  commandStore.deleteHistoryItem(commandId)
}

const clearHistory = () => {
  if (confirm('确定要清空所有指令历史吗？')) {
    commandStore.clearHistory()
    logStore.addInfoLog('指令历史已清空')
  }
}
</script>

<style scoped>
.commands-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 16px;
}

.command-input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.command-textarea {
  width: 100%;
  padding: 12px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  resize: vertical;
  min-height: 120px;
}

.command-textarea:focus {
  border-color: var(--primary);
  outline: none;
}

.command-actions {
  display: flex;
  gap: 8px;
}

.btn-warning {
  background: var(--accent);
  color: white;
}

.btn-warning:hover {
  background: #D97706;
}

.quick-commands {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--background);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition);
}

.quick-btn:hover {
  background: var(--primary);
  color: white;
}

.quick-btn svg {
  width: 20px;
  height: 20px;
}

.quick-btn span {
  font-size: 11px;
}

.progress-info {
  margin-top: 12px;
}

.progress-text {
  text-align: right;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
}

.step-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.step-indicator svg {
  width: 20px;
  height: 20px;
}

.step-item.completed .step-indicator {
  color: var(--secondary);
}

.step-item.executing .step-indicator {
  color: var(--primary);
}

.step-item.failed .step-indicator {
  color: var(--danger);
}

.step-content {
  flex: 1;
}

.step-description {
  font-size: 13px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.history-main .command-text {
  flex: 1;
  font-size: 13px;
}

.history-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  font-size: 10px;
}

.ai-badge svg {
  width: 12px;
  height: 12px;
}

.history-actions {
  display: flex;
  gap: 4px;
}

.ai-result-overlay .modal {
  max-width: 560px;
}

.ai-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  color: var(--text-secondary);
}

.ai-loading .spinner {
  width: 24px;
  height: 24px;
}

.ai-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
}

.ai-error svg {
  width: 32px;
  height: 32px;
}

.ai-success {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-original {
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
}

.ai-parsed {
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  white-space: pre-wrap;
  color: var(--secondary);
}

@media (max-width: 1024px) {
  .commands-layout {
    grid-template-columns: 1fr;
  }
  
  .quick-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
