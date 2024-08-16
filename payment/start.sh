#!/bin/bash

curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list
apt update
apt install -y ngrok jq
ngrok config add-authtoken $NGROK_AUTH_TOKEN
ngrok http 30210 &

sleep 5 

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

echo "Ngrok URL: $NGROK_URL"

export WEBHOOK_URL="$NGROK_URL/payment/webhook" > .env
node dist/main.js

