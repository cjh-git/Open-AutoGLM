<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(37, 99, 235, 0.2);">
          <Smartphone style="color: var(--primary);" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ deviceStore.devices.length }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.2);">
          <Wifi style="color: var(--secondary);" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ deviceStore.onlineDevices.length }}</div>
          <div class="stat-label">在线设备</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.2);">
          <Terminal style="color: var(--accent);" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ commandStore.history.length }}</div>
          <div class="stat-label">执行指令</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.2);">
          <AlertCircle style="color: var(--danger);" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ errorCount }}</div>
          <div class="stat-label">错误日志</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">在线设备</h3>
          <router-link to="/devices" class="btn btn-sm btn-secondary">查看全部</router-link>
        </div>
        <div class="device-list">
          <div 
            v-for="device in deviceStore.onlineDevices.slice(0, 4)" 
            :key="device.id"
            class="device-item"
            :class="{ selected: device.id === deviceStore.selectedDeviceId }"
            @click="deviceStore.selectDevice(device.id)"
          >
            <div class="device-icon">
              <Apple v-if="device.os === 'ios'" />
              <div v-else-if="device.os === 'android'" class="android-icon">A</div>
              <div v-else class="harmony-icon">HM</div>
            </div>
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-meta text-sm text-muted">
                {{ device.model }} · {{ getConnectionDuration(device.connectedAt) }}
              </div>
            </div>
            <span class="status-dot online"></span>
          </div>
          <div v-if="deviceStore.onlineDevices.length === 0" class="empty-state">
            <WifiOff />
            <div class="empty-state-title">暂无在线设备</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">最近指令</h3>
          <router-link to="/commands" class="btn btn-sm btn-secondary">查看全部</router-link>
        </div>
        <div class="command-list">
          <div 
            v-for="cmd in commandStore.history.slice(0, 5)" 
            :key="cmd.id"
            class="command-item"
          >
            <div class="command-content">
              <div class="command-text truncate">{{ cmd.content }}</div>
              <div class="command-meta text-sm text-muted">
                {{ formatTime(cmd.createdAt) }}
              </div>
            </div>
            <span class="badge" :class="getStatusBadgeClass(cmd.status)">
              {{ getStatusText(cmd.status) }}
            </span>
          </div>
          <div v-if="commandStore.history.length === 0" class="empty-state">
            <Terminal />
            <div class="empty-state-title">暂无指令记录</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">最近日志</h3>
          <router-link to="/logs" class="btn btn-sm btn-secondary">查看全部</router-link>
        </div>
        <div class="log-list">
          <div 
            v-for="log in logStore.logs.slice(0, 6)" 
            :key="log.id"
            class="log-item"
          >
            <span class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message truncate">{{ log.message }}</span>
            <span class="log-time text-xs text-muted">{{ formatTime(log.timestamp) }}</span>
          </div>
          <div v-if="logStore.logs.length === 0" class="empty-state">
            <FileText />
            <div class="empty-state-title">暂无日志</div>
          </div>
        </div>
      </div>

      <div class="card quick-actions">
        <div class="card-header">
          <h3 class="card-title">快捷操作</h3>
        </div>
        <div class="action-grid">
          <button 
            v-for="action in quickActions" 
            :key="action.id"
            class="action-btn"
            @click="executeQuickAction(action.id)"
          >
            <component :is="action.icon" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Terminal, 
  AlertCircle,
  Apple,
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
  FileText
} from 'lucide-vue-next'
import { useDeviceStore } from '@/stores/deviceStore'
import { useCommandStore } from '@/stores/commandStore'
import { useLogStore } from '@/stores/logStore'
import { formatDuration, formatTimestamp } from '@/utils/helpers'

const deviceStore = useDeviceStore()
const commandStore = useCommandStore()
const logStore = useLogStore()

const errorCount = computed(() => 
  logStore.logs.filter(l => l.level === 'error').length
)

const quickActions = [
  { id: 'screenshot', label: '截图', icon: Camera },
  { id: 'swipe_up', label: '上滑', icon: ArrowUp },
  { id: 'swipe_down', label: '下滑', icon: ArrowDown },
  { id: 'swipe_left', label: '左滑', icon: ArrowLeft },
  { id: 'swipe_right', label: '右滑', icon: ArrowRight },
  { id: 'tap', label: '点击', icon: MousePointer },
  { id: 'input', label: '输入', icon: Keyboard },
  { id: 'home', label: 'Home', icon: Home }
]

const getConnectionDuration = (connectedAt?: number) => {
  if (!connectedAt) return '未连接'
  return formatDuration(Date.now() - connectedAt)
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
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

const executeQuickAction = async (actionId: string) => {
  const device = deviceStore.selectedDevice
  if (!device) {
    logStore.addWarnLog('请先选择要控制的设备')
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
    home: 'home'
  }

  const command = actionMap[actionId]
  if (command) {
    await commandStore.executeCommand(command, device.id, 'action')
    logStore.addInfoLog(`执行快捷指令: ${actionId}`, `设备: ${device.name}`, device.id, device.name)
  }
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.device-list, .command-list, .log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition);
}

.device-item:hover {
  background: var(--surface-light);
}

.device-item.selected {
  border: 1px solid var(--primary);
}

.device-icon {
  width: 40px;
  height: 40px;
  background: var(--surface-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

.device-icon svg {
  width: 20px;
  height: 20px;
}

.harmony-icon {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-light);
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-weight: 500;
  color: var(--text-primary);
}

.command-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: var(--background);
  border-radius: var(--radius-md);
}

.command-content {
  flex: 1;
  min-width: 0;
}

.command-text {
  font-family: var(--font-mono);
  font-size: 13px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--background);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.log-level {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.log-level.info {
  background: rgba(37, 99, 235, 0.2);
  color: var(--primary-light);
}

.log-level.warn {
  background: rgba(245, 158, 11, 0.2);
  color: var(--accent);
}

.log-level.error {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.log-level.debug {
  background: rgba(148, 163, 184, 0.2);
  color: var(--text-secondary);
}

.log-message {
  flex: 1;
}

.log-time {
  flex-shrink: 0;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--background);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition);
}

.action-btn:hover {
  background: var(--primary);
  color: white;
}

.action-btn svg {
  width: 24px;
  height: 24px;
}

.action-btn span {
  font-size: 12px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
