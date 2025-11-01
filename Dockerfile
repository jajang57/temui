FROM nixos/nix:latest AS builder

# Install Go
RUN nix-channel --update && nix-env -iA nixpkgs.go_1_21

# Set work directory
WORKDIR /app

# Copy go mod files
COPY backend/go.mod backend/go.sum ./backend/
WORKDIR /app/backend

# Download dependencies
RUN go mod download

# Copy source code
COPY backend/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/backend/main .

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]