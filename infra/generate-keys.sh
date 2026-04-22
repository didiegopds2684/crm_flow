#!/bin/bash
# Gera par de chaves RSA para desenvolvimento e distribui a chave pública
# Execute uma vez antes de subir os serviços

set -e

AUTH_KEYS="auth-service/src/main/resources/keys"
mkdir -p "$AUTH_KEYS"

echo "Gerando par de chaves RSA 2048-bit..."
openssl genrsa -out /tmp/crmflow_rsa_raw.pem 2048 2>/dev/null

# PKCS#8 — formato que Java aceita sem biblioteca externa
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt \
  -in /tmp/crmflow_rsa_raw.pem \
  -out "$AUTH_KEYS/private.pem"

# SPKI — formato padrão para chave pública
openssl rsa -in /tmp/crmflow_rsa_raw.pem -pubout \
  -out "$AUTH_KEYS/public.pem" 2>/dev/null

rm -f /tmp/crmflow_rsa_raw.pem
echo "  private.pem — NUNCA commitar"
echo "  public.pem  — pode ser commitada"

# Distribuir public.pem para todos os serviços que validam JWT
SERVICES="tenant-service entity-engine permission-service analytics-service api-gateway"
for svc in $SERVICES; do
  mkdir -p "$svc/src/main/resources/keys"
  cp "$AUTH_KEYS/public.pem" "$svc/src/main/resources/keys/public.pem"
  echo "  [OK] public.pem → $svc"
done

echo ""
echo "Chaves prontas. Suba os serviços normalmente."
