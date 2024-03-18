#!/bin/bash

sudo rm -r ./chatbot/.next 
pm2 start 'PORT=5000 node index.js' --name 'chatflix-website'
cd chatbot
pm2 start 'pnpm run dev' --name 'chatflix-chatbot'
cd ../payment
pm2 start 'npm run start' --name 'chatflix-payment'

echo "Ready. Go to http://localhost:5000 to run the app, http://localhost:8888 to debug payments, or http://localhost:3000 to fuck with flixi"
