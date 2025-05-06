
import paho.mqtt.client as mqtt

ip = ""
port = 8883

def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))

client = mqtt.Client()
client.on_connect = on_connect

client.connect(ip, port, 60)

client.loop_forever()