#!/bin/bash
# Maven Wrapper — baixa Maven 3.9.9 automaticamente se não estiver em cache
set -e

MVN_VERSION="3.9.9"
MVN_HOME="$HOME/.mvn/wrapper/apache-maven-$MVN_VERSION"
MVN_BIN="$MVN_HOME/bin/mvn"

if [ ! -f "$MVN_BIN" ]; then
    echo "[mvnw] Baixando Apache Maven $MVN_VERSION..."
    mkdir -p "$MVN_HOME"
    curl -sL \
      "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MVN_VERSION/apache-maven-$MVN_VERSION-bin.tar.gz" \
      | tar xz -C "$MVN_HOME" --strip-components=1
    echo "[mvnw] Maven $MVN_VERSION pronto em $MVN_HOME"
fi

exec "$MVN_BIN" "$@"
