# Build stage
FROM golang:latest AS builder

WORKDIR /app

# Copy go mod files from backend directory
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy source code from backend directory
COPY backend/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/main .
RUN chmod +x ./main

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]