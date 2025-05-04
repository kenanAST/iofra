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

export function ComponentsSidebar() {
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
            <DraggableComponent
              type="device"
              name="Device"
              description="IoT device that can contain sensors and actuators"
              icon={<HardDrive className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#C3E8BD"
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-1 text-[#5C6E91]">Input Components</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <DraggableComponent
              type="sensor"
              name="Sensor"
              description="Collects data from IoT devices"
              icon={<Thermometer className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#A6D1E6"
            />
            <DraggableComponent
              type="actuator"
              name="Actuator"
              description="Controls physical mechanisms or systems"
              icon={<ToggleRight className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#FFA6A6"
            />
            <DraggableComponent
              type="trigger"
              name="Trigger"
              description="Initiates actions based on conditions"
              icon={<Bell className="h-5 w-5" />}
              onDragStart={onDragStart}
              color="#FECDA6"
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-1 text-[#5C6E91]">Processing Components</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
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
