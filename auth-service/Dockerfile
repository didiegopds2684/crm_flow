FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY pom.xml ./pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY tenant-service/pom.xml ./tenant-service/pom.xml
COPY entity-engine/pom.xml ./entity-engine/pom.xml
COPY permission-service/pom.xml ./permission-service/pom.xml
COPY analytics-service/pom.xml ./analytics-service/pom.xml
COPY auth-service/src ./auth-service/src
RUN mvn clean package -pl auth-service -am -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/auth-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
