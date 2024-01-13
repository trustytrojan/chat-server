kill $(cat pid) 2>/dev/null
node . 7000 wss://trustytrojan.dev/chat &>log & echo $! >pid