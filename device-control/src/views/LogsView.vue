<template>
  <div class="logs-page">
    <div class="logs-header">
      <div class="filter-bar">
        <div class="filter-group">
          <label class="form-label">设备</label>
          <select v-model="filterDeviceId" class="select">
            <option value="">全部设备</option>
            <option v-for="device in deviceStore.devices" :key="device.id" :value="device.id">
              {{ device.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="form-label">操作类型</label>
          <select v-model="filterType" class="select">
            <option value="">全部类型</option>
            <option value="execute">执行</option>
            <option value="stop">停止</option>
            <option value="pause">暂停</option>
            <option value="ai_parse">AI解析</option>
            <option value="connection">连接</option>
            <option value="system">系统</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="form-label">日志级别</label>
          <select v-model="filterLevel" class="select">
            <option value="">全部级别</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="form-label">时间范围</label>
          <select v-model="dateRange" class="select" @change="applyDateFilter">
            <option value="today">今天</option>
            <option value="week">最近7天</option>
            <option value="all">全部</option>
          </select>
        </div>
        
        <div class="filter-group" style="flex: 1;">
          <label class="form-label">关键词搜索</label>
          <input 
            v-model="searchKeyword"
            class="input"
            placeholder="搜索日志内容..."
            @input="applySearch"
          />
        </div>
        
        <div class="filter-actions">
          <button class="btn btn-ghost btn-sm" @click="clearFilters">
            <X />
            清除筛选
          </button>
        </div>
      </div>
      
      <div class="logs-actions">
        <div class="logs-stats">
          <span class="text-sm text-muted">
            共 {{ logStore.filteredLogs.length }} 条日志
          </span>
        </div>
        <div class="flex gap-2">
          <button 
            class="btn btn-secondary btn-sm"
            :disabled="!logStore.filteredLogs.length"
            @click="copySelectedLogs"
          >
            <Copy />
            复制选中
          </button>
          <button 
            class="btn btn-secondary btn-sm"
            @click="exportLogs"
          >
            <Download />
            导出日志
          </button>
          <button 
            class="btn btn-danger btn-sm"
            @click="confirmClearLogs"
          >
            <Trash2 />
            清空日志
          </button>
        </div>
      </div>
    </div>

    <div class="logs-content">
      <div class="logs-list" ref="logsListRef">
        <div 
          v-for="log in logStore.filteredLogs" 
          :key="log.id"
          class="log-item"
          :class="{ selected: selectedLogs.has(log.id) }"
          @click="toggleSelectLog(log.id)"
        >
          <div class="log-checkbox">
            <input 
              type="checkbox" 
              :checked="selectedLogs.has(log.id)"
              @click.stop
              @change="toggleSelectLog(log.id)"
            />
          </div>
          <div class="log-content">
            <div class="log-header">
              <span class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
              <span class="log-time">{{ formatTimestamp(log.timestamp) }}</span>
              <span v-if="log.deviceName" class="log-device">
                <Smartphone style="width: 12px; height: 12px;" />
                {{ log.deviceName }}
              </span>
              <span class="log-type badge" :class="getTypeBadgeClass(log.type)">
                {{ getTypeText(log.type) }}
              </span>
            </div>
            <div class="log-message">{{ log.message }}</div>
            <div v-if="log.details" class="log-details">{{ log.details }}</div>
          </div>
          <div class="log-actions">
            <button class="btn btn-ghost btn-icon btn-sm" @click.stop="copySingleLog(log.id)">
              <Copy style="width: 14px; height: 14px;" />
            </button>
          </div>
        </div>
        
        <div v-if="logStore.filteredLogs.length === 0" class="empty-state">
          <FileText />
          <div class="empty-state-title">暂无日志</div>
          <p class="text-sm text-muted">执行操作后将显示日志</p>
        </div>
      </div>
    </div>

    <div v-if="showClearConfirm" class="modal-overlay" @click.self="showClearConfirm = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">清空日志</h3>
          <button class="btn btn-ghost btn-icon" @click="showClearConfirm = false">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <p>请选择清空范围：</p>
          <div class="clear-options">
            <button class="clear-option" @click="clearLogs(false)">
              <Trash2 />
              <span>清空全部日志</span>
              <span class="text-sm text-muted">将删除所有日志记录</span>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showClearConfirm = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { 
  Copy, 
  Download, 
  Trash2, 
  X, 
  FileText,
  Smartphone
} from 'lucide-vue-next'
import { useLogStore } from '@/stores/logStore'
import { useDeviceStore } from '@/stores/deviceStore'
import { useConfigStore } from '@/stores/configStore'
import { formatTimestamp, copyToClipboard } from '@/utils/helpers'
import dayjs from 'dayjs'

const logStore = useLogStore()
const deviceStore = useDeviceStore()
const configStore = useConfigStore()

const logsListRef = ref<HTMLElement | null>(null)
const selectedLogs = ref(new Set<string>())
const filterDeviceId = ref('')
const filterType = ref('')
const filterLevel = ref('')
const dateRange = ref('all')
const searchKeyword = ref('')
const showClearConfirm = ref(false)

watch([filterDeviceId, filterType, filterLevel], () => {
  logStore.setFilter({
    deviceId: filterDeviceId.value || undefined,
    type: filterType.value as any || undefined,
    level: filterLevel.value as any || undefined
  })
}, { immediate: true })

watch(() => logStore.filteredLogs, () => {
  if (configStore.autoScroll && logsListRef.value) {
    nextTick(() => {
      logsListRef.value!.scrollTop = logsListRef.value!.scrollHeight
    })
  }
})

const applyDateFilter = () => {
  let start: number | undefined
  let end: number | undefined
  
  if (dateRange.value === 'today') {
    start = dayjs().startOf('day').valueOf()
    end = dayjs().endOf('day').valueOf()
  } else if (dateRange.value === 'week') {
    start = dayjs().subtract(7, 'day').startOf('day').valueOf()
    end = dayjs().endOf('day').valueOf()
  }
  
  logStore.setFilter({
    dateRange: start && end ? { start, end } : undefined
  })
}

const applySearch = () => {
  logStore.setFilter({
    keyword: searchKeyword.value
  })
}

const clearFilters = () => {
  filterDeviceId.value = ''
  filterType.value = ''
  filterLevel.value = ''
  dateRange.value = 'all'
  searchKeyword.value = ''
  logStore.clearFilters()
}

const toggleSelectLog = (logId: string) => {
  if (selectedLogs.value.has(logId)) {
    selectedLogs.value.delete(logId)
  } else {
    selectedLogs.value.add(logId)
  }
  selectedLogs.value = new Set(selectedLogs.value)
}

const copySingleLog = async (logId: string) => {
  const text = logStore.copyLog(logId)
  if (text) {
    const success = await copyToClipboard(text)
    if (success) {
      logStore.addInfoLog('日志已复制到剪贴板')
    }
  }
}

const copySelectedLogs = async () => {
  if (selectedLogs.value.size === 0) {
    logStore.addWarnLog('请先选择要复制的日志')
    return
  }
  
  const text = logStore.copySelectedLogs(Array.from(selectedLogs.value))
  const success = await copyToClipboard(text)
  if (success) {
    logStore.addInfoLog(`已复制 ${selectedLogs.value.size} 条日志`)
  }
}

const exportLogs = () => {
  const content = logStore.exportLogs()
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `device-control-logs-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.txt`
  a.click()
  URL.revokeObjectURL(url)
  logStore.addInfoLog('日志已导出')
}

const confirmClearLogs = () => {
  showClearConfirm.value = true
}

const clearLogs = (filteredOnly: boolean) => {
  logStore.clearLogs(filteredOnly)
  selectedLogs.value = new Set()
  showClearConfirm.value = false
  logStore.addInfoLog('日志已清空')
}

const getTypeBadgeClass = (type: string) => {
  const map: Record<string, string> = {
    execute: 'badge-info',
    stop: 'badge-warning',
    pause: 'badge-warning',
    ai_parse: 'badge-info',
    connection: 'badge-success',
    system: 'badge-info'
  }
  return map[type] || 'badge-info'
}

const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    execute: '执行',
    stop: '停止',
    pause: '暂停',
    ai_parse: 'AI解析',
    connection: '连接',
    system: '系统'
  }
  return map[type] || type
}
</script>

<style scoped>
.logs-header {
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.filter-group {
  min-width: 140px;
}

.filter-group:last-of-type {
  flex: 1;
  min-width: 200px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.logs-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.logs-content {
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
}

.logs-list {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background var(--transition);
}

.log-item:hover {
  background: var(--surface-light);
}

.log-item.selected {
  background: rgba(37, 99, 235, 0.1);
}

.log-checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.log-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
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

.log-time {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.log-device {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.log-message {
  font-size: 13px;
  word-break: break-word;
}

.log-details {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--background);
  padding: 8px;
  border-radius: var(--radius-sm);
}

.log-actions {
  flex-shrink: 0;
}

.clear-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.clear-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--background);
  border-radius: var(--radius-md);
  text-align: left;
  transition: all var(--transition);
}

.clear-option:hover {
  background: rgba(239, 68, 68, 0.1);
}

.clear-option svg {
  color: var(--danger);
}

.clear-option span:first-of-type {
  font-weight: 500;
}

.clear-option span:last-child {
  font-size: 12px;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .logs-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
