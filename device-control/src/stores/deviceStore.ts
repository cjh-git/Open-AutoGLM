import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Device, DeviceGroup } from '@/types'

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<Device[]>([
    {
      id: '1',
      name: 'iPhone 15 Pro',
      model: 'iPhone 15 Pro',
      os: 'ios',
      status: 'online',
      connectedAt: Date.now() - 3600000,
      ip: '192.168.1.101',
      port: 5555,
      groupId: 'group1'
    },
    {
      id: '2',
      name: 'Xiaomi 14',
      model: 'Xiaomi 14',
      os: 'android',
      status: 'online',
      connectedAt: Date.now() - 7200000,
      ip: '192.168.1.102',
      port: 5555,
      groupId: 'group1'
    },
    {
      id: '3',
      name: 'Mate 60 Pro',
      model: 'Mate 60 Pro',
      os: 'harmonyos',
      status: 'offline',
      ip: '192.168.1.103',
      port: 5555
    },
    {
      id: '4',
      name: 'iPad Pro 12.9',
      model: 'iPad Pro 12.9',
      os: 'ios',
      status: 'online',
      connectedAt: Date.now() - 1800000,
      ip: '192.168.1.104',
      port: 5555,
      groupId: 'group2'
    },
    {
      id: '5',
      name: 'Samsung S24 Ultra',
      model: 'Samsung Galaxy S24 Ultra',
      os: 'android',
      status: 'offline',
      ip: '192.168.1.105',
      port: 5555
    }
  ])

  const groups = ref<DeviceGroup[]>([
    {
      id: 'group1',
      name: '测试设备',
      color: '#2563EB',
      deviceIds: ['1', '2']
    },
    {
      id: 'group2',
      name: '开发设备',
      color: '#10B981',
      deviceIds: ['4']
    }
  ])

  const selectedDeviceId = ref<string | undefined>('1')
  const isRefreshing = ref(false)
  const lastRefreshTime = ref<number>(Date.now())

  const onlineDevices = computed(() => devices.value.filter(d => d.status === 'online'))
  const offlineDevices = computed(() => devices.value.filter(d => d.status === 'offline'))
  
  const selectedDevice = computed(() => 
    devices.value.find(d => d.id === selectedDeviceId.value)
  )

  const getDevicesByGroup = (groupId: string) => {
    return devices.value.filter(d => d.groupId === groupId)
  }

  const getGroupById = (groupId: string) => {
    return groups.value.find(g => g.id === groupId)
  }

  const selectDevice = (deviceId: string) => {
    selectedDeviceId.value = deviceId
  }

  const updateDeviceStatus = (deviceId: string, status: Device['status']) => {
    const device = devices.value.find(d => d.id === deviceId)
    if (device) {
      device.status = status
      if (status === 'online') {
        device.connectedAt = Date.now()
      }
    }
  }

  const updateDeviceName = (deviceId: string, name: string) => {
    const device = devices.value.find(d => d.id === deviceId)
    if (device) {
      device.name = name
    }
  }

  const addDevice = (device: Omit<Device, 'id'>) => {
    const id = Date.now().toString()
    devices.value.push({ ...device, id })
    return id
  }

  const removeDevice = (deviceId: string) => {
    const index = devices.value.findIndex(d => d.id === deviceId)
    if (index !== -1) {
      devices.value.splice(index, 1)
    }
  }

  const addGroup = (group: Omit<DeviceGroup, 'id'>) => {
    const id = 'group' + Date.now()
    groups.value.push({ ...group, id })
    return id
  }

  const removeGroup = (groupId: string) => {
    const index = groups.value.findIndex(g => g.id === groupId)
    if (index !== -1) {
      groups.value.splice(index, 1)
    }
  }

  const moveDeviceToGroup = (deviceId: string, groupId: string | undefined) => {
    const device = devices.value.find(d => d.id === deviceId)
    if (device) {
      device.groupId = groupId
    }
  }

  const refreshDevices = async () => {
    isRefreshing.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastRefreshTime.value = Date.now()
    isRefreshing.value = false
  }

  return {
    devices,
    groups,
    selectedDeviceId,
    isRefreshing,
    lastRefreshTime,
    onlineDevices,
    offlineDevices,
    selectedDevice,
    getDevicesByGroup,
    getGroupById,
    selectDevice,
    updateDeviceStatus,
    updateDeviceName,
    addDevice,
    removeDevice,
    addGroup,
    removeGroup,
    moveDeviceToGroup,
    refreshDevices
  }
})
