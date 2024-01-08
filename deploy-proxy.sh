kill $(cat pid)
node . 7000 wss://trustytrojan.dev/chat &>log & echo $! >pid