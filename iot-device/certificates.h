#ifndef CERTIFICATES_H
#define CERTIFICATES_H

// Root CA certificate (server trust)
const char* rootCA = R"(
-----BEGIN CERTIFICATE-----
REPLACE_WITH_YOUR_ROOT_CA_CERTIFICATE
-----END CERTIFICATE-----
)";

// Device certificate (for the server to authenticate this device)
const char* deviceCert = R"(
-----BEGIN CERTIFICATE-----
REPLACE_WITH_YOUR_DEVICE_CERTIFICATE
-----END CERTIFICATE-----
)";

// Device private key (keep this secure)
const char* deviceKey = R"(
-----BEGIN PRIVATE KEY-----
REPLACE_WITH_YOUR_DEVICE_PRIVATE_KEY
-----END PRIVATE KEY-----
)";

#endif // CERTIFICATES_H 