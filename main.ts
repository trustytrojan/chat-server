if (!('Deno' in globalThis) || !import.meta.main) {
	console.error('this is a Deno script, not a module to be imported');
	require('node:process').exit(1);
}

import * as ChatServer from './types.ts';

const port = parseInt(Deno.args[0]);

if (isNaN(port)) {
	console.error('port required');
	Deno.exit(1);
}

const clients = new Set<WebSocket>();
const clientsInChat = new Map<string, WebSocket>();

const sendAllClientsInChat = (event: ChatServer.Event) => {
	const str = JSON.stringify(event);
	for (const client of clientsInChat.values())
		client.send(str);
};

const announceUserJoin = (username: string) =>
	sendAllClientsInChat({ type: ChatServer.ChatEventType.USER_JOIN, username });

const announceUserLeave = (username: string) =>
	sendAllClientsInChat({ type: ChatServer.ChatEventType.USER_LEAVE, username });

const distributeUserMessage = (sender: string, content: string) =>
	sendAllClientsInChat({ type: ChatServer.ChatEventType.USER_MESSAGE, sender, content });

const distributeUserTyping = (username: string) =>
	sendAllClientsInChat({ type: ChatServer.ChatEventType.USER_TYPING, username });

const distributeUserStoppedTyping = (username: string) =>
	sendAllClientsInChat({ type: ChatServer.ChatEventType.USER_STOPPED_TYPING, username });

Deno.serve({ port }, (request, { remoteAddr: { hostname, port } }) => {
	if (request.headers.get('upgrade') !== 'websocket') {
		return new Response('https://trustytrojan.dev/chat', { status: 301 });
	}

	const { socket: client, response } = Deno.upgradeWebSocket(request);
	let username: string | undefined;
	const sendEvent = (event: ChatServer.Event) => client.send(JSON.stringify(event));
	const identifierString = () => `[${hostname}:${port}${username ? ` (${username})` : ""}]`;
	const logClientAction = (action: string) => console.log(`${identifierString()} ${action}`);

	logClientAction('has connected');
	clients.add(client);

	client.onclose = ({ code, reason }) => {
		logClientAction(`has disconnected\n\tCode: ${code}\n\tReason: ${reason}`);
		clients.delete(client);
	};

	client.onmessage = ({ data }) => {
		logClientAction(`-> ${data}`);
		if (typeof data !== 'string') return;
		const obj: ChatServer.Event = JSON.parse(data);

		switch (obj.type) {
			case ChatServer.ChatEventType.USER_JOIN:
				({ username } = obj);
				if (clientsInChat.has(username)) {
					logClientAction(`attempted to get username "${username}", but it was already taken`);
					sendEvent({ type: ChatServer.ErrorType.USERNAME_TAKEN, error: true });
					break;
				}
				clientsInChat.set(username, client);
				announceUserJoin(username);
				logClientAction(`has taken username "${username}"`);
				break;
			
			case ChatServer.ChatEventType.USER_MESSAGE:
				if (!username) {
					sendEvent({ type: ChatServer.ErrorType.NO_USERNAME, error: true });
					break;
				}
				logClientAction(`sent a message: "${obj.content}"`);
				distributeUserMessage(username, obj.content);
				break;

			case ChatServer.ChatEventType.USER_LEAVE:
				if (!username) {
					sendEvent({ type: ChatServer.ErrorType.NO_USERNAME, error: true });
					break;
				}
				logClientAction('has requested to leave the chat');
				announceUserLeave(username);
				clients.delete(client);
				clientsInChat.delete(username);
				username = undefined;
				console.log(`Removed ${identifierString()} from the chat`);
				break;

			case ChatServer.ChatEventType.USER_TYPING:
				if (!username) {
					sendEvent({ type: ChatServer.ErrorType.NO_USERNAME, error: true });
					break;
				}
				logClientAction('started typing');
				distributeUserTyping(username);
				break;

			case ChatServer.ChatEventType.USER_STOPPED_TYPING:
				if (!username) {
					sendEvent({ type: ChatServer.ErrorType.NO_USERNAME, error: true });
					break;
				}
				logClientAction('stopped typing');
				distributeUserStoppedTyping(username);
				break;
		}
	};

	return response.json();
});
