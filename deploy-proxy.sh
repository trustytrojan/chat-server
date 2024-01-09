kill $(cat pid)
node . 7000 wss://chat.trustytrojan.dev &>log & echo $! >pid