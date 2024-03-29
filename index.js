import { WebSocketServer } from 'ws';
import { argv, exit } from 'process';

const // WebSocket JSON object types
	USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOPPED_TYPING = 5;

const port = parseInt(argv[2]);

if (!port) {
	console.error('Port required');
	exit(1);
}

const wsServer = new WebSocketServer({ port }, () => console.log(`Listening on ${port}`));

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

wsServer.on('connection', (client, req) => {
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

	logClientAction('has connected');
	clients.add(client);

	client.on("close", (code, reason) => {
		logClientAction(`has disconnected\n\tCode: ${code}\n\tReason: ${reason}`);
		clients.delete(client);
		clientsInChat.delete(username);
	});

	client.on('message', (data) => {
		const str = data.toString();
		logClientAction(`-> ${str}`); // log incoming json data
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
				logClientAction('has requested to leave the chat');
				announceUserLeave(username);
				clients.delete(client);
				clientsInChat.delete(username);
				break;

			case USER_TYPING:
				logClientAction('started typing');
				distributeUserTyping(username);
				break;

			case USER_STOPPED_TYPING:
				logClientAction('stopped typing');
				distributeUserStoppedTyping(username);
				break;
		}
	});
});