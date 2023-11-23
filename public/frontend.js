const
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
function connectToServer() {
	ws = new WebSocket("wss://trustytrojan.dev");

	ws.onopen = () => console.log("WebSocket connection opened");

	/** @type {(_: import("ws").MessageEvent) => any} */
	ws.onmessage = ev => {
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
				document.getElementById("error-label").textContent = "Error: username already taken!";			
				break;
		}
	};

	/** @type {(_: import("ws").Event) => any} */
	ws.onerror = ev => {
		if (ev.type === "error")
			document.getElementById("error-label").textContent = "Error connecting to chat server!";
	};

	ws.onclose = () => console.log("WebSocket connection closed");
}

/** @type {HTMLDivElement} */
let messagesView;

/** @type {HTMLDialogElement} */
let startForm;

function populateElementReferences() {
	messagesView = document.getElementById("messages-view");
	startForm = document.getElementById("start-form");
}

/** 
 * @param {HTMLDivElement} messageElement
 */
const appendMessage = messageElement => messagesView.appendChild(messageElement);

/**
 * @param {string} className 
 * @param {string} innerHTML 
 */
function createDiv(className, innerHTML) {
	const div = document.createElement("div");
	div.className = className;
	div.innerHTML = innerHTML;
	return div;
}

/**
 * @param {string} innerHTML 
 */
function appendSystemMessage(innerHTML) {
	appendMessage(createDiv("system-message", innerHTML));
}

/**
 * Called in `index.html`
 * @param {KeyboardEvent} event 
 */
function handleKeyPress(event) {
	if (event.key === "Enter") {
		sendMessage();
	}
}

/**
 * Called in `index.html`
 */
function joinChat() {
	clientUsername = document.getElementById("username-input").value;

	if (!clientUsername.trim()) {
		document.getElementById("error-label").textContent = "Error: username cannot be empty!";
		return;
	}

	ws.send(JSON.stringify({ type: USER_JOIN, username: clientUsername }));
}

function sendMessage() {
	const inputElement = document.getElementById("message-input");
	const content = inputElement.value;
	inputElement.value = "";
	if (!content.trim()) return;
	ws.send(JSON.stringify({ type: USER_MESSAGE, content }));
}

/**
 * Called in `index.html`
 */
function leaveChat() {
	ws.send(JSON.stringify({ type: USER_LEAVE }));
}
