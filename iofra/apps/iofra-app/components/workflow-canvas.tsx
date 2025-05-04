"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  type Connection,
  type OnConnect,
  Background,
  BackgroundVariant,
  Panel,
  type NodeTypes,
  type Node,
  Position,
} from "reactflow"
import "reactflow/dist/style.css"

import { ComponentsSidebar } from "@/components/components-sidebar"
import { PropertiesPanel } from "@/components/properties-panel"
import { SensorNode } from "@/components/nodes/sensor-node"
import { TriggerNode } from "@/components/nodes/trigger-node"
import { ResponseNode } from "@/components/nodes/response-node"
import { EncryptNode } from "@/components/nodes/encrypt-node"
import { MtlsNode } from "@/components/nodes/mtls-node"
import { OtaNode } from "@/components/nodes/ota-node"
import { DeviceNode } from "@/components/nodes/device-node"
import { ActuatorNode } from "@/components/nodes/actuator-node"

const nodeTypes: NodeTypes = {
  device: DeviceNode,
  sensor: SensorNode,
  actuator: ActuatorNode,
  trigger: TriggerNode,
  response: ResponseNode,
  encrypt: EncryptNode,
  mtls: MtlsNode,
  ota: OtaNode,
}

export function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#86A8E7", strokeWidth: 2 },
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (reactFlowWrapper.current && reactFlowInstance) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
        const type = event.dataTransfer.getData("application/reactflow")
        const name = event.dataTransfer.getData("application/nodeName")

        if (typeof type === "undefined" || !type) {
          return
        }

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        const newNode = {
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: { label: name, properties: getDefaultProperties(type) },
        }

        setNodes((nds) => nds.concat(newNode))
      }
    },
    [reactFlowInstance, setNodes],
  )

  const getDefaultProperties = (type: string) => {
    switch (type) {
      case "device":
        return { status: "online", ipAddress: "192.168.1.1", components: [] }
      case "sensor":
        return { sensorType: "temperature", interval: 5, unit: "celsius" }
      case "actuator":
        return { actuatorType: "switch", state: "off", protocol: "mqtt" }
      case "trigger":
        return { condition: ">", threshold: 30, topic: "iot/alerts" }
      case "response":
        return { action: "notification", recipient: "admin", message: "Alert triggered" }
      case "encrypt":
        return { algorithm: "AES-256", keyRotation: 30 }
      case "mtls":
        return { certAuthority: "Let's Encrypt", validityPeriod: 365 }
      case "ota":
        return { version: "1.0.0", rollbackEnabled: true, deltaUpdates: true }
      default:
        return {}
    }
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const updateNodeProperties = useCallback(
    (nodeId: string, properties: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                properties: properties,
              },
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  // Custom edge style
  const edgeOptions = {
    animated: true,
    style: {
      stroke: "#86A8E7",
      strokeWidth: 2,
    },
  }

  return (
    <>
      <ComponentsSidebar />
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={edgeOptions}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#D9E4DD" />
          <Controls className="bg-white/80 rounded-lg border border-[#D9E4DD]" />
          <Panel position={Position.Top} className="flex justify-center w-full">
            <div className="bg-white/80 px-4 py-2 rounded-lg border border-[#D9E4DD] shadow-sm">
              <h1 className="text-xl font-medium text-[#5C6E91]">Iofra Workflow Designer</h1>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      <PropertiesPanel selectedNode={selectedNode} updateNodeProperties={updateNodeProperties} />
    </>
  )
}
