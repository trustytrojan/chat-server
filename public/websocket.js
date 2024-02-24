const // object types for the JSON objects going through the WebSocket
	USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOPPED_TYPING = 5;

/** @type {string} */
let username;

/** @type {number} */
let stopTypingTimeout;

// const ws = new WebSocket("wss://trustytrojan.dev/chat");
const ws = new WebSocket("ws://localhost:7000");

ws.onopen = startDialog.showModal.bind(startDialog);

ws.onmessage = ({ data }) => {
	const obj = JSON.parse(data.toString());
	switch (obj.type) {
		case USER_JOIN:
			if (obj.username === username) {
				startDialog.close();
				usernameLabel.innerHTML = `Your username: <b>${username}</b>`;
			}
			appendSystemMessage(`<b>${username}</b> has joined the chat`);
			break;

		case USER_MESSAGE:
			appendUserMessage(`<b>${obj.sender}</b><br>${obj.content}`);
			break;

		case USER_LEAVE:
			appendSystemMessage(`<b>${obj.username}</b> has left the chat`);
			if (obj.username === username) {
				ws.close(1000, "left the chat");
				hideInteractiveElements();
				document.body.appendChild(createElement("b", { innerHTML: "You have left the chat." }))
			}
			break;

		case USER_TYPING:
			if (obj.username === username) break;
			showTypingLabel();
			typingUsernames.appendChild(createElement("b", {
				id: `typing-${obj.username}`,
				innerHTML: obj.username,
				className: "typing-username"
			}));
			break;
		
		case USER_STOPPED_TYPING:
			const typingUsernameLabel = document.getElementById(`typing-${obj.username}`);
			if (typingUsernameLabel)
				typingUsernames.removeChild(typingUsernameLabel);
			if (typingUsernames.children.length == 0)
				hideTypingLabel();
			break;

		case ERR_USERNAME_TAKEN:
			errorLabel.textContent = "Error: username already taken!";
			break;
	}
};

ws.onerror = (ev) => { if (ev.type === "error") errorLabel.textContent = "Error connecting to chat server!"; };

ws.onclose = () => {
	hideInteractiveElements();
	document.body.appendChild(createElement("b", { innerHTML: "You were disconnected from the server." }));
};

/**
 * @param {number} type 
 * @param {object} obj 
 */
const sendChatData = (type, obj = {}) => ws.send(JSON.stringify({ type, ...obj }));

const stopTyping = () => {
	sendStoppedTyping();
	stopTypingTimeout = null;
};

const messageInputKeyDown = () => {
	if (event.key === "Enter") {
		clearTimeout(stopTypingTimeout);
		sendMessage();
		stopTyping();
	} else {
		if (stopTypingTimeout)
			clearTimeout(stopTypingTimeout);
		else
			sendTyping();
		stopTypingTimeout = setTimeout(stopTyping, 1_500);
	}
};

const joinChat = () => {
	username = usernameInput.value;
	if (!username.trim()) { errorLabel.textContent = "Error: username cannot be empty!"; return; }
	sendChatData(USER_JOIN, { username });
};

const sendMessage = () => {
	const content = messageInput.value;
	messageInput.value = "";
	if (!content.trim()) return;
	sendChatData(USER_MESSAGE, { content });
};

const sendTyping = () => sendChatData(USER_TYPING);
const sendStoppedTyping = () => sendChatData(USER_STOPPED_TYPING);
const leaveChat = () => sendChatData(USER_LEAVE);
