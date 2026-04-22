FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY pom.xml ./pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY tenant-service/pom.xml ./tenant-service/pom.xml
COPY entity-engine/pom.xml ./entity-engine/pom.xml
COPY permission-service/pom.xml ./permission-service/pom.xml
COPY analytics-service/pom.xml ./analytics-service/pom.xml
COPY analytics-service/src ./analytics-service/src
RUN mvn clean package -pl analytics-service -am -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/analytics-service/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
