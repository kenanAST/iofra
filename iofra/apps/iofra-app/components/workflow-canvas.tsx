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
  type OnEdgesChange,
  applyEdgeChanges,
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
import { DebugNode } from "@/components/nodes/debug-node"
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
  debug: DebugNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, _] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { deviceNodes, loading, error, noDevicesAvailable, refreshDevices } = useDevices()
  const initializedRef = useRef(false)
  const prevDeviceNodesRef = useRef<DeviceNodeType[]>([])
  
  // Set initial nodes when device data is loaded
  useEffect(() => {
    // We no longer want to automatically add device nodes to the canvas
    // They should only appear when dragged from the sidebar
    
    // Update existing device nodes with fresh data if they're already on the canvas
    if (deviceNodes.length > 0 && initializedRef.current) {
      setNodes(prevNodes => {
        // Don't update if there are no device nodes on the canvas
        const existingDeviceNodes = prevNodes.filter(node => node.type === 'device');
        if (existingDeviceNodes.length === 0) return prevNodes;
        
        // Get only the device nodes that are already on the canvas
        const existingDeviceNodeIds = existingDeviceNodes.map(node => node.id);
        
        // Check if any device node data has actually changed
        const hasChanges = existingDeviceNodeIds.some(id => {
          const oldDeviceNode = prevDeviceNodesRef.current.find(dn => dn.id === id);
          const newDeviceNode = deviceNodes.find(dn => dn.id === id);
          return !oldDeviceNode || JSON.stringify(oldDeviceNode.data) !== JSON.stringify(newDeviceNode?.data);
        });
        
        if (!hasChanges) return prevNodes;
        
        // Update only existing device nodes with fresh data
        return prevNodes.map(node => {
          if (node.type === 'device' && existingDeviceNodeIds.includes(node.id)) {
            const freshDeviceNode = deviceNodes.find(dn => dn.id === node.id);
            if (freshDeviceNode) {
              return {
                ...node,
                data: {
                  ...freshDeviceNode.data,
                  label: freshDeviceNode.data.label,
                  properties: freshDeviceNode.data.properties,
                },
                position: node.position, // Keep position
              };
            }
          }
          return node;
        });
      });
    }
    
    // Initialize the ref so we know we've processed initial data
    if (deviceNodes.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
    }
    
    // Update our ref with the latest device nodes
    prevDeviceNodesRef.current = deviceNodes;
  }, [deviceNodes, setNodes]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // Get the source and target nodes
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      // Prevent multiple incoming connections to Trigger and Debug nodes
      if (targetNode && (targetNode.type === 'trigger' || targetNode.type === 'debug')) {
        const existingIncomingEdge = edges.some(edge => edge.target === connection.target);
        if (existingIncomingEdge) {
          // Allow connection from a device to a trigger node even if it has an incoming trigger-to-trigger connection
          // This is for the initial setup where a trigger might be connected to another trigger, then to a device.
          // However, once a device is connected, no other inputs (even from other triggers) should be allowed.
          if (targetNode.type === 'trigger' && sourceNode?.type === 'device') {
            // Check if the existing incoming connection is NOT from a device
            const existingEdge = edges.find(edge => edge.target === connection.target);
            const existingSourceNode = nodes.find(node => node.id === existingEdge?.source);
            if (existingSourceNode && existingSourceNode.type !== 'device') {
              // If existing connection is not from a device, allow this new device connection
              // but we might want to remove the old non-device connection or handle it.
              // For now, let's proceed, but this logic might need refinement for specific scenarios.
            } else {
              return; // Already has an incoming connection (likely from a device or another configured source)
            }
          } else {
            return; // Target already has an incoming connection
          }
        }
      }

      // Check if this is a connection from a sensor handle
      if (connection.sourceHandle && connection.sourceHandle.startsWith('sensor-')) {
        const sensorId = connection.sourceHandle.replace('sensor-', '');
        const targetNode = nodes.find((node) => node.id === connection.target);
        
        // If the target is a trigger node
        if (sourceNode?.type === 'device' && targetNode?.type === 'trigger') {
          // Find the sensor data from the source node
          const sensor = sourceNode.data.properties.sensors.find(
            (s: any) => s.id === sensorId
          );
          
          // Update the trigger node properties to automatically set the sensor
          if (sensor) {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === targetNode.id) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      properties: {
                        ...node.data.properties,
                        sourceDevice: sourceNode.id,
                        sourceSensor: sensorId,
                      },
                    },
                  };
                }
                return node;
              })
            );
            
            // Create edge with sensor info
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
                    sensorName: `${sensor.name} (${sensor.sensorType})`,
                    reactFlowInstance,
                  },
                },
                eds,
              ),
            );
            
            // We've handled this connection specially, so return early
            return;
          }
        } else {
          // For other connections from sensors
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
          
          // We've handled this connection, so return early
          return;
        }
      }
      // Special handling for connecting devices to trigger nodes without specific sensor handles
      else if (sourceNode?.type === 'device' && targetNode?.type === 'trigger' && !connection.sourceHandle) {
        // If we're connecting from a device to a trigger without a specific sensor handle,
        // let's pick the first available sensor and auto-configure
        const deviceSensors = sourceNode.data.properties?.sensors || [];
        
        // Try to find a temperature sensor first, as it's most commonly used with triggers
        let sensorToUse: any = deviceSensors.find((s: any) => 
          s.sensorType?.toLowerCase() === 'temperature'
        );
        
        // If no temperature sensor, use the first available one
        if (!sensorToUse && deviceSensors.length > 0) {
          sensorToUse = deviceSensors[0];
        }
        
        if (sensorToUse) {
          // Update the trigger node properties to automatically set the sensor
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === targetNode.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    properties: {
                      ...node.data.properties,
                      sourceDevice: sourceNode.id,
                      sourceSensor: sensorToUse.id,
                    },
                  },
                };
              }
              return node;
            })
          );
          
          // Create edge with sensor info
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
                  sensorName: `${sensorToUse.name} (${sensorToUse.sensorType})`,
                  reactFlowInstance,
                },
              },
              eds,
            ),
          );
          
          // We've handled this connection specially, so return early
          return;
        }
      }
      // Check if this connection is from an actuator handle
      else if (connection.sourceHandle && connection.sourceHandle.startsWith('actuator-')) {
        const actuatorId = connection.sourceHandle.replace('actuator-', '');
        const targetNode = nodes.find((node) => node.id === connection.target);
        
        if (sourceNode?.type === 'device') {
          // Find the actuator data
          const actuator = sourceNode.data.properties.actuators.find(
            (a: any) => a.id === actuatorId
          );
          
          // Create edge with actuator info
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
                  actuatorName: actuator ? `${actuator.name} (${actuator.actuatorType})` : "",
                  reactFlowInstance,
                },
              },
              eds,
            ),
          );
        }
      }
      // Original code for other connections
      else if (sourceNode?.type === 'device' && connection.target) {
        const targetNode = nodes.find((node) => node.id === connection.target);
        
        if (targetNode?.type === 'trigger') {
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
        }
      }
      // Check if this connection is from a trigger node (source)
      else if (sourceNode?.type === 'trigger') {
        // Check if this trigger already has an outgoing connection
        const existingConnection = edges.some(edge => edge.source === connection.source);
        
        // If there's already a connection, don't add another one
        if (existingConnection) {
          return;
        }
        
        // Create edge for trigger-to-trigger or trigger-to-any connections
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'custom',
              animated: true,
              style: { stroke: "#FECDA6", strokeWidth: 2 },
              data: {
                sourceNode,
                targetNode,
                triggerConnection: true,
                reactFlowInstance,
                // Include the current value for debug nodes to consume
                triggerValue: sourceNode.data.currentValue,
                isTriggered: sourceNode.data.isTriggered
              },
            },
            eds,
          ),
        );
        
        // Signal reconnection to the target
        setNodes(nds => 
          nds.map(node => {
            if (node.id === connection.target) {
              return {
                ...node,
                data: {
                  ...node.data,
                  reconnected: Date.now()
                }
              };
            }
            return node;
          })
        );
        
        return;
      }
      // For any other connections
      else {
        // Check if this is a debug-to-debug connection
        if (sourceNode?.type === 'debug' && connection.target) {
          const targetNode = nodes.find((node) => node.id === connection.target);
          
          // If connecting to another debug node, create a specific edge for debug pipelines
          if (targetNode?.type === 'debug') {
            setEdges((eds) =>
              addEdge(
                {
                  ...connection,
                  type: 'custom',
                  animated: true,
                  style: { stroke: "#86C5D8", strokeWidth: 2 },
                  data: {
                    sourceNode,
                    targetNode,
                    debugConnection: true,
                    reactFlowInstance,
                  },
                },
                eds,
              ),
            );
            
            // Update the target debug node to know about this connection
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === targetNode.id) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      connectedDebug: sourceNode.id,
                      forceConnectionUpdate: Date.now(), // Force immediate update
                      // Also set the checkSourceDebug flag to trigger immediate data flow
                      checkSourceDebug: Date.now(),
                      properties: {
                        ...node.data.properties,
                        connectedDebug: sourceNode.id,
                      }
                    },
                  };
                }
                return node;
              }),
            );
            
            return; // Early return after handling debug-to-debug connection
          }
        }
        
        // Default handling for other connections
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'custom',
              animated: true,
              data: {
                reactFlowInstance,
              },
            },
            eds,
          ),
        );
      }

      // After creating the connection, notify the target node
      if (connection.target) {
        // Signal to the target node that it has been reconnected
        setNodes(nds => 
          nds.map(node => {
            if (node.id === connection.target) {
              return {
                ...node,
                data: {
                  ...node.data,
                  reconnected: Date.now() // Signal reconnection with timestamp
                }
              };
            }
            return node;
          })
        );
      }
    },
    [nodes, setEdges, edges, reactFlowInstance],
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

        // Handle dropping device from sidebar
        if (type === 'device') {
          const deviceId = event.dataTransfer.getData("application/deviceId")
          const existingDevice = deviceNodes.find(node => node.id === deviceId)
          
          if (existingDevice) {
            // Create a new node based on the existing device data
            // but at the drop position
            const newDeviceNode = {
              ...existingDevice,
              position,
            }
            
            // Check if this device is already on the canvas
            const deviceExists = nodes.some(node => node.id === deviceId)
            
            if (!deviceExists) {
              setNodes((nds) => nds.concat(newDeviceNode))
            }
          }
        } else {
          // For non-device component types
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
    [reactFlowInstance, setNodes, deviceNodes, nodes],
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
      case "debug":
        return { 
          logLevel: "info", 
          capturePayload: true, 
          maxEntries: 5
        }
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
  
  // Custom edge change handler to handle removals specially
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    // Before applying edge changes, check if any of them are removals
    const edgeRemovals = changes.filter(change => change.type === 'remove');
    
    if (edgeRemovals.length > 0) {
      // For each edge removal, check if we need to update the target node to reset values
      edgeRemovals.forEach(removal => {
        if ('id' in removal) {
          // Find the edge being removed
          const edgeId = removal.id;
          const edge = edges.find(e => e.id === edgeId);
          
          if (edge) {
            const targetId = edge.target;
            const targetNode = nodes.find(node => node.id === targetId);
            
            // If target is a trigger or debug node, reset its values
            if (targetNode && (targetNode.type === 'trigger' || targetNode.type === 'debug')) {
              // Signal to the node that it should reset values
              setNodes(nds => 
                nds.map(node => {
                  if (node.id === targetId) {
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        inputRemoved: Date.now() // Timestamp to trigger reset
                      }
                    };
                  }
                  return node;
                })
              );
            }
          }
        }
      });
    }
    
    // Apply the changes normally
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [nodes, edges, setNodes, setEdges]);

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

