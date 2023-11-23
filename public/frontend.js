const USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOP_TYPING = 5;

/** @type {WebSocket} */
let ws;

/** @type {string} */
let username;

function connectToServer() {
	ws = new WebSocket("wss://trustytrojan.servehttp.com:7070");

	ws.onopen = () => console.log("WebSocket connection opened");

	/** @type {(_: import("ws").MessageEvent) => any} */
	ws.onmessage = ev => {
		const str = ev.data.toString();
		console.log(`[server] -> ${str}`);
		const obj = JSON.parse(str);

		switch (obj.type) {
			case USER_JOIN:
				appendUserJoin(obj);
				break;
			case USER_MESSAGE:
				appendUserMessage(obj);
				break;
			case USER_LEAVE:
				appendUserLeave(obj);
				break;
			case ERR_USERNAME_TAKEN:
				errorUsernameTaken();
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
 * @param {{ sender: string, content: string }} 
 */
function appendUserMessage({ sender, content }) {
	appendMessage(createDiv("user-message", `<b>${sender}</b><br>${content}`));
}

/**
 * @param {{ username: string }} 
 */
function appendUserJoin({ username }) {
	if (username === username) {
		document.getElementById("start-form").attributes.removeNamedItem("open");
		document.getElementById("username-label").innerHTML = `Your username: <b>${username}</b>`;
	}

	appendSystemMessage(`<b>${username}</b> has joined the chat`);
}

/**
 * @param {{ username: string }} 
 */
function appendUserLeave({ username }) {
	appendSystemMessage(`<b>${username}</b> has left the chat`);

	if (username === username) {
		ws.close(1000, "left the chat");
		document.getElementById("message-input").setAttribute("disabled", "");
		document.getElementById("leave-chat-button").setAttribute("disabled", "");
	}
}

function errorUsernameTaken() {
	document.getElementById("start-form").setAttribute("open", "");
	document.getElementById("error-label").textContent = "Error: username already taken!";
}

/**
 * @param {KeyboardEvent} event 
 */
function handleKeyPress(event) {
	if (event.key === "Enter") {
		sendMessage();
	}
}

function joinChat() {
	username = document.getElementById("username-input").value;

	if (!username.trim()) {
		document.getElementById("error-label").textContent = "Error: username cannot be empty!";
		return;
	}

	ws.send(JSON.stringify({ type: USER_JOIN, username }));
}

function sendMessage() {
	const inputElement = document.getElementById("message-input");
	const content = inputElement.value;
	inputElement.value = "";
	if (!content.trim()) return;
	ws.send(JSON.stringify({ type: USER_MESSAGE, content }));
}

function leaveChat() {
	ws.send(JSON.stringify({ type: USER_LEAVE }));
}
