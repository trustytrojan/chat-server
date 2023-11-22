/** @type {WebSocket} */
let ws;

/** @type {string} */
let clientUsername;

function connectToServer() {
	ws = new WebSocket("ws://10.0.0.245:6969");

	ws.onopen = () => console.log("connection opened!");

	/** @type {(_: import("ws").MessageEvent) => any} */
	ws.onmessage = ev => {
		const str = ev.data.toString();
		console.log(`[server] -> ${str}`);
		const obj = JSON.parse(str);

		switch (obj.type) {
			case 0: appendUserJoin(obj); break;
			case 1: appendUserMessage(obj); break;
			case 2: appendUserLeave(obj); break;
			case 3: errorUsernameTaken(); break;
		}
	};

	/** @type {(_: import("ws").Event) => any} */
	ws.onerror = ev => {
		console.error(ev);
		if (ev.type === "error")
			document.getElementById("error-label").textContent = "Error connecting to chat server!";
	};

	ws.onclose = () => console.log("connection closed!");
}

/** 
 * @param {HTMLDivElement} messageElement
 */
const appendMessage = messageElement => document.getElementById("messages-view").appendChild(messageElement);

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
	if (username === clientUsername) {
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

	if (username === clientUsername) {
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
	clientUsername = document.getElementById("username-input").value;

	if (!clientUsername.trim()) {
		document.getElementById("error-label").textContent = "Error: username cannot be empty!";
		return;
	}

	ws.send(`{"type":0,"username":"${clientUsername}"}`);
}

function sendMessage() {
	const inputElement = document.getElementById("message-input");
	const messageContent = inputElement.value;
	inputElement.value = "";
	if (!messageContent.trim()) return;
	ws.send(`{"type":1,"content":"${messageContent}"}`);
}

function leaveChat() {
	ws.send(`{"type":2}`);
}
