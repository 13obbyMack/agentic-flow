# AgentDB v1.1.0 - Comprehensive Feature Testing
FROM node:18-alpine

# Install SQLite for verification
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY dist ./dist

# Install dependencies
RUN npm install --production

# Create test directory
RUN mkdir -p /test-data

# Set environment
ENV AGENTDB_PATH=/test-data/agentdb-test.db
ENV NODE_ENV=production

# Entry point for testing
CMD ["node", "dist/cli/agentdb-cli.js", "--help"]
