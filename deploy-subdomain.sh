kill $(cat pid)
KEY_CERT_PATH=/etc/letsencrypt/live/chat.trustytrojan.dev
node . 443 wss://chat.trustytrojan.dev $KEY_CERT_PATH/privkey.pem $KEY_CERT_PATH/fullchain.pem &>log & echo $! >pid