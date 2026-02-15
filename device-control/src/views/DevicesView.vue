<template>
  <div class="devices-page">
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

    <div class="devices-layout">
      <div class="devices-sidebar">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">设备分组</h3>
            <button class="btn btn-sm btn-ghost" @click="showGroupModal = true">
              <Plus />
            </button>
          </div>
          <div class="group-list">
            <div 
              class="group-item"
              :class="{ active: selectedGroupId === null }"
              @click="selectedGroupId = null"
            >
              <Folder />
              <span>全部设备</span>
              <span class="badge badge-info">{{ deviceStore.devices.length }}</span>
            </div>
            <div 
              v-for="group in deviceStore.groups" 
              :key="group.id"
              class="group-item"
              :class="{ active: selectedGroupId === group.id }"
              @click="selectedGroupId = group.id"
            >
              <Folder :style="{ color: group.color }" />
              <span>{{ group.name }}</span>
              <span class="badge badge-info">{{ group.deviceIds.length }}</span>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header">
            <h3 class="card-title">设备详情</h3>
          </div>
          <div v-if="selectedDevice" class="device-detail">
            <div class="detail-header">
              <div class="device-icon-lg">
                <Apple v-if="selectedDevice.os === 'ios'" />
                <div v-else-if="selectedDevice.os === 'android'" class="android-icon">
                  A
                </div>
                <div v-else class="harmony-icon-lg">HM</div>
              </div>
              <div class="detail-info">
                <h4>{{ selectedDevice.name }}</h4>
                <p class="text-sm text-muted">{{ selectedDevice.model }}</p>
              </div>
            </div>
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
            <div class="detail-actions">
              <button class="btn btn-secondary btn-sm" @click="showEditModal = true">
                <Edit />
                编辑
              </button>
              <button class="btn btn-danger btn-sm" @click="confirmDelete">
                <Trash2 />
                删除
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <Smartphone />
            <div class="empty-state-title">选择设备查看详情</div>
          </div>
        </div>
      </div>

      <div class="devices-main">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              {{ selectedGroupId ? deviceStore.getGroupById(selectedGroupId)?.name : '全部设备' }}
            </h3>
            <span class="text-sm text-muted">{{ filteredDevices.length }} 台设备</span>
          </div>
          <div class="devices-grid">
            <div 
              v-for="device in filteredDevices" 
              :key="device.id"
              class="device-card"
              :class="{ selected: device.id === deviceStore.selectedDeviceId }"
              @click="selectDevice(device.id)"
            >
              <div class="device-card-header">
                <div class="device-icon">
                  <Apple v-if="device.os === 'ios'" />
                  <div v-else-if="device.os === 'android'" class="android-icon">A</div>
                  <div v-else class="harmony-icon">HM</div>
                </div>
                <span class="status-dot" :class="device.status"></span>
              </div>
              <div class="device-card-body">
                <h4 class="device-name truncate">{{ device.name }}</h4>
                <p class="device-model text-sm text-muted truncate">{{ device.model }}</p>
              </div>
              <div class="device-card-footer">
                <span class="text-xs text-muted">
                  {{ device.status === 'online' ? getConnectionDuration(device.connectedAt) : '离线' }}
                </span>
                <span class="os-badge" :class="device.os">{{ getOSName(device.os) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4">
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
                  <div class="screen-texture"></div>
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
      </div>
    </div>

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

    <div v-if="showEditModal && selectedDevice" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">编辑设备</h3>
          <button class="btn btn-ghost btn-icon" @click="showEditModal = false">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">设备名称</label>
            <input v-model="editDevice.name" class="input" />
          </div>
          <div class="form-group">
            <label class="form-label">分配到分组</label>
            <select v-model="editDevice.groupId" class="select">
              <option value="">不分配</option>
              <option v-for="group in deviceStore.groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" @click="saveEditDevice">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showGroupModal" class="modal-overlay" @click.self="showGroupModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">创建设备分组</h3>
          <button class="btn btn-ghost btn-icon" @click="showGroupModal = false">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">分组名称</label>
            <input v-model="newGroup.name" class="input" placeholder="输入分组名称" />
          </div>
          <div class="form-group">
            <label class="form-label">分组颜色</label>
            <div class="color-picker">
              <button 
                v-for="color in groupColors" 
                :key="color"
                class="color-option"
                :class="{ active: newGroup.color === color }"
                :style="{ background: color }"
                @click="newGroup.color = color"
              ></button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showGroupModal = false">取消</button>
          <button class="btn btn-primary" @click="createGroup">创建</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button class="btn btn-ghost btn-icon" @click="showDeleteConfirm = false">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <p>确定要删除设备 "{{ selectedDevice?.name }}" 吗？此操作无法撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteConfirm = false">取消</button>
          <button class="btn btn-danger" @click="deleteDevice">删除</button>
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
  Folder, 
  Apple, 
  Edit, 
  Trash2, 
  Camera, 
  Maximize2, 
  X,
  WifiOff,
  Monitor,
  Smartphone
} from 'lucide-vue-next'
import { useDeviceStore } from '@/stores/deviceStore'
import { useLogStore } from '@/stores/logStore'
import { formatDuration } from '@/utils/helpers'

const deviceStore = useDeviceStore()
const logStore = useLogStore()

const filterStatus = ref<'all' | 'online' | 'offline'>('all')
const selectedGroupId = ref<string | null>(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showGroupModal = ref(false)
const showDeleteConfirm = ref(false)
const screenViewport = ref<HTMLElement | null>(null)

const newDevice = ref({
  name: '',
  model: '',
  os: 'ios' as 'ios' | 'android' | 'harmonyos',
  ip: '',
  port: 5555
})

const editDevice = ref({
  name: '',
  groupId: ''
})

const newGroup = ref({
  name: '',
  color: '#2563EB'
})

const groupColors = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
]

const selectedDevice = computed(() => deviceStore.selectedDevice)

const filteredDevices = computed(() => {
  let devices = [...deviceStore.devices]
  
  if (selectedGroupId.value) {
    devices = deviceStore.getDevicesByGroup(selectedGroupId.value)
  }
  
  if (filterStatus.value !== 'all') {
    devices = devices.filter(d => d.status === filterStatus.value)
  }
  
  return devices
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

const saveEditDevice = () => {
  if (selectedDevice.value) {
    deviceStore.updateDeviceName(selectedDevice.value.id, editDevice.value.name)
    deviceStore.moveDeviceToGroup(selectedDevice.value.id, editDevice.value.groupId || undefined)
    logStore.addInfoLog(`设备已更新: ${editDevice.value.name}`)
    showEditModal.value = false
  }
}

const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const deleteDevice = () => {
  if (selectedDevice.value) {
    const name = selectedDevice.value.name
    deviceStore.removeDevice(selectedDevice.value.id)
    logStore.addInfoLog(`已删除设备: ${name}`)
    showDeleteConfirm.value = false
  }
}

const createGroup = () => {
  if (!newGroup.value.name) {
    logStore.addWarnLog('请输入分组名称')
    return
  }
  
  deviceStore.addGroup({
    name: newGroup.value.name,
    color: newGroup.value.color,
    deviceIds: []
  })
  
  logStore.addInfoLog(`已创建分组: ${newGroup.value.name}`)
  showGroupModal.value = false
  newGroup.value = { name: '', color: '#2563EB' }
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
</script>

<style scoped>
.devices-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
}

.devices-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition);
}

.group-item:hover {
  background: var(--surface-light);
}

.group-item.active {
  background: var(--primary);
  color: white;
}

.group-item svg {
  width: 18px;
  height: 18px;
}

.group-item span:first-of-type {
  flex: 1;
}

.device-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon-lg {
  width: 56px;
  height: 56px;
  background: var(--surface-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-icon-lg svg {
  width: 28px;
  height: 28px;
  color: var(--text-primary);
}

.android-icon, .harmony-icon-lg {
  font-size: 18px;
  font-weight: 700;
  color: var(--secondary);
}

.detail-info h4 {
  font-size: 16px;
  font-weight: 600;
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-stat {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
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

.detail-actions {
  display: flex;
  gap: 8px;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.device-card {
  background: var(--background);
  border-radius: var(--radius-lg);
  padding: 16px;
  cursor: pointer;
  transition: all var(--transition);
  border: 2px solid transparent;
}

.device-card:hover {
  border-color: var(--border);
}

.device-card.selected {
  border-color: var(--primary);
}

.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.device-icon {
  width: 40px;
  height: 40px;
  background: var(--surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-icon svg {
  width: 20px;
  height: 20px;
}

.android-icon {
  font-weight: 700;
  color: var(--secondary);
}

.harmony-icon {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-light);
}

.device-card-body {
  margin-bottom: 12px;
}

.device-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.device-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.os-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--surface-light);
  color: var(--text-secondary);
}

.os-badge.ios {
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.os-badge.android {
  background: rgba(16, 185, 129, 0.2);
  color: var(--secondary);
}

.os-badge.harmonyos {
  background: rgba(37, 99, 235, 0.2);
  color: var(--primary-light);
}

.screen-viewport {
  background: var(--background);
  border-radius: var(--radius-lg);
  aspect-ratio: 9/16;
  max-height: 500px;
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
  box-shadow: 0 0 0 2px #333;
}

.screen-notch {
  width: 60px;
  height: 20px;
  background: #000;
  border-radius: 0 0 12px 12px;
  margin: 0 auto;
}

.screen-display {
  width: 100%;
  height: calc(100% - 28px);
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 16px;
  margin-top: 8px;
  overflow: hidden;
  position: relative;
}

.screen-texture {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
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

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--primary);
}

@media (max-width: 1024px) {
  .devices-layout {
    grid-template-columns: 1fr;
  }
  
  .devices-sidebar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .devices-sidebar {
    grid-template-columns: 1fr;
  }
}
</style>
