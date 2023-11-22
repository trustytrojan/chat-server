import { WebSocket, WebSocketServer } from "ws";
import { argv, exit } from "process";

if (argv.length !== 3) {
	console.error(`Required arguments: <port>`);
	exit(1);
}

const port = Number.parseInt(argv[2]);
const server = new WebSocketServer({ port });

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

server.on("connection", (client, req) => {
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

console.log(`WebSocket server listening on ${port}`);
