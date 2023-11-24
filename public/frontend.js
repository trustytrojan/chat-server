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

	ws.onopen = () => console.log("WebSocket opened");

	ws.onmessage = (ev) => {
		const str = ev.data.toString();
		console.log(`[server] -> ${str}`);
		const obj = JSON.parse(str);

		switch (obj.type) {
			case USER_JOIN:
				if (obj.username === clientUsername) {
					startForm.attributes.removeNamedItem("open");
					document.getElementById("username-label").innerHTML = `Your username: <b>${clientUsername}</b>`;
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
					document.getElementById("message-input").setAttribute("disabled", "");
					document.getElementById("leave-chat-button").setAttribute("disabled", "");
				}
				break;

			case ERR_USERNAME_TAKEN:
				startForm.setAttribute("open", "");
				errorLabel.textContent = "Error: username already taken!";
				break;
		}
	};

	ws.onerror = (ev) => {
		if (ev.type === "error")
		errorLabel.textContent = "Error connecting to chat server!";
	};

	ws.onclose = () => console.log("WebSocket closed");
};

/** @type {HTMLDivElement} */
let messagesView;

/** @type {HTMLDialogElement} */
let startForm;

/** @type {HTMLInputElement} */
let usernameInput;

/** @type {HTMLInputElement} */
let messageInput;

/** @type {HTMLDivElement} */
let errorLabel;

/**
 * Called immediately after creating and rendering the elements in `index.html`.
 */
const populateElementReferences = () => {
	messagesView = document.getElementById("messages-view");
	startForm = document.getElementById("start-form");
	usernameInput = document.getElementById("username-input");
	messageInput = document.getElementById("message-input");
	errorLabel = document.getElementById("error-label");
};

/** 
 * @param {HTMLDivElement} messageElement
 */
const appendMessage = (messageElement) => messagesView.appendChild(messageElement);

/**
 * @param {string} className 
 * @param {string} innerHTML 
 */
const createDiv = (className, innerHTML) => {
	const div = document.createElement("div");
	div.className = className;
	div.innerHTML = innerHTML;
	return div;
};

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
