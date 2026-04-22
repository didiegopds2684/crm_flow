#!/bin/bash
# Sobe um serviço localmente com a infra Docker já rodando
# Uso: ./dev.sh auth-service
#      ./dev.sh tenant-service

set -e

SERVICE=${1:-}

if [ -z "$SERVICE" ]; then
    echo "Uso: $0 <nome-do-servico>"
    echo ""
    echo "Serviços disponíveis:"
    echo "  auth-service        :8081  — JWT, login, register"
    echo "  tenant-service      :8082  — tenants e schemas"
    echo "  entity-engine       :8083  — Dynamic Entity Engine"
    echo "  permission-service  :8084  — RBAC/ABAC"
    echo "  analytics-service   :8085  — eventos e agregações"
    echo "  api-gateway         :8080  — roteamento e JWT gateway"
    echo "  frontend            :3000  — Next.js dashboard"
    exit 0
fi

if [ ! -d "$SERVICE" ]; then
    echo "Serviço '$SERVICE' não encontrado"
    exit 1
fi

if [ "$SERVICE" = "frontend" ]; then
    echo ""
    echo "=== Iniciando frontend ==="
    cd frontend
    if [ ! -d node_modules ]; then
        echo "Instalando dependências npm..."
        npm install
    fi
    echo "Frontend disponível em: http://localhost:3000"
    echo ""
    CRMFLOW_API_URL=${CRMFLOW_API_URL:-http://localhost:8080} npm run dev
    exit 0
fi

# Detectar JAVA_HOME — prefere Java 21, cai no sistema se não encontrar
if [ -d "/usr/lib/jvm/java-21-openjdk" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
elif [ -d "/usr/lib/jvm/java-21-amazon-corretto" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-21-amazon-corretto"
fi
export PATH="$JAVA_HOME/bin:$PATH"

echo "Java: $(java -version 2>&1 | head -1)"

echo ""
echo "=== Verificando infra Docker ==="
INFRA_OK=true
for container in crmflow-postgres crmflow-redis; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")
    if [ "$STATUS" != "healthy" ]; then
        INFRA_OK=false
        echo "  $container: $STATUS"
    else
        echo "  $container: healthy"
    fi
done

if [ "$INFRA_OK" = "false" ]; then
    echo "Subindo infra..."
    docker-compose up -d postgres redis rabbitmq
    echo "Aguardando 10s..."
    sleep 10
fi

echo ""
echo "=== Instalando parent POM ==="
./mvnw install -N -q 2>/dev/null

echo ""
echo "=== Iniciando $SERVICE ==="
echo "Swagger UI disponível em: http://localhost:$(grep 'port:' $SERVICE/src/main/resources/application.yml | awk '{print $2}')/swagger-ui"
echo ""
./mvnw spring-boot:run -pl "$SERVICE"
