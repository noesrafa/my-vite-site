#!/bin/bash
# Test OpenClaw Agent Viewer API

TOKEN="82071107a060a21dbf6360d20393190bcdaada09697fc6db"
URL="https://openclaw.soyrafa.dev/tools/invoke"

echo "🧪 Testing OpenClaw Agent Viewer API"
echo "========================================"

echo ""
echo "1️⃣ Testing sessions_list..."
curl -sS "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool": "sessions_list", "args": {"limit": 5}}' | jq '.ok, .result.details.count'

echo ""
echo "2️⃣ Testing sessions_history..."
curl -sS "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool": "sessions_history", "args": {"sessionKey": "agent:main:main", "limit": 3}}' | jq '.ok, .result.details.messages | length'

echo ""
echo "✅ API tests complete!"
