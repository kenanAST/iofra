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
import { X } from "lucide-react"

interface PropertiesPanelProps {
  selectedNode: Node | null
  updateNodeProperties: (nodeId: string, properties: any) => void
}

export function PropertiesPanel({ selectedNode, updateNodeProperties }: PropertiesPanelProps) {
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={properties.status}
                  onValueChange={(value) => handlePropertyChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  value={properties.ipAddress || ""}
                  onChange={(e) => handlePropertyChange("ipAddress", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={properties.location || ""}
                  onChange={(e) => handlePropertyChange("location", e.target.value)}
                />
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
                <Select value={properties.action} onValueChange={(value) => handlePropertyChange("action", value)}>
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="mqtt">MQTT Publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  value={properties.recipient || ""}
                  onChange={(e) => handlePropertyChange("recipient", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Template</Label>
                <Input
                  id="message"
                  value={properties.message || ""}
                  onChange={(e) => handlePropertyChange("message", e.target.value)}
                />
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
                selectedNode.type === "sensor"
                  ? "#A6D1E6"
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
