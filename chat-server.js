import { WebSocket, WebSocketServer } from "ws";
import { readFileSync } from "fs";
import express from "express";
import https from "https";
import { argv, exit } from "process";

const
	USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOP_TYPING = 5;

if (argv.length !== 5) {
	console.error("Required args: <port> <key_file> <cert_file>");
	exit(1);
}

const port = Number.parseInt(argv[2]);
const keyPath = argv[3];
const certPath = argv[4];

const app = express();
app.use(express.static("public"));
app.get("/", (_, res) => res.sendFile("index.html"));

const httpServer = https.createServer({
	key: readFileSync(keyPath),
	cert: readFileSync(certPath)
}, app);

const wsServer = new WebSocketServer({ noServer: true });

// upgrade from http to ws
httpServer.on("upgrade", (req, sock, head) => wsServer.handleUpgrade(req, sock, head, ws => wsServer.emit("connection", ws, req)));

/** @type {Set<WebSocket>} */
const clients = new Set();

/**
 * Maps usernames to client sockets.
 * @type {Map<string, WebSocket>}
 */
const clientsInChat = new Map();

/**
 * @param {string} json
 */
function sendAllClientsInChat(json) {
	for (const client of clientsInChat.values()) {
		client.send(json);
	}
}

/**
 * @param {string} username
 */
function announceUserJoin(username) {
	const obj = { type: USER_JOIN, username };
	sendAllClientsInChat(JSON.stringify(obj));
}

/**
 * @param {string} sender 
 * @param {string} content 
 */
function distributeUserMessage(sender, content) {
	const obj = { type: USER_MESSAGE, sender, content };
	sendAllClientsInChat(JSON.stringify(obj));
}

/**
 * @param {string} username
 */
function announceUserLeave(username) {
	const obj = { type: USER_LEAVE, username };
	sendAllClientsInChat(JSON.stringify(obj));
}

wsServer.on("connection", (client, req) => {
	/** @type {string} */
	let username;

	/**
	 * @param {string} action 
	 */
	const logClientAction = (action) => console.log(`[${req.socket.remoteAddress}:${req.socket.remotePort}${username ? ` (${username})` : ""}] ${action}`);

	logClientAction(`has connected`);
	clients.add(client);

	client.on("close", (code, reason) => {
		logClientAction(`has disconnected\n\tCode: ${code}\n\tReason: ${reason}`);
		clients.delete(client);
		clientsInChat.delete(username);
	});

	client.on("message", data => {
		const str = data.toString();
		logClientAction(`-> ${str}`);
		const obj = JSON.parse(str);

		switch (obj.type) {
			// join object
			case USER_JOIN: {
				({ username } = obj);

				if (clientsInChat.has(username)) {
					logClientAction(`attempted to get username "${username}", but it was already taken`);
					client.send(JSON.stringify({ type: ERR_USERNAME_TAKEN }));
					break;
				}

				clientsInChat.set(username, client);
				announceUserJoin(username);
				logClientAction(`has taken username "${username}"`);
			} break;

			// message object
			case USER_MESSAGE: {
				const { content } = obj;
				logClientAction(`sent a message: "${content}"`);
				distributeUserMessage(username, content);
			} break;

			// leave object
			case USER_LEAVE: {
				logClientAction(`has requested to leave the chat`);
				announceUserLeave(username);
				clients.delete(client);
				clientsInChat.delete(username);
			} break;
		}
	});
});

httpServer.listen(port, () => console.log(`Listening on ${port}`));
