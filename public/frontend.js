const // object types for the JSON objects going through the WebSocket
	USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOP_TYPING = 5;

/** @type {WebSocket} */
let ws;

/** @type {string} */
let clientUsername;

/**
 * Called in `index.html`
 */
const openWebSocket = () => {
	ws = new WebSocket("wss://chat.trustytrojan.dev");

	ws.onopen = () => {
		startDialog.showModal();
	};

	ws.onmessage = (ev) => {
		const obj = JSON.parse(ev.data.toString());
		switch (obj.type) {
			case USER_JOIN:
				if (obj.username === clientUsername) {
					startDialog.close();
					usernameLabel.innerHTML = `Your username: <b>${clientUsername}</b>`;
				}
				appendSystemMessage(`<b>${clientUsername}</b> has joined the chat`);
				break;

			case USER_MESSAGE:
				appendMessage(createDiv("user-message", `<b>${obj.sender}</b><br>${obj.content}`));
				break;

			case USER_LEAVE:
				appendSystemMessage(`<b>${obj.username}</b> has left the chat`);
				if (obj.username === clientUsername) {
					ws.close(1000, "left the chat");
					hideInteractiveElements();
				}
				break;

			case ERR_USERNAME_TAKEN:
				errorLabel.textContent = "Error: username already taken!";
				break;
		}
	};

	ws.onerror = (ev) => {
		if (ev.type === "error")
			errorLabel.textContent = "Error connecting to chat server!";
	};

	ws.onclose = () => {
		hideInteractiveElements();
	};
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

/**
 * Called in `index.html`
 */
const joinChat = () => {
	clientUsername = usernameInput.value;

	if (!clientUsername.trim()) {
		errorLabel.textContent = "Error: username cannot be empty!";
		return;
	}
	
	ws.send(JSON.stringify({ type: USER_JOIN, username: clientUsername }));
};

/**
 * Called in `index.html`
 */
const sendMessage = () => {
	const content = messageInput.value;
	messageInput.value = "";
	if (!content.trim()) return;
	ws.send(JSON.stringify({ type: USER_MESSAGE, content }));
};

/**
 * Called in `index.html`
 */
const leaveChat = () => {
	ws.send(JSON.stringify({ type: USER_LEAVE }));
};
