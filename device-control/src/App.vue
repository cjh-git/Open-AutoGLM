<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">DC</div>
        <span class="sidebar-title">DeviceControl</span>
      </div>
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path" 
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title" style="margin: 0; font-size: 18px;">
            {{ currentPageTitle }}
          </h1>
        </div>
        <div class="header-right">
          <div class="connection-status" :class="{ connected: isConnected }">
            <span class="status-dot" :class="isConnected ? 'online' : 'offline'"></span>
            <span class="text-sm text-muted">{{ isConnected ? '已连接' : '未连接' }}</span>
          </div>
          <button class="btn btn-ghost btn-icon" @click="toggleTheme">
            <Sun v-if="isDark" />
            <Moon v-else />
          </button>
        </div>
      </header>
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  LayoutDashboard, 
  Smartphone, 
  Settings, 
  FileText,
  Sun,
  Moon
} from 'lucide-vue-next'
import { useDeviceStore } from '@/stores/deviceStore'
import { useLogStore } from '@/stores/logStore'

const route = useRoute()
const deviceStore = useDeviceStore()
const logStore = useLogStore()

const isDark = ref(true)
const isConnected = ref(false)

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/control', label: '设备控制', icon: Smartphone },
  { path: '/config', label: '参数配置', icon: Settings },
  { path: '/logs', label: '日志管理', icon: FileText }
]

const currentPageTitle = computed(() => {
  const item = navItems.find(n => n.path === route.path)
  return item?.label || 'DeviceControl'
})

const toggleTheme = () => {
  isDark.value = !isDark.value
}

onMounted(() => {
  logStore.addInfoLog('应用已启动')
  
  setTimeout(() => {
    isConnected.value = true
    logStore.addInfoLog('WebSocket连接成功')
  }, 1000)
})
</script>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--surface-light);
  border-radius: var(--radius-md);
}
</style>
