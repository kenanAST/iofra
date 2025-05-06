"use client"

import type React from "react"

import { useCallback } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { DraggableComponent } from "./draggable-component"
import { Thermometer, Bell, MessageSquare, Lock, Shield, Download, HardDrive, ToggleRight } from "lucide-react"
import { useDevices } from "@/hooks/useDevices"

export function ComponentsSidebar() {
  const { devices, noDevicesAvailable, refreshDevices } = useDevices()

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, nodeName: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.setData("application/nodeName", nodeName)
    event.dataTransfer.effectAllowed = "move"
  }, [])

  return (
    <Sidebar className="w-64 border-r border-[#D9E4DD] bg-[#f8f6f0]">
      <SidebarHeader className="p-4 border-b border-[#D9E4DD]">
        <h2 className="text-lg font-medium text-[#5C6E91]">Secure Components</h2>
        <p className="text-sm text-[#7A8CA3]">Drag components to the canvas</p>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-1 text-[#5C6E91]">Devices</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            {noDevicesAvailable ? (
              <div className="p-2 rounded border border-[#D9E4DD] bg-white/70">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f0f8f0] flex items-center justify-center mx-auto mb-2 border-2 border-[#C3E8BD]">
                    <HardDrive className="h-6 w-6 text-[#5C6E91]" />
                  </div>
                  <p className="text-sm font-medium text-[#5C6E91]">No Devices Available</p>
                  <p className="text-xs text-[#7A8CA3] mt-1 mb-3">Waiting for devices to connect</p>
                  <button 
                    onClick={() => refreshDevices()}
                    className="px-3 py-1.5 bg-[#C3E8BD] text-[#5C6E91] rounded-md hover:bg-[#A3D89D] transition-colors text-xs flex items-center mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M8 16H3v5" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="p-3 rounded-lg border border-[#D9E4DD] bg-white shadow-sm cursor-move transition-all hover:shadow-md"
                    onDragStart={(event) => {
                      event.dataTransfer.setData("application/reactflow", "device")
                      event.dataTransfer.setData("application/nodeName", device.name)
                      event.dataTransfer.setData("application/deviceId", device.deviceId)
                      event.dataTransfer.effectAllowed = "move"
                    }}
                    draggable
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C3E8BD] flex items-center justify-center mr-3">
                        <HardDrive className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-[#5C6E91]">{device.name}</h3>
                          <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                            device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                        </div>
                        <p className="text-xs text-[#7A8CA3]">{device.ipAddress || 'No IP'} • {device.location || 'Unknown location'}</p>
                        {device.sensors && device.sensors.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {device.sensors.map((sensor, idx) => (
                              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
                                <Thermometer className="h-3 w-3 mr-1" />
                                {sensor.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => refreshDevices()}
                  className="w-full px-3 py-1.5 bg-[#f0f8f0] text-[#5C6E91] rounded-md hover:bg-[#C3E8BD] transition-colors text-xs flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  Refresh Devices
                </button>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-1 text-[#5C6E91]">Processing Components</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <DraggableComponent
              type="trigger"
              name="Trigger"
              description="Initiates actions based on conditions"
              icon={<Bell className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#FECDA6"
            />
            <DraggableComponent
              type="encrypt"
              name="Encrypt"
              description="Secures data with encryption"
              icon={<Lock className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#D8BFD8"
            />
            <DraggableComponent
              type="mtls"
              name="mTLS"
              description="Mutual TLS authentication"
              icon={<Shield className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#ABDEE6"
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-1 text-[#5C6E91]">Output Components</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <DraggableComponent
              type="response"
              name="Response"
              description="Handles the system's reaction"
              icon={<MessageSquare className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#CBAACB"
            />
            <DraggableComponent
              type="ota"
              name="OTA Update"
              description="Over-the-air firmware updates"
              icon={<Download className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#F3B0C3"
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
