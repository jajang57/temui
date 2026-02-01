#!/bin/bash

# Define the URL and Headers
URL="http://localhost:8080/api/system/shutdown"
SECRET="internal-shutdown-trigger"

echo "Stopping Temui App..."

# Send the POST request using curl
HTTP_RESPONSE=$(curl --write-out "HTTPSTATUS:%{http_code}" --silent --output /dev/null -X POST "$URL" -H "X-App-Secret: $SECRET")

# Extract the status
HTTP_STATUS=$(echo $HTTP_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "Shutdown signal sent successfully."
else
  echo "Error: Failed to send shutdown signal. Server might not be running or responded with status $HTTP_STATUS"
  echo "You may need to manually kill the process using 'pkill temui-mac' or Activity Monitor."
fi
