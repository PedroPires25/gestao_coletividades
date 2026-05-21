# ── Build ──────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY . .

# Dá permissões ao Maven Wrapper
RUN chmod +x mvnw

# Compila
RUN ./mvnw clean package -DskipTests

# ── Runtime ────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 10000

ENTRYPOINT ["java","-jar","app.jar"]
