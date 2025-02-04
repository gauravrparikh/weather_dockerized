#!/bin/bash

echo "Starting Redis server..."
redis-server & 
REDIS_PID=$!
sleep 2  # Wait for Redis to start

# Optionally: clear the redis cache if you want. 
echo "Flushing all Redis cache..."
redis-cli FLUSHALL
echo "Redis cache cleared!"


echo "Compiling TypeScript..."
tsc
if [ $? -ne 0 ]; then
    echo "TypeScript compilation failed!"
    kill $REDIS_PID
    exit 1
fi

echo "Starting server..."
node server.js &
SERVER_PID=$!
sleep 5  # Allow server to initialize

echo "Testing server..."
curl -I http://localhost:3000  # Change port if necessary

# echo "Stopping server and Redis..."
# kill $SERVER_PID
# kill $REDIS_PID
# echo "Test complete!"
