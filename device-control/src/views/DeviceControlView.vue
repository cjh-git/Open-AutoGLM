<template>
  <div class="device-control-page">
    <div class="page-header flex justify-between items-center mb-4">
      <div class="flex gap-2">
        <button 
          class="btn" 
          :class="filterStatus === 'all' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'all'"
        >
          全部
        </button>
        <button 
          class="btn" 
          :class="filterStatus === 'online' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'online'"
        >
          在线
        </button>
        <button 
          class="btn" 
          :class="filterStatus === 'offline' ? 'btn-primary' : 'btn-ghost'"
          @click="filterStatus = 'offline'"
        >
          离线
        </button>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="refreshDevices">
          <RefreshCw :class="{ 'spinner': deviceStore.isRefreshing }" />
          刷新
        </button>
        <button class="btn btn-primary" @click="showAddModal = true">
          <Plus />
          添加设备
        </button>
      </div>
    </div>

    <div class="control-layout">
      <!-- 左侧：设备列表 -->
      <div class="devices-section">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">设备列表</h3>
            <span class="text-sm text-muted">{{ filteredDevices.length }} 台设备</span>
          </div>
          <div class="devices-list">
            <div 
              v-for="device in filteredDevices" 
              :key="device.id"
              class="device-row"
              :class="{ selected: device.id === deviceStore.selectedDeviceId }"
              @click="selectDevice(device.id)"
            >
              <div class="device-icon">
                <Apple v-if="device.os === 'ios'" />
                <div v-else-if="device.os === 'android'" class="android-icon">A</div>
                <div v-else class="harmony-icon">HM</div>
              </div>
              <div class="device-info">
                <div class="device-name">{{ device.name }}</div>
                <div class="device-meta text-sm text-muted">
                  {{ device.model }} · {{ device.status === 'online' ? getConnectionDuration(device.connectedAt) : '离线' }}
                </div>
              </div>
              <span class="status-dot" :class="device.status"></span>
            </div>
            <div v-if="filteredDevices.length === 0" class="empty-state">
              <Smartphone />
              <div class="empty-state-title">暂无设备</div>
            </div>
          </div>
        </div>

        <!-- 设备详情 -->
        <div v-if="selectedDevice" class="card mt-4">
          <div class="card-header">
            <h3 class="card-title">设备详情</h3>
          </div>
          <div class="device-detail">
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="label">状态</span>
                <span class="value">
                  <span class="status-dot" :class="selectedDevice.status"></span>
                  {{ selectedDevice.status === 'online' ? '在线' : '离线' }}
                </span>
              </div>
              <div class="detail-stat">
                <span class="label">系统</span>
                <span class="value">{{ getOSName(selectedDevice.os) }}</span>
              </div>
              <div class="detail-stat">
                <span class="label">连接时长</span>
                <span class="value">{{ getConnectionDuration(selectedDevice.connectedAt) }}</span>
              </div>
              <div class="detail-stat">
                <span class="label">IP地址</span>
                <span class="value font-mono">{{ selectedDevice.ip || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：屏幕显示 -->
      <div class="screen-section">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">设备屏幕</h3>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-ghost" @click="takeScreenshot">
                <Camera />
                截图
              </button>
              <button class="btn btn-sm btn-ghost" @click="toggleFullscreen">
                <Maximize2 />
                全屏
              </button>
            </div>
          </div>
          <div class="screen-viewport" ref="screenViewport">
            <div v-if="selectedDevice" class="screen-content" :class="{ connected: selectedDevice.status === 'online' }">
              <div v-if="selectedDevice.status === 'online'" class="screen-frame">
                <div class="screen-notch"></div>
                <div class="screen-display">
                  <div class="screen-device-content" :style="deviceScreenStyle">
                    <div v-if="deviceScreenImage" class="screen-image-container">
                      <img :src="deviceScreenImage" alt="设备屏幕" class="screen-image" />
                    </div>
                    <div v-else class="screen-placeholder">
                      <div class="placeholder-icon">
                        <Smartphone :size="48" />
                      </div>
                      <p>等待屏幕信号...</p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="screen-offline">
                <WifiOff />
                <p>设备离线</p>
              </div>
            </div>
            <div v-else class="screen-empty">
              <Monitor />
              <p>选择设备以查看屏幕</p>
            </div>
          </div>
        </div>

        <!-- 快捷指令 -->
        <div class="card mt-4">
          <div class="card-header">
            <h3 class="card-title">快捷指令</h3>
          </div>
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

      <!-- 右侧：指令控制 -->
      <div class="command-section">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">指令输入</h3>
            <button 
              class="btn btn-sm btn-ghost"
              :disabled="!aiStore.canUseAI"
              @click="executeAICommand"
            >
              <Sparkles />
              AI解析
            </button>
          </div>
          
          <div class="command-input-area">
            <textarea 
              v-model="commandStore.currentCommand"
              class="command-textarea"
              placeholder="输入指令，每条指令以逗号分隔...&#10;&#10;示例:&#10;tap 500 500&#10;screenshot&#10;swipe 500 1000 500 300 300"
              rows="15"
            ></textarea>
            
            <div class="command-actions" style="margin-bottom: 8px;">
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
              </button>
              <button 
                v-if="commandStore.isExecuting"
                class="btn btn-danger"
                @click="stopCommand"
              >
                <Square />
              </button>
            </div>
          </div>

          <!-- 执行进度 -->
          <div v-if="commandStore.currentExecuting" class="execution-progress mt-4">
            <div class="progress-header flex justify-between items-center mb-2">
              <span class="text-sm">执行进度</span>
              <span class="badge" :class="getStatusBadgeClass(commandStore.currentExecuting.status)">
                {{ getStatusText(commandStore.currentExecuting.status) }}
              </span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-bar-fill"
                :style="{ width: `${commandStore.currentExecuting.progress || 0}%` }"
              ></div>
            </div>
            <div class="progress-text text-sm text-muted mt-1">
              {{ commandStore.currentExecuting.progress || 0 }}%
            </div>
          </div>
        </div>

        <!-- 指令历史 -->
        <div class="card mt-4">
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
              v-for="cmd in commandStore.history.slice(0, 10)"
              :key="cmd.id"
              class="history-item"
            >
              <div class="history-content">
                <span class="command-text font-mono text-sm">{{ cmd.content }}</span>
                <span class="badge" :class="getStatusBadgeClass(cmd.status)">
                  {{ getStatusText(cmd.status) }}
                </span>
              </div>
              <div class="history-meta text-xs text-muted">
                {{ formatTime(cmd.createdAt) }}
              </div>
            </div>
            <div v-if="commandStore.history.length === 0" class="empty-state py-4">
              <History />
              <div class="empty-state-title">暂无指令历史</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加设备弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">添加设备</h3>
          <button class="btn btn-ghost btn-icon" @click="showAddModal = false">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">设备名称</label>
            <input v-model="newDevice.name" class="input" placeholder="输入设备名称" />
          </div>
          <div class="form-group">
            <label class="form-label">设备型号</label>
            <input v-model="newDevice.model" class="input" placeholder="如: iPhone 15 Pro" />
          </div>
          <div class="form-group">
            <label class="form-label">操作系统</label>
            <select v-model="newDevice.os" class="select">
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="harmonyos">鸿蒙OS</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">IP地址</label>
            <input v-model="newDevice.ip" class="input" placeholder="如: 192.168.1.100" />
          </div>
          <div class="form-group">
            <label class="form-label">端口</label>
            <input v-model.number="newDevice.port" class="input" type="number" placeholder="5555" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="addDevice">添加</button>
        </div>
      </div>
    </div>

    <!-- AI解析结果弹窗 -->
    <div v-if="showAIResult" class="modal-overlay" @click.self="showAIResult = false">
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
import { ref, computed } from 'vue'
import { 
  RefreshCw, 
  Plus, 
  Apple, 
  Camera, 
  Maximize2, 
  WifiOff,
  Monitor,
  Smartphone,
  Sparkles,
  Play,
  Pause,
  Square,
  Loader2,
  Trash2,
  History,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MousePointer,
  Keyboard,
  Home,
  CornerDownLeft,
  Power
} from 'lucide-vue-next'
import { useDeviceStore } from '@/stores/deviceStore'
import { useCommandStore } from '@/stores/commandStore'
import { useLogStore } from '@/stores/logStore'
import { useAIStore } from '@/stores/aiStore'
import { formatDuration } from '@/utils/helpers'

const deviceStore = useDeviceStore()
const commandStore = useCommandStore()
const logStore = useLogStore()
const aiStore = useAIStore()

const filterStatus = ref<'all' | 'online' | 'offline'>('all')
const showAddModal = ref(false)
const screenViewport = ref<HTMLElement | null>(null)
const showAIResult = ref(false)
const aiUserInput = ref('')

const newDevice = ref({
  name: '',
  model: '',
  os: 'ios' as 'ios' | 'android' | 'harmonyos',
  ip: '',
  port: 5555
})

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

const selectedDevice = computed(() => deviceStore.selectedDevice)

const filteredDevices = computed(() => {
  let devices = [...deviceStore.devices]
  if (filterStatus.value !== 'all') {
    devices = devices.filter(d => d.status === filterStatus.value)
  }
  return devices
})

const deviceScreenImage = computed(() => {
  if (!selectedDevice.value) return ''
  return selectedDevice.value.screenshot || ''
})

const deviceScreenStyle = computed(() => {
  return {
    aspectRatio: '9/16',
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const
  }
})

const getOSName = (os: string) => {
  const map: Record<string, string> = {
    ios: 'iOS',
    android: 'Android',
    harmonyos: '鸿蒙'
  }
  return map[os] || os
}

const getConnectionDuration = (connectedAt?: number) => {
  if (!connectedAt) return '未连接'
  return formatDuration(Date.now() - connectedAt)
}

const selectDevice = (deviceId: string) => {
  deviceStore.selectDevice(deviceId)
}

const refreshDevices = async () => {
  await deviceStore.refreshDevices()
  logStore.addInfoLog('设备列表已刷新')
}

const addDevice = () => {
  if (!newDevice.value.name || !newDevice.value.model) {
    logStore.addWarnLog('请填写设备名称和型号')
    return
  }
  
  deviceStore.addDevice({
    ...newDevice.value,
    status: 'offline'
  })
  
  logStore.addInfoLog(`已添加设备: ${newDevice.value.name}`)
  showAddModal.value = false
  newDevice.value = { name: '', model: '', os: 'ios', ip: '', port: 5555 }
}

const takeScreenshot = () => {
  if (selectedDevice.value?.status !== 'online') {
    logStore.addWarnLog('设备离线，无法截图')
    return
  }
  logStore.addInfoLog('截图成功', `设备: ${selectedDevice.value.name}`, selectedDevice.value.id, selectedDevice.value.name)
}

const toggleFullscreen = () => {
  if (screenViewport.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      screenViewport.value.requestFullscreen()
    }
  }
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
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const executeCommand = async () => {
  const device = selectedDevice.value
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
  const device = selectedDevice.value
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

const clearHistory = () => {
  if (confirm('确定要清空所有指令历史吗？')) {
    commandStore.clearHistory()
    logStore.addInfoLog('指令历史已清空')
  }
}
</script>

<style scoped>
.device-control-page {
  height: 100%;
}

.control-layout {
  display: grid;
  grid-template-columns: 280px 1fr 360px;
  gap: 16px;
  height: calc(100vh - 160px);
}

.devices-section, .screen-section, .command-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.devices-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.device-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition);
  border: 2px solid transparent;
}

.device-row:hover {
  background: var(--surface-light);
}

.device-row.selected {
  border-color: var(--primary);
  background: var(--surface-light);
}

.device-icon {
  width: 40px;
  height: 40px;
  background: var(--surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.device-icon svg {
  width: 20px;
  height: 20px;
}

.android-icon, .harmony-icon {
  font-weight: 700;
  color: var(--secondary);
}

.harmony-icon {
  font-size: 12px;
  color: var(--primary-light);
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-detail {
  display: flex;
  flex-direction: column;
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-stat {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}

.detail-stat .label {
  color: var(--text-secondary);
  font-size: 13px;
}

.detail-stat .value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.screen-viewport {
  background: var(--background);
  border-radius: var(--radius-lg);
  aspect-ratio: 9/16;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screen-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screen-frame {
  width: 180px;
  height: 360px;
  background: #1a1a1a;
  border-radius: 24px;
  padding: 8px;
  box-shadow: var(--shadow-lg);
  border: 2px solid #333;
}

.screen-notch {
  width: 50px;
  height: 16px;
  background: #000;
  border-radius: 0 0 10px 10px;
  margin: 0 auto;
}

.screen-display {
  width: 100%;
  height: calc(100% - 22px);
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 12px;
  margin-top: 6px;
  overflow: hidden;
  position: relative;
}

.screen-device-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.screen-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.screen-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.screen-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 12px;
  width: 100%;
  height: 100%;
}

.placeholder-icon {
  opacity: 0.3;
}

.screen-placeholder p {
  font-size: 11px;
  opacity: 0.5;
}

.screen-offline, .screen-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 12px;
}

.screen-offline svg, .screen-empty svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
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
  gap: 4px;
  padding: 10px 6px;
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
  width: 18px;
  height: 18px;
}

.quick-btn span {
  font-size: 10px;
}

.command-input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  min-height: 140px;
  line-height: 1.6;
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

.execution-progress {
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--background);
  border-radius: var(--radius-md);
}

.history-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.history-content .command-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  gap: 12px;
}

.ai-original, .ai-parsed {
  padding: 10px;
  background: var(--background);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
}

.ai-parsed {
  white-space: pre-wrap;
  color: var(--secondary);
}

.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .control-layout {
    grid-template-columns: 250px 1fr 320px;
  }
}

@media (max-width: 1200px) {
  .control-layout {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  
  .devices-section {
    grid-column: 1;
    grid-row: 1;
  }
  
  .screen-section {
    grid-column: 2;
    grid-row: 1;
  }
  
  .command-section {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  
  .history-list {
    max-height: 150px;
  }
}

@media (max-width: 768px) {
  .control-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
  }
  
  .devices-section, .screen-section, .command-section {
    grid-column: 1;
    grid-row: auto;
  }
  
  .quick-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
