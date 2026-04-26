# ─── Build Stage ───
FROM node:20-slim AS builder

WORKDIR /app

# Install production dependencies only (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ─── Production Stage ───
FROM node:20-slim AS production

# Security: create non-root user FIRST, before copying any files
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package*.json ./

# Copy application code with correct ownership
COPY --chown=appuser:appgroup backend/ ./backend/
COPY --chown=appuser:appgroup frontend/ ./frontend/

# Set environment
ENV NODE_ENV=production
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run as non-root user
USER appuser

CMD ["node", "backend/src/server.js"]
