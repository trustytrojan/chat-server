const // object types for the JSON objects going through the WebSocket
	USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOP_TYPING = 5;

/** @type {WebSocket & { sendChatData: (type: number, obj: object) => void }} */
let ws;

/** @type {string} */
let username;

const openWebSocket = () => {
	ws = new WebSocket("wss://chat.trustytrojan.dev");
	ws.onopen = startDialog.showModal;
	ws.onmessage = (ev) => {
		const obj = JSON.parse(ev.data.toString());
		switch (obj.type) {
			case USER_JOIN:
				if (obj.username === username) {
					startDialog.close();
					usernameLabel.innerHTML = `Your username: <b>${username}</b>`;
				}
				appendSystemMessage(`<b>${username}</b> has joined the chat`);
				break;

			case USER_MESSAGE:
				appendMessage(createDiv("user-message", `<b>${obj.sender}</b><br>${obj.content}`));
				break;

			case USER_LEAVE:
				appendSystemMessage(`<b>${obj.username}</b> has left the chat`);
				if (obj.username === username) {
					ws.close(1000, "left the chat");
					hideInteractiveElements();
				}
				break;

			case USER_TYPING:
				typingLabel.hidden = false;
				typingUsernames.appendChild(createDiv("typing-username", ));
				break;

			case ERR_USERNAME_TAKEN:
				errorLabel.textContent = "Error: username already taken!";
				break;
		}
	};
	ws.onerror = (ev) => { if (ev.type === "error") errorLabel.textContent = "Error connecting to chat server!"; };
	ws.onclose = hideInteractiveElements;
	ws.sendChatData = function (type, obj = {}) { this.send(JSON.stringify({ type, ...obj })); };
};

/**
 * @param {KeyboardEvent} ev
 */
const messageInputKeyDown = (ev) => {
	if (ev.key === "Enter")
		sendMessage();
	else {
		startTyping();
		setTimeout(stopTyping, 1_000);
	}
};

/** 
 * @param {HTMLDivElement} messageElement
 */
const appendMessage = (messageElement) => messagesView.appendChild(messageElement);

/**
 * @param {string} innerHTML 
 */
const appendUserMessage = (innerHTML) => appendMessage(createDiv("user-message", innerHTML));

/**
 * @param {string} innerHTML 
 */
const appendSystemMessage = (innerHTML) => appendMessage(createDiv("system-message", innerHTML));

const joinChat = () => {
	username = usernameInput.value;
	if (!username.trim()) { errorLabel.textContent = "Error: username cannot be empty!"; return; }
	ws.sendChatData(USER_JOIN, { username });
};

const sendMessage = () => {
	const content = messageInput.value;
	messageInput.value = "";
	if (!content.trim()) return;
	ws.sendChatData(USER_MESSAGE, { content });
};

const startTyping = () => ws.sendChatData(USER_TYPING);
const stopTyping = () => ws.sendChatData(USER_STOP_TYPING);
const leaveChat = () => ws.sendChatData(USER_LEAVE);
