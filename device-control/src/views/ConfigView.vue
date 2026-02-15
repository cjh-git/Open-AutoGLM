<template>
  <div class="config-page">
    <div class="config-grid">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Sparkles style="color: var(--accent);" />
            AI服务配置
          </h3>
        </div>
        
        <div class="form-group">
          <label class="form-label">AI厂商</label>
          <select v-model="configStore.aiConfig.provider" class="select">
            <option value="zhipu">智谱AI</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">API Key</label>
          <div class="input-password">
            <input 
              v-model="configStore.aiConfig.apiKey"
              :type="showApiKey ? 'text' : 'password'"
              class="input"
              placeholder="输入API Key"
            />
            <button class="toggle-btn" @click="showApiKey = !showApiKey">
              <Eye v-if="showApiKey" />
              <EyeOff v-else />
            </button>
          </div>
          <p class="form-help">
            <span v-if="configStore.isValidApiKey()" class="text-success">
              <CheckCircle2 style="width: 12px; height: 12px;" />
              API Key格式正确
            </span>
            <span v-else class="text-muted">
              API Key将以加密方式存储在本地
            </span>
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">API Endpoint</label>
          <input 
            v-model="configStore.aiConfig.endpoint"
            class="input"
            placeholder="https://open.bigmodel.cn/api/paas/v4"
          />
        </div>

        <div class="form-group">
          <label class="form-label">模型</label>
          <input 
            v-model="configStore.aiConfig.model"
            class="input"
            placeholder="glm-4"
          />
        </div>

        <div class="flex gap-2">
          <button 
            class="btn btn-secondary"
            :disabled="testingAI"
            @click="testAIConnection"
          >
            <Loader2 v-if="testingAI" class="spinner" />
            <Wifi v-else />
            测试连接
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Smartphone style="color: var(--primary);" />
            设备配置
          </h3>
        </div>

        <div class="form-group">
          <label class="form-label">当前控制设备</label>
          <select v-model="selectedDevice" class="select" @change="changeDevice">
            <option value="">未选择</option>
            <option 
              v-for="device in deviceStore.devices" 
              :key="device.id" 
              :value="device.id"
              :disabled="device.status !== 'online'"
            >
              {{ device.name }} ({{ device.status === 'online' ? '在线' : '离线' }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">设备列表刷新</label>
          <div class="flex gap-2 items-center">
            <button 
              class="btn btn-secondary"
              :disabled="deviceStore.isRefreshing"
              @click="refreshDevices"
            >
              <RefreshCw :class="{ 'spinner': deviceStore.isRefreshing }" />
              手动刷新
            </button>
          </div>
          <p class="form-help mt-2">
            上次刷新: {{ formatTime(deviceStore.lastRefreshTime) }}
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">自动刷新间隔</label>
          <select v-model="configStore.connectionConfig.autoRefreshInterval" class="select">
            <option :value="0">关闭</option>
            <option :value="30000">30秒</option>
            <option :value="60000">1分钟</option>
            <option :value="120000">2分钟</option>
            <option :value="300000">5分钟</option>
          </select>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Wifi style="color: var(--secondary);" />
            连接配置
          </h3>
        </div>

        <div class="form-group">
          <label class="form-label">WebSocket服务器地址</label>
          <input 
            v-model="configStore.connectionConfig.wsUrl"
            class="input"
            placeholder="ws://localhost:8080/ws"
          />
        </div>

        <div class="form-group">
          <label class="form-label">心跳间隔 (毫秒)</label>
          <input 
            v-model.number="configStore.connectionConfig.heartbeatInterval"
            class="input"
            type="number"
            placeholder="30000"
          />
        </div>

        <div class="form-group">
          <label class="form-label">重连尝试次数</label>
          <input 
            v-model.number="configStore.connectionConfig.reconnectAttempts"
            class="input"
            type="number"
            placeholder="3"
          />
        </div>

        <div class="form-group">
          <label class="form-label">重连间隔 (毫秒)</label>
          <input 
            v-model.number="configStore.connectionConfig.reconnectInterval"
            class="input"
            type="number"
            placeholder="5000"
          />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Settings style="color: var(--text-secondary);" />
            日志配置
          </h3>
        </div>

        <div class="form-group">
          <label class="form-label">日志级别</label>
          <select v-model="configStore.logLevel" class="select">
            <option value="debug">Debug (调试)</option>
            <option value="info">Info (信息)</option>
            <option value="warn">Warn (警告)</option>
            <option value="error">Error (错误)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="config-toggle">
            <input 
              type="checkbox" 
              v-model="configStore.autoScroll"
            />
            <span class="toggle-slider"></span>
            <span class="toggle-label">自动滚动日志</span>
          </label>
        </div>

        <div class="card-header mt-4" style="border-top: 1px solid var(--border); padding-top: 16px;">
          <h3 class="card-title" style="color: var(--danger);">
            <AlertTriangle style="color: var(--danger);" />
            危险操作
          </h3>
        </div>

        <div class="danger-zone">
          <button class="btn btn-danger" @click="confirmReset">
            <Trash2 />
            重置所有配置
          </button>
        </div>
      </div>
    </div>

    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--danger);">确认重置</h3>
          <button class="btn btn-ghost btn-icon" @click="showResetConfirm = false">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <p>确定要重置所有配置吗？此操作将清除所有本地存储的配置数据，无法恢复。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showResetConfirm = false">取消</button>
          <button class="btn btn-danger" @click="resetConfig">确认重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Wifi,
  Smartphone,
  RefreshCw,
  Settings,
  AlertTriangle,
  Trash2,
  X
} from 'lucide-vue-next'
import { useConfigStore } from '@/stores/configStore'
import { useDeviceStore } from '@/stores/deviceStore'
import { useLogStore } from '@/stores/logStore'
import { useAIStore } from '@/stores/aiStore'

const configStore = useConfigStore()
const deviceStore = useDeviceStore()
const logStore = useLogStore()
const aiStore = useAIStore()

const showApiKey = ref(false)
const testingAI = ref(false)
const showResetConfirm = ref(false)
const selectedDevice = ref(configStore.selectedDeviceId || '')

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const testAIConnection = async () => {
  if (!configStore.isValidApiKey()) {
    logStore.addWarnLog('请先配置有效的API Key')
    return
  }
  
  testingAI.value = true
  try {
    await aiStore.testConnection()
    logStore.addInfoLog('AI服务连接测试成功')
  } catch (e: any) {
    logStore.addErrorLog('AI服务连接测试失败', e.message)
  } finally {
    testingAI.value = false
  }
}

const changeDevice = () => {
  configStore.setSelectedDevice(selectedDevice.value || undefined)
  if (selectedDevice.value) {
    deviceStore.selectDevice(selectedDevice.value)
    logStore.addInfoLog(`已切换控制设备: ${deviceStore.selectedDevice?.name}`)
  }
}

const refreshDevices = async () => {
  await deviceStore.refreshDevices()
  logStore.addInfoLog('设备列表已刷新')
}

const confirmReset = () => {
  showResetConfirm.value = true
}

const resetConfig = () => {
  configStore.resetConfig()
  selectedDevice.value = ''
  logStore.addInfoLog('所有配置已重置')
  showResetConfirm.value = false
}
</script>

<style scoped>
.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.config-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.config-toggle input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: var(--surface-light);
  border-radius: 12px;
  position: relative;
  transition: all var(--transition);
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: all var(--transition);
}

.config-toggle input:checked + .toggle-slider {
  background: var(--primary);
}

.config-toggle input:checked + .toggle-slider::after {
  left: 23px;
}

.toggle-label {
  font-size: 14px;
}

.danger-zone {
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

@media (max-width: 1024px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
