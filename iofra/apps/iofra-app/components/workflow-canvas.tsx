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
  type NodeTypes,
  type Node,
  Position,
  type EdgeTypes,
  Edge,
} from "reactflow"
import "reactflow/dist/style.css"

import { ComponentsSidebar } from "@/components/components-sidebar"
import { PropertiesPanel } from "@/components/properties-panel"
import { TriggerNode } from "@/components/nodes/trigger-node"
import { ResponseNode } from "@/components/nodes/response-node"
import { EncryptNode } from "@/components/nodes/encrypt-node"
import { MtlsNode } from "@/components/nodes/mtls-node"
import { OtaNode } from "@/components/nodes/ota-node"
import { DeviceNode } from "@/components/nodes/device-node"
import { CustomEdge } from "@/components/custom-edge"
import { CustomConnectionLine } from "@/components/custom-connection-line" 

const nodeTypes: NodeTypes = {
  device: DeviceNode,
  trigger: TriggerNode,
  response: ResponseNode,
  encrypt: EncryptNode,
  mtls: MtlsNode,
  ota: OtaNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // Get the source and target nodes
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      
      // If the source node is a device and the target is a trigger, let's check if the trigger
      // has a sensor specified
      if (sourceNode?.type === 'device' && targetNode?.type === 'trigger') {
        const triggerProperties = targetNode.data.properties;
        
        // If sourceSensor is specified, find the sensor name
        let sensorName = "";
        if (triggerProperties.sourceSensor) {
          const sensor = sourceNode.data.properties.sensors.find(
            (s: any) => s.id === triggerProperties.sourceSensor
          );
          sensorName = sensor ? `${sensor.name} (${sensor.sensorType})` : "";
        }
        
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'custom',
              animated: true,
              style: { stroke: "#86A8E7", strokeWidth: 2 },
              data: {
                sourceNode,
                targetNode,
                sensorName,
              },
            },
            eds,
          ),
        );
      } else {
        // For other connections
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'custom',
              animated: true,
              style: { stroke: "#86A8E7", strokeWidth: 2 },
            },
            eds,
          ),
        );
      }
    },
    [nodes, setEdges],
  );

  // Function to update edges when a trigger's source sensor changes
  const updateEdgesWithSensorData = useCallback((nodeId: string, properties: any) => {
    // If this is a trigger node and the sourceSensor has changed
    if (properties.sourceSensor) {
      const triggerNode = nodes.find((node) => node.id === nodeId);
      
      if (triggerNode?.type === 'trigger') {
        const sourceDeviceId = properties.sourceDevice;
        const sourceDevice = nodes.find((node) => node.id === sourceDeviceId);
        
        if (sourceDevice) {
          const sensor = sourceDevice.data.properties.sensors.find(
            (s: any) => s.id === properties.sourceSensor
          );
          
          const sensorName = sensor ? `${sensor.name} (${sensor.sensorType})` : "";
          
          // Update all edges that have this trigger as target
          setEdges((eds) =>
            eds.map((edge) => {
              if (edge.target === nodeId && edge.source === sourceDeviceId) {
                return {
                  ...edge,
                  data: {
                    ...edge.data,
                    sensorName,
                  },
                };
              }
              return edge;
            }),
          );
        }
      }
    }
    
    // First, update the node's properties
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
    );
  }, [nodes, setNodes, setEdges]);

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
        return { 
          status: "online", 
          ipAddress: "192.168.1.1", 
          location: "Office",
          sensors: [
            { 
              id: `sensor-${Date.now()}`, 
              name: "Temperature Sensor", 
              sensorType: "temperature", 
              interval: 5, 
              unit: "celsius" 
            }
          ],
          actuators: [
            { 
              id: `actuator-${Date.now()}`, 
              name: "Smart Switch", 
              actuatorType: "switch", 
              state: "off", 
              protocol: "mqtt" 
            }
          ]
        }
      case "trigger":
        return { 
          sourceDevice: "", 
          sourceSensor: "", 
          condition: ">", 
          threshold: 30, 
          topic: "iot/alerts" 
        }
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
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'custom' }}
          connectionLineComponent={CustomConnectionLine}
          fitView
          deleteKeyCode="Delete"
          selectionKeyCode="Shift"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#D9E4DD" />
          <Controls className="bg-white/80 rounded-lg border border-[#D9E4DD]" />
          <div className="absolute top-0 left-0 right-0 flex justify-center w-full z-10 p-2">
            <div className="bg-white/80 px-4 py-2 rounded-lg border border-[#D9E4DD] shadow-sm">
              <h1 className="text-xl font-medium text-[#5C6E91]">Iofra Workflow Designer</h1>
            </div>
          </div>
        </ReactFlow>
      </div>
      <PropertiesPanel 
        selectedNode={selectedNode} 
        updateNodeProperties={updateEdgesWithSensorData} 
        nodes={nodes}
      />
    </>
  )
}
