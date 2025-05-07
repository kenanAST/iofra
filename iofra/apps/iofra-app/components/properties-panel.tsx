"use client"

import { useState, useEffect } from "react"
import type { Node } from "reactflow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { X, Info, Activity, AlertCircle } from "lucide-react"
import { Thermometer, ToggleRight } from "lucide-react"
import { TelemetryGraph } from "@/components/telemetry-graph"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"

// Helper function to validate email addresses
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

interface PropertiesPanelProps {
  selectedNode: Node | null
  updateNodeProperties: (nodeId: string, properties: any) => void
  nodes: Node[]
}

export function PropertiesPanel({ selectedNode, updateNodeProperties, nodes }: PropertiesPanelProps) {
  const [properties, setProperties] = useState<any>({})

  useEffect(() => {
    if (selectedNode) {
      setProperties(selectedNode.data.properties || {})
    } else {
      setProperties({})
    }
  }, [selectedNode])

  const handlePropertyChange = (key: string, value: any) => {
    const updatedProperties = { ...properties, [key]: value }
    setProperties(updatedProperties)

    if (selectedNode) {
      updateNodeProperties(selectedNode.id, updatedProperties)
    }
  }

  if (!selectedNode) {
    return (
      <div className="w-64 border-l border-[#D9E4DD] bg-[#f8f6f0] p-4">
        <h2 className="text-lg font-medium text-[#5C6E91]">Block Properties</h2>
        <p className="text-sm text-[#7A8CA3] mt-2">Select a block to view and edit its properties</p>
        <div className="mt-8 flex justify-center">
          <img src="/placeholder.svg?key=116m6" alt="Select a component" className="opacity-50" />
        </div>
      </div>
    )
  }

  const renderProperties = () => {
    if (!selectedNode) return null

    switch (selectedNode.type) {
      case "device":
        return (
          <>
            {/* Device Info Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-[#5C6E91]">Device Information</h3>
                <Badge variant={properties.status === "online" ? "default" : "destructive"} 
                       className={properties.status === "online" ? "bg-green-500" : ""}>
                  {properties.status || "unknown"}
                </Badge>
              </div>
              
              <div className="bg-white rounded p-3 border border-[#D9E4DD] text-xs">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-[#7A8CA3]">ID:</span>
                  <span className="font-medium text-[#5C6E91]">{selectedNode.id}</span>
                </div>
              </div>

              <Separator className="my-4" />
              
              {/* Sensors with Live Graphs */}
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-[#5C6E91]">
                    Sensor Telemetry
                    <span className="ml-1 text-xs text-[#7A8CA3]">
                      ({(properties.sensors || []).length})
                    </span>
                  </h3>
                  
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-[#A6D1E6]" />
                    <span className="text-xs text-[#7A8CA3]">Live Data</span>
                  </div>
                </div>
                
                <div className="space-y-4 mt-2">
                  {(properties.sensors || []).length === 0 ? (
                    <div className="bg-white rounded p-3 border border-[#D9E4DD] text-xs text-center">
                      <p className="text-[#7A8CA3]">No sensors available for this device</p>
                    </div>
                  ) : (
                    (properties.sensors || []).map((sensor: any) => (
                      <div key={sensor.id} className="bg-white rounded p-3 border border-[#D9E4DD]">
                        <TelemetryGraph 
                          deviceId={selectedNode.id} 
                          sensorType={sensor.sensorType}
                          sensorName={`${sensor.name} (${sensor.sensorType})`}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Actuators Section */}
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-[#5C6E91]">
                    Actuators
                    <span className="ml-1 text-xs text-[#7A8CA3]">
                      ({(properties.actuators || []).length})
                    </span>
                  </h3>
                </div>
                
                <div className="space-y-3 mt-2">
                  {(properties.actuators || []).length === 0 ? (
                    <div className="bg-white rounded p-3 border border-[#D9E4DD] text-xs text-center">
                      <p className="text-[#7A8CA3]">No actuators available for this device</p>
                    </div>
                  ) : (
                    (properties.actuators || []).map((actuator: any, index: number) => (
                      <div key={actuator.id} className="bg-white rounded p-3 border border-[#D9E4DD]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full bg-[#FFA6A6] flex items-center justify-center mr-1">
                              <ToggleRight className="h-2 w-2 text-white" />
                            </div>
                            <span className="text-xs font-medium text-[#5C6E91]">
                              {actuator.name} ({actuator.actuatorType})
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-[#7A8CA3]">Current State:</span>
                          <Badge variant={actuator.state === "on" ? "default" : "outline"}
                                 className={actuator.state === "on" ? "bg-green-500" : ""}>
                            {actuator.state || "off"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )
        
      case "actuator":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actuatorType">Actuator Type</Label>
                <Select
                  value={properties.actuatorType}
                  onValueChange={(value) => handlePropertyChange("actuatorType", value)}
                >
                  <SelectTrigger id="actuatorType">
                    <SelectValue placeholder="Select actuator type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="relay">Relay</SelectItem>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="servo">Servo</SelectItem>
                    <SelectItem value="valve">Valve</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={properties.state}
                  onValueChange={(value) => handlePropertyChange("state", value)}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="protocol">Protocol</Label>
                <Select
                  value={properties.protocol}
                  onValueChange={(value) => handlePropertyChange("protocol", value)}
                >
                  <SelectTrigger id="protocol">
                    <SelectValue placeholder="Select protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="coap">CoAP</SelectItem>
                    <SelectItem value="modbus">Modbus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )
      
      case "sensor":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sensorType">Sensor Type</Label>
                <Select
                  value={properties.sensorType}
                  onValueChange={(value) => handlePropertyChange("sensorType", value)}
                >
                  <SelectTrigger id="sensorType">
                    <SelectValue placeholder="Select sensor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="humidity">Humidity</SelectItem>
                    <SelectItem value="motion">Motion</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="pressure">Pressure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Reading Interval (seconds)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="interval"
                    min={1}
                    max={60}
                    step={1}
                    value={[properties.interval || 5]}
                    onValueChange={(value) => handlePropertyChange("interval", value[0])}
                  />
                  <span className="w-12 text-center">{properties.interval || 5}s</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={properties.unit} onValueChange={(value) => handlePropertyChange("unit", value)}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">Celsius</SelectItem>
                    <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="lux">Lux</SelectItem>
                    <SelectItem value="pascal">Pascal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )

      case "trigger":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sourceDevice">Source Device</Label>
                <Select
                  value={properties.sourceDevice}
                  onValueChange={(value) => {
                    // Reset sensor selection when device changes
                    handlePropertyChange("sourceDevice", value);
                    handlePropertyChange("sourceSensor", "");
                  }}
                  disabled={true}
                >
                  <SelectTrigger id="sourceDevice">
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes
                      .filter((node) => node.type === "device")
                      .map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.data.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceSensor">Source Sensor</Label>
                <Select
                  value={properties.sourceSensor}
                  onValueChange={(value) => handlePropertyChange("sourceSensor", value)}
                  disabled={true}
                >
                  <SelectTrigger id="sourceSensor">
                    <SelectValue placeholder="Select sensor" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.sourceDevice &&
                      nodes
                        .find((node) => node.id === properties.sourceDevice)
                        ?.data.properties.sensors.map((sensor: any) => (
                          <SelectItem key={sensor.id} value={sensor.id}>
                            {sensor.name} ({sensor.sensorType})
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={properties.condition}
                  onValueChange={(value) => handlePropertyChange("condition", value)}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">Greater than (&gt;)</SelectItem>
                    <SelectItem value="<">Less than (&lt;)</SelectItem>
                    <SelectItem value="==">Equal to (==)</SelectItem>
                    <SelectItem value="!=">Not equal to (!=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold Value</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={properties.threshold || 0}
                  onChange={(e) => handlePropertyChange("threshold", Number.parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">MQTT Topic</Label>
                <Input
                  id="topic"
                  value={properties.topic || ""}
                  onChange={(e) => handlePropertyChange("topic", e.target.value)}
                />
              </div>
            </div>
          </>
        )

      case "response":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action">Action Type</Label>
                <Select 
                  value={properties.action || "email"} 
                  onValueChange={(value) => handlePropertyChange("action", value)}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="recipient">
                    {properties.action === "mqtt" ? "Topic" : "Recipient Email"}
                  </Label>
                  {properties.action === "email" && properties.recipient && !isValidEmail(properties.recipient) && (
                    <div className="flex items-center text-red-500 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <span>Invalid email</span>
                    </div>
                  )}
                </div>
                <Input
                  id="recipient"
                  type={properties.action === "email" ? "email" : "text"}
                  value={properties.recipient || ""}
                  onChange={(e) => handlePropertyChange("recipient", e.target.value)}
                  className={properties.action === "email" && properties.recipient && !isValidEmail(properties.recipient) 
                    ? "border-red-400" 
                    : ""}
                  placeholder={properties.action === "email" 
                    ? "user@example.com" 
                    : properties.action === "mqtt" 
                      ? "device/sensors/alerts" 
                      : "Recipient"}
                />
                {properties.action === "email" && (
                  <p className="text-xs text-[#7A8CA3]">Enter a valid email address to receive alerts</p>
                )}
              </div>

            </div>
          </>
        )

      case "encrypt":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="algorithm">Encryption Algorithm</Label>
                <Select
                  value={properties.algorithm}
                  onValueChange={(value) => handlePropertyChange("algorithm", value)}
                >
                  <SelectTrigger id="algorithm">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AES-128">AES-128</SelectItem>
                    <SelectItem value="AES-256">AES-256</SelectItem>
                    <SelectItem value="ChaCha20">ChaCha20</SelectItem>
                    <SelectItem value="RSA-2048">RSA-2048</SelectItem>
                    <SelectItem value="ECC">ECC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyRotation">Key Rotation (days)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="keyRotation"
                    min={1}
                    max={90}
                    step={1}
                    value={[properties.keyRotation || 30]}
                    onValueChange={(value) => handlePropertyChange("keyRotation", value[0])}
                  />
                  <span className="w-12 text-center">{properties.keyRotation || 30}d</span>
                </div>
              </div>
            </div>
          </>
        )

      case "mtls":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certAuthority">Certificate Authority</Label>
                <Select
                  value={properties.certAuthority}
                  onValueChange={(value) => handlePropertyChange("certAuthority", value)}
                >
                  <SelectTrigger id="certAuthority">
                    <SelectValue placeholder="Select CA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Let's Encrypt">Let's Encrypt</SelectItem>
                    <SelectItem value="DigiCert">DigiCert</SelectItem>
                    <SelectItem value="GlobalSign">GlobalSign</SelectItem>
                    <SelectItem value="Self-signed">Self-signed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validityPeriod">Validity Period (days)</Label>
                <Input
                  id="validityPeriod"
                  type="number"
                  value={properties.validityPeriod || 365}
                  onChange={(e) => handlePropertyChange("validityPeriod", Number.parseInt(e.target.value))}
                />
              </div>
            </div>
          </>
        )

      case "ota":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version">Firmware Version</Label>
                <Input
                  id="version"
                  value={properties.version || "1.0.0"}
                  onChange={(e) => handlePropertyChange("version", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="rollbackEnabled"
                  checked={properties.rollbackEnabled}
                  onCheckedChange={(checked) => handlePropertyChange("rollbackEnabled", checked)}
                />
                <Label htmlFor="rollbackEnabled">Enable Rollback</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="deltaUpdates"
                  checked={properties.deltaUpdates}
                  onCheckedChange={(checked) => handlePropertyChange("deltaUpdates", checked)}
                />
                <Label htmlFor="deltaUpdates">Delta Updates</Label>
              </div>
            </div>
          </>
        )

      case "debug":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logLevel">Log Level</Label>
                <Select
                  value={properties.logLevel}
                  onValueChange={(value) => handlePropertyChange("logLevel", value)}
                >
                  <SelectTrigger id="logLevel">
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="capturePayload"
                  checked={properties.capturePayload}
                  onCheckedChange={(checked) => handlePropertyChange("capturePayload", checked)}
                />
                <Label htmlFor="capturePayload">Capture Full Payload</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxEntries">Max Entries</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="maxEntries"
                    min={1}
                    max={20}
                    step={1}
                    value={[properties.maxEntries || 5]}
                    onValueChange={(value) => handlePropertyChange("maxEntries", value[0])}
                  />
                  <span className="w-8 text-center">{properties.maxEntries || 5}</span>
                </div>
              </div>
            </div>
          </>
        )

      default:
        return <p className="text-sm text-[#7A8CA3]">No properties available for this component type.</p>
    }
  }

  return (
    <div className="w-64 border-l border-[#D9E4DD] bg-[#f8f6f0] overflow-y-auto">
      <div className="p-4 border-b border-[#D9E4DD] flex justify-between items-center">
        <h2 className="text-lg font-medium text-[#5C6E91]">Block Properties</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor:
                selectedNode.type === "device"
                  ? "#C3E8BD"
                  : selectedNode.type === "trigger"
                    ? "#FECDA6"
                    : selectedNode.type === "response"
                      ? "#CBAACB"
                      : selectedNode.type === "encrypt"
                        ? "#D8BFD8"
                        : selectedNode.type === "mtls"
                          ? "#ABDEE6"
                          : selectedNode.type === "ota"
                            ? "#F3B0C3"
                            : "#EEEEEE",
            }}
          >
            {/* Icon would go here */}
          </div>
          <h3 className="text-base font-medium text-[#5C6E91]">{selectedNode.data.label}</h3>
        </div>

        <Separator className="my-4" />

        {renderProperties()}
      </div>
    </div>
  )
}
