import express from "express";
import { argv, exit } from "process";

if (argv.length !== 3) {
	console.error(`Required arguments: <port>`);
	exit(1);
}

const app = express();
const port = Number.parseInt(argv[2]);

app.use(express.static("chat-app"));

app.get("/", (_, res) => res.sendFile("index.html"));

app.listen(port, () => console.log(`HTTP server listening on port ${port}`));
