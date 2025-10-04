#!/bin/bash
# Entrypoint for Cloud Run - starts health server immediately, then training

# Start health server in background immediately
python3 /app/cloudrun/health_server.py &
HEALTH_PID=$!

# Wait 10 seconds for health server to be fully ready
sleep 10

# Start training in background
nohup python3 /app/cloudrun/cloud_runner.py > /app/logs/training.log 2>&1 &
TRAINING_PID=$!

echo "Health server started (PID: $HEALTH_PID)"
echo "Training started (PID: $TRAINING_PID)"

# Keep the health server in foreground so container stays alive
wait $HEALTH_PID
