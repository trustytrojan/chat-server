kill $(cat pid) 2>/dev/null
node . 7000 wss://chat.trustytrojan.dev &>log & echo $! >pid