pkill node
KEY_CERT_PATH=/etc/letsencrypt/live/chat.trustytrojan.dev
node . 443 $KEY_CERT_PATH/privkey.pem $KEY_CERT_PATH/fullchain.pem &>log & echo $! >pidfile