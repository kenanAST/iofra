#ifndef CERTIFICATES_H
#define CERTIFICATES_H

// Root CA certificate (server trust)
const char* rootCA = R"(
-----BEGIN CERTIFICATE-----
MIIDrzCCApegAwIBAgIUDE4upk0ZEmIIlSpfolAp9QwI2PowDQYJKoZIhvcNAQEL
BQAwZzELMAkGA1UEBhMCVVMxDjAMBgNVBAgMBVN0YXRlMQ0wCwYDVQQHDARDaXR5
MRUwEwYDVQQKDAxPcmdhbml6YXRpb24xDDAKBgNVBAsMA0lvVDEUMBIGA1UEAwwL
SW9ULVJvb3QtQ0EwHhcNMjUwNTA0MTA1MjA2WhcNMzUwNTAyMTA1MjA2WjBnMQsw
CQYDVQQGEwJVUzEOMAwGA1UECAwFU3RhdGUxDTALBgNVBAcMBENpdHkxFTATBgNV
BAoMDE9yZ2FuaXphdGlvbjEMMAoGA1UECwwDSW9UMRQwEgYDVQQDDAtJb1QtUm9v
dC1DQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAOdJT2TFKWKSktwo
noux0b+L8wibdt/shHEUrk0QxVGHEC8c+kUmNPxpB1fqOkfKFHH4mHHlHNf3dqMv
L6/fTXY7XRS60p4dGMMMrEwNkuHuy+NBKnmWfyyH2dYkH7/JcZLd/rHo2UAuudWW
kuVa08mreMSZLrH01oy4ZpxriX4MO9BtW6kaes90fB42JZP8FPHGCjgZ5BR527DF
phm3tmUEWgdzF+tn6E66edSbhvY8T0pZ7+YapvzM19tIOfx7mM9sJ5MPr7eNKh/3
OOTqkQLaZ2Q8Mje8crOVekepMFrIIgmTdiI6Bw2BBO3IOrqimqGXjsjdJ0hOXsjp
eHVzh30CAwEAAaNTMFEwHQYDVR0OBBYEFCRpc6LkAI5WEkiqS53jAxEePvQ1MB8G
A1UdIwQYMBaAFCRpc6LkAI5WEkiqS53jAxEePvQ1MA8GA1UdEwEB/wQFMAMBAf8w
DQYJKoZIhvcNAQELBQADggEBAK+HAp/SrANFJy62O8HaGB5jpOyj4HUzhvymv/FK
ay7FbCRxu6fn9nyrMaK63YIi7RMAgYh+I9+nCETSBgRt9HCd3WSkNJuAmw7Tptck
WPxeR8f1LtH1Zecdo5UkLKBuz6axMA49HWDoYXbyEtqmhglTwFPFQ3LX4zHr6S91
/x9nM7bT8zHim5OfW6i5OAGlRRorRVDM0xibYpl8+d8ufk6Lu8hE9N4DksNcuNw9
WE0rQh3y0z9FSVAwybZC1hhK/trnjF1N/RfOEH6MlvBRcKYbGTIsLz111FWUUDzG
AhTgBw2FFsvh6H4eTij8kMhr67eM07gnE83Yr2CLHYYxB1Y=
-----END CERTIFICATE-----
)";

// Device certificate (for the server to authenticate this device)
const char* deviceCert = R"(
-----BEGIN CERTIFICATE-----
MIIDozCCAougAwIBAgIUasoSI3w50qx2ocPSTOIIKk4XzxIwDQYJKoZIhvcNAQEL
BQAwZzELMAkGA1UEBhMCVVMxDjAMBgNVBAgMBVN0YXRlMQ0wCwYDVQQHDARDaXR5
MRUwEwYDVQQKDAxPcmdhbml6YXRpb24xDDAKBgNVBAsMA0lvVDEUMBIGA1UEAwwL
SW9ULVJvb3QtQ0EwHhcNMjUwNTA0MTA1MjA3WhcNMzUwNTAyMTA1MjA3WjBsMQsw
CQYDVQQGEwJVUzEOMAwGA1UECAwFU3RhdGUxDTALBgNVBAcMBENpdHkxFTATBgNV
BAoMDE9yZ2FuaXphdGlvbjEMMAoGA1UECwwDSW9UMRkwFwYDVQQDDBBlc3AzMl9k
ZXZpY2VfMDAxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhT7P3bIP
yHfVQkikT9pyxxMo6JWKEIZgSLwNhPlVzL+Wnrz+xDKlbVd5/5vD+qte8+P+Dkl1
+KZqlqhXYdIROh4oOWMYGpwF/D9vSkY3UdZYkAKx5rrP2EvQEBwwwXtKabzmzuHl
heeD/EVHJqOii1aiuleQgRHw5xUNVdEc0oVVNE/YSHHkGiGvikFpTAlHa33jGXGO
zJEkYAYKnflJFImhd3br5RMQE++2MeCvpNwKUCCKIciIuZZ0x0XpwaKHbIpMDfXv
GQ9W7LfXeZPU/uwPqNCd/ZsBMKjUDqO538och5bI1l6JglPAPRNrdy2pR6eeCoFZ
Ia25xGv86ILCwQIDAQABo0IwQDAdBgNVHQ4EFgQU9jfhdXncsEXQ4tnV7eC+AInn
DrkwHwYDVR0jBBgwFoAUJGlzouQAjlYSSKpLneMDER4+9DUwDQYJKoZIhvcNAQEL
BQADggEBAF2pTI+FYVJnWsuRBp1KHdHEmoBbAk+FjBu/BmMnH3q3rT1MDv1XINfT
BodcqiCCTC06oPhEG/euDZ4eiQVqailWV5q0U9HwnicJmZeN8OZ1aQuQAkhalat0
Chvi6w4lBTbDTpq853tpf+jXVXGv4t7SZKK3fAINA7neBs2mBs/822wbW/NheIAC
F5oLpj4UFW2Dzm054ZJsl51vLmyIuWLCKDS/xM5foqwdLuRzwU/Lpvozlc63kzXL
PSugmAb7CLAaIqEbVDfaIGyWCuhyI8N26x5GKpw6Yf4Ct3ldzQgTTpHdH9Kx2jU3
DIhW7Dw86F7RyoH6NSpNxplgMw31suQ=
-----END CERTIFICATE-----
)";

// Device private key (keep this secure)
const char* deviceKey = R"(
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCFPs/dsg/Id9VC
SKRP2nLHEyjolYoQhmBIvA2E+VXMv5aevP7EMqVtV3n/m8P6q17z4/4OSXX4pmqW
qFdh0hE6Hig5YxganAX8P29KRjdR1liQArHmus/YS9AQHDDBe0ppvObO4eWF54P8
RUcmo6KLVqK6V5CBEfDnFQ1V0RzShVU0T9hIceQaIa+KQWlMCUdrfeMZcY7MkSRg
Bgqd+UkUiaF3duvlExAT77Yx4K+k3ApQIIohyIi5lnTHRenBoodsikwN9e8ZD1bs
t9d5k9T+7A+o0J39mwEwqNQOo7nfyhyHlsjWXomCU8A9E2t3LalHp54KgVkhrbnE
a/zogsLBAgMBAAECggEAIv8NX4AODywSMhecOHD6pnjMzNHB8ncowNHLhzppo55K
dCTVkThwJJjOLSl/Ps5V4R7nsl7vAkDLTAio8sNWzPnwvKnfQdXq6IbMtyhcDT2M
Az8B9MTqJDg9TI3q7FZyg/UedgX038ef7dlQR8DAx3IYyXKIPK42pKrt1rVWqaAE
bRJ8LHhExqZxVonOT5DP+XLIbT/xb71PYP5tX95KZPRCPBWMuDSp/EFJL5BCPLWl
BIEtJq/vckRE9vOU1fuG/AlHVBgbXWx7el2v+fECAFtHkAuQHVGLk33qupfSXh/R
oY4cF5SWF/yewGMsRnCH/cPBCKBzh6Y9JjJC4kpvtQKBgQC5kIFEANwFwM9vZhk1
b24QxMnt6gkHL6nzF9VYu5zxD5ZUaOKOtrzYJ3m0oNkTaI/PG8aGMTARC/6Kq8fi
O89zU/X6AvO6ak2EF69gQchVc1TLzCh9MWpacfow2xClE0a09kduBGT2PgQe3Wb+
SHir3t5Zy0zGk7mZntYqN+RQxwKBgQC30mdcTN+aR13wxGBJ+Lpz2Pm9xRRXXw1e
T7QlsRuo1S9l2/EkNUqZpuX5dpg/hV43Vd8OCk8OEMwN0BxGlqtt0DS6yMo0PlLN
TUZM5XnZYm8+k885ucSiU8GvlSjZAybqjxFuVmd83ECoXRoKrENqzo/3RrGiAWmA
jwKZYMdYNwKBgD7zl/bS99F31KdtEpY/JC7KI9rzb3aho90VM8pzc02QRSaDooBZ
2/zUf4RYoOvlqAvR12qE21KdKBAxMJE+SyVL0YGsaLTQBVYPlu5nwqfChXzR2NaH
4hWm3wKd/qqRvIX9msPm971V0p4J7DvNqCpeZD5AKt6fFPLZoLwX0/vXAoGAJGsS
/z5brn0lJ2ZAjWcxyXHbSLWa6hRy2ZSA5FbKXBCga1W/2KSWOwrN1TahwzPxDpV8
s5NnRiodwz7P20xOelsdl0Pgi6ktTm9Y1jNAiMjvsT4neBBN3LsrTFYI2bW+KApg
MbP8nMgmJzUKy8KFOMvjyeG/n5EYDdhHc4uw8tECgYBTnwlm+NhUKPk3KdQ2AYwQ
XyVAB8ndVuStuOsVT+Ty4cj0JysucEy7s/TZ6vzYE8VqulD5HJPK1bVbr+iNu6Ge
1UrUMg1tgHBicc2cKLguEEnfxiMPHCJ8cLUc5IVr8f+3SW+Nic//2DSu6CJKgL/6
bqBEcftzA8L5J7JFnwqHtw==
-----END PRIVATE KEY-----
)";

#endif // CERTIFICATES_H 