"use client"

import type React from "react"

import type { ReactNode } from "react"

interface DraggableComponentProps {
  type: string
  name: string
  description: string
  icon: ReactNode
  onDragStart: (event: React.DragEvent, nodeType: string, nodeName: string) => void
  color: string
}

export function DraggableComponent({ type, name, description, icon, onDragStart, color }: DraggableComponentProps) {
  return (
    <div
      className="flex items-center p-3 rounded-lg border border-[#D9E4DD] bg-white shadow-sm cursor-move transition-all hover:shadow-md"
      onDragStart={(event) => onDragStart(event, type, name)}
      draggable
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-[#5C6E91]">{name}</h3>
        <p className="text-xs text-[#7A8CA3]">{description}</p>
      </div>
    </div>
  )
}
