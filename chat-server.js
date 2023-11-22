import { WebSocket, WebSocketServer } from "ws";
import { readFileSync } from "fs";
import express from "express";
import https from "https";

const port = 7070;

const app = express();
app.use(express.static("chat-app"));
app.get("/", (_, res) => res.sendFile("index.html"));

const httpServer = https.createServer({
	key: readFileSync("key.pem"),
	cert: readFileSync("cert.pem")
}, app);

const wsServer = new WebSocketServer({ noServer: true });

// upgrade from http to ws
httpServer.on("upgrade", (req, sock, head) => wsServer.handleUpgrade(req, sock, head, ws => wsServer.emit("connection", ws, req)));

/** @type {Set<WebSocket>} */
const clients = new Set();

/** @type {Map<string, WebSocket>} */
const clientsByUsername = new Map();

/**
 * @param {string} json
 */
function sendAllClients(json) {
	for (const client of clients) {
		client.send(json);
	}
}

/**
 * @param {string} json
 */
function sendAllClientsInChat(json) {
	for (const client of clientsByUsername.values()) {
		client.send(json);
	}
}

/**
 * @param {string} username
 */
function announceUserJoin(username) {
	const obj = { type: 0, username };
	sendAllClientsInChat(JSON.stringify(obj));
}

/**
 * @param {string} sender 
 * @param {string} content 
 */
function distributeUserMessage(sender, content) {
	const obj = { type: 1, sender, content };
	sendAllClientsInChat(JSON.stringify(obj));
}

/**
 * @param {string} username
 */
function announceUserLeave(username) {
	const obj = { type: 2, username };
	sendAllClientsInChat(JSON.stringify(obj));
}

wsServer.on("connection", (client, req) => {
	/** @type {string} */
	let username;

	const logClientAction = (action) => console.log(`[${req.socket.remoteAddress}:${req.socket.remotePort}${username ? ` (${username})` : ""}] ${action}`);

	logClientAction(`has connected`);
	clients.add(client);

	client.on("close", (code, reason) => {
		logClientAction(`has disconnected\n\tCode: ${code}\n\tReason: ${reason}`);
		clients.delete(client);
		clientsByUsername.delete(username);
	});

	client.on("message", data => {
		const str = data.toString();
		logClientAction(`-> ${str}`);
		const obj = JSON.parse(str);

		switch (obj.type) {
			// join object
			case 0: {
				({ username } = obj);

				if (clientsByUsername.has(username)) {
					logClientAction(`attempted to get username "${username}", but it was already taken`);
					client.send(`{"type":3}`);
					break;
				}

				clientsByUsername.set(username, client);
				announceUserJoin(username);
				logClientAction(`has taken username "${username}"`);
			} break;

			// message object
			case 1: {
				const { content } = obj;
				logClientAction(`sent a message: "${content}"`);
				distributeUserMessage(username, content);
			} break;

			// leave object
			case 2: {
				logClientAction(`has requested to leave the chat`);
				announceUserLeave(username);
				clients.delete(client);
				clientsByUsername.delete(username);
			} break;
		}
	});
});

httpServer.listen(port, () => console.log(`Listening on ${port}`));
