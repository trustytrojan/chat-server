kill $(<pid) 2>/dev/null
node . 7000 &>log & echo $! >pid