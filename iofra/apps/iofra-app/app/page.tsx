"use client"
import { ReactFlowProvider } from "reactflow"
import "reactflow/dist/style.css"

import { SidebarProvider } from "@/components/ui/sidebar"
import { WorkflowCanvas } from "@/components/workflow-canvas"

export default function WorkflowDesigner() {
  return (
    <SidebarProvider>
      <div className="h-screen w-full bg-[#f5f3eb] overflow-hidden flex">
        <ReactFlowProvider>
          <WorkflowCanvas />
        </ReactFlowProvider>
      </div>
    </SidebarProvider>
  )
}
