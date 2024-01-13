import { WebSocketServer } from "ws";
import { readFileSync, writeFileSync } from "fs";
import { argv, exit } from "process";
import express from "express";

const // object types for the JSON objects going through the WebSocket
	USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOPPED_TYPING = 5;

if (argv.length < 4 || argv.length > 6) {
	console.error("Required args: <port> <ws_url> [<key_file> <cert_file>]\nSupply <key_file> and <cert_file> to enable HTTPS");
	exit(1);
}

const port = Number.parseInt(argv[2]);
const wsUrl = argv[3];
const keyPath = argv[4];
const certPath = argv[5];

writeFileSync("res/_websocket.js", readFileSync("res/websocket.js", "utf8").replace("wsUrl", wsUrl));

const app = express();
app.use(express.static("res"));

const httpServer = (keyPath && certPath)
	? (await import("https")).createServer({
		key: readFileSync(keyPath),
		cert: readFileSync(certPath)
	}, app)
	: (await import("http")).createServer(app);

const wsServer = new WebSocketServer({ noServer: true });

// upgrade from http to ws
httpServer.on("upgrade", (req, sock, head) => wsServer.handleUpgrade(req, sock, head, ws => wsServer.emit("connection", ws, req)));

/** @type {Set<import("ws").WebSocket>} */
const clients = new Set();

/**
 * Maps usernames to client sockets.
 * @type {Map<string, import("ws").WebSocket>}
 */
const clientsInChat = new Map();

/**
 * @param {number} type 
 * @param {object} obj 
 */
const sendAllClientsInChat = (type, obj) => {
	for (const client of clientsInChat.values())
		client.send(JSON.stringify({ type, ...obj }));
};

/**
 * @param {string} username
 */
const announceUserJoin = (username) => sendAllClientsInChat(USER_JOIN, { username });

/**
 * @param {string} sender 
 * @param {string} content 
 */
const distributeUserMessage = (sender, content) => sendAllClientsInChat(USER_MESSAGE, { sender, content });

/**
 * @param {string} username 
 */
const distributeUserTyping = (username) => sendAllClientsInChat(USER_TYPING, { username });

/**
 * @param {string} username 
 */
const distributeUserStoppedTyping = (username) => sendAllClientsInChat(USER_STOPPED_TYPING, { username });

/**
 * @param {string} username
 */
const announceUserLeave = (username) => sendAllClientsInChat(USER_LEAVE, { username });

wsServer.on("connection", (client, req) => {
	/** @type {string} */
	let username;

	/**
	 * @param {number} type 
	 * @param {object} obj 
	 */
	const sendObj = (type, obj) => client.send(JSON.stringify({ type, ...obj }));

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

	client.on("message", (data) => {
		const str = data.toString();
		logClientAction(`-> ${str}`);
		const obj = JSON.parse(str);

		switch (obj.type) {
			case USER_JOIN:
				({ username } = obj);
				if (clientsInChat.has(username)) {
					logClientAction(`attempted to get username "${username}", but it was already taken`);
					sendObj(ERR_USERNAME_TAKEN)
					break;
				}
				clientsInChat.set(username, client);
				announceUserJoin(username);
				logClientAction(`has taken username "${username}"`);
				break;

			case USER_MESSAGE:
				logClientAction(`sent a message: "${obj.content}"`);
				distributeUserMessage(username, obj.content);
				break;

			case USER_LEAVE:
				logClientAction("has requested to leave the chat");
				announceUserLeave(username);
				clients.delete(client);
				clientsInChat.delete(username);
				break;

			case USER_TYPING:
				logClientAction("started typing");
				distributeUserTyping(username);
				break;

			case USER_STOPPED_TYPING:
				logClientAction("stopped typing");
				distributeUserStoppedTyping(username);
				break;
		}
	});
});

httpServer.listen(port, () => console.log(`Listening on ${port}`));
