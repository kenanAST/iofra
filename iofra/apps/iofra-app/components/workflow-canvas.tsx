"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
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
import { useDevices, type DeviceNode as DeviceNodeType } from "@/hooks/useDevices"

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
  const { deviceNodes, loading, error, noDevicesAvailable, refreshDevices } = useDevices()
  const initializedRef = useRef(false)
  
  // Set initial nodes when device data is loaded
  useEffect(() => {
    // Only add device nodes from API when we don't have any nodes yet
    // This prevents wiping out user-added nodes
    if (deviceNodes.length > 0 && nodes.length === 0) {
      setNodes(deviceNodes);
      initializedRef.current = true;
    }
    
    // Update existing device nodes with fresh data
    if (deviceNodes.length > 0 && nodes.length > 0 && initializedRef.current) {
      setNodes(prevNodes => {
        const nodeMap = new Map(prevNodes.map(node => [node.id, node]));
        
        // Update positions of existing device nodes
        const updatedDeviceNodes = deviceNodes.map(deviceNode => {
          const existingNode = nodeMap.get(deviceNode.id);
          if (existingNode && existingNode.type === 'device') {
            // Keep the position of existing nodes, but update the data
            return {
              ...deviceNode,
              position: existingNode.position,
            };
          }
          return deviceNode;
        });
        
        // Filter out device nodes that already exist
        const newDeviceNodes = updatedDeviceNodes.filter(
          deviceNode => !nodeMap.has(deviceNode.id)
        );
        
        // Get non-device nodes
        const nonDeviceNodes = prevNodes.filter(
          node => node.type !== 'device' || !deviceNodes.some(dn => dn.id === node.id)
        );
        
        // Combine all nodes
        return [...nonDeviceNodes, ...newDeviceNodes];
      });
    }
  }, [deviceNodes, setNodes]);

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
                reactFlowInstance,
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
              data: {
                reactFlowInstance,
              },
            },
            eds,
          ),
        );
      }
    },
    [nodes, setEdges, reactFlowInstance],
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

        // Only create new nodes for non-device types
        // Devices should come from the API
        if (type !== 'device') {
          const newNode = {
            id: `${type}-${Date.now()}`,
            type,
            position,
            data: { label: name, properties: getDefaultProperties(type) },
          }

          setNodes((nds) => nds.concat(newNode))
        }
      }
    },
    [reactFlowInstance, setNodes],
  )

  const getDefaultProperties = (type: string) => {
    switch (type) {
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
  
  // Show loading or error states
  if (loading && nodes.length === 0) {
    return (
      <div className="flex h-full w-full">
        <ComponentsSidebar />
        <div className="flex-1 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C3E8BD] mx-auto"></div>
            <p className="mt-2 text-[#5C6E91]">Loading devices...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (error && nodes.length === 0) {
    return (
      <div className="flex h-full w-full">
        <ComponentsSidebar />
        <div className="flex-1 h-full flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8 bg-white/80 rounded-lg border border-red-200 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-lg font-medium text-red-600">{error}</p>
            <p className="text-sm text-gray-600 mt-2 mb-4">The application couldn't connect to the orchestration platform. Please check the backend service status.</p>
            <button 
              onClick={() => refreshDevices()}
              className="px-4 py-2 bg-[#5C6E91] text-white rounded-md hover:bg-[#4A5A78] transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // For the no devices available message, we want to keep the UI consistent
  // but show a message in the canvas area
  return (
    <div className="flex h-full w-full">
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
          connectionLineComponent={CustomConnectionLine}
          defaultEdgeOptions={{ type: 'custom' }}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
        </ReactFlow>
      </div>
      {/* Properties Panel should be outside the ReactFlow container */}
      {selectedNode && (
        <PropertiesPanel
          selectedNode={selectedNode}
          updateNodeProperties={updateEdgesWithSensorData}
          nodes={nodes}
        />
      )}
    </div>
  )
}
