#!/bin/bash
# Script to generate certificates for mTLS communication

# Exit on error
set -e

# Create certificates directory
CERT_DIR="../apps/iofra-api/certs"
mkdir -p $CERT_DIR

echo "Generating certificates for mTLS communication..."

# Change to certificates directory
cd $CERT_DIR

# Generate CA private key
echo "Generating CA key..."
openssl genrsa -out ca.key 2048

# Generate CA certificate
echo "Generating CA certificate..."
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt \
  -subj "//C=US\ST=State\L=City\O=Organization\OU=IoT\CN=IoT-Root-CA"

# Generate server private key
echo "Generating server key..."
openssl genrsa -out server.key 2048

# Generate server CSR
echo "Generating server CSR..."
openssl req -new -key server.key -out server.csr \
  -subj "//C=US\ST=State\L=City\O=Organization\OU=IoT\CN=iot-server"

# Create server extensions file
cat > server_ext.cnf << EOF
[req]
req_extensions = v3_req
distinguished_name = req_distinguished_name

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = iot-server
IP.1 = 127.0.0.1
EOF

# Sign server certificate with CA
echo "Signing server certificate..."
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 3650 -sha256 -extfile server_ext.cnf -extensions v3_req

# Create a sample device certificate
echo "Creating sample device certificate..."

# Generate device private key
openssl genrsa -out device_001.key 2048

# Generate device CSR
openssl req -new -key device_001.key -out device_001.csr \
  -subj "//C=US\ST=State\L=City\O=Organization\OU=IoT\CN=esp32_device_001"

# Sign device certificate with CA
openssl x509 -req -in device_001.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out device_001.crt -days 3650 -sha256

# Clean up CSR files
rm *.csr server_ext.cnf

echo "Certificates generated successfully in $CERT_DIR"
echo "CA Certificate: ca.crt"
echo "Server Certificate: server.crt"
echo "Server Key: server.key"
echo "Sample Device Certificate: device_001.crt"
echo "Sample Device Key: device_001.key" 