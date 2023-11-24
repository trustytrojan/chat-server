/** @type {HTMLDivElement} */
let messagesView;

/** @type {HTMLDialogElement} */
let startDialog;

/** @type {HTMLInputElement} */
let usernameInput;

/** @type {HTMLInputElement} */
let messageInput;

/** @type {HTMLDivElement} */
let errorLabel;

/** @type {HTMLDivElement} */
let usernameLabel;

/** @type {HTMLButtonElement} */
let leaveChatButton;

/** @type {HTMLDivElement} */
let typingLabel;

/** @type {HTMLDivElement} */
let typingUsernames;

/**
 * Called immediately after creating and rendering the elements in `index.html`.
 */
const populateElementReferences = () => {
	messagesView = document.getElementById("messages-view");
	startDialog = document.getElementById("start-form");
	usernameInput = document.getElementById("username-input");
	messageInput = document.getElementById("message-input");
	errorLabel = document.getElementById("error-label");
	usernameLabel = document.getElementById("username-label");
	leaveChatButton = document.getElementById("leave-chat-button");
	typingLabel = document.getElementById("typing-label");
	typingUsernames = document.getElementById("typing-usernames");
};

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

const hideInteractiveElements = () => {
	messageInput.hidden = true;
	leaveChatButton.hidden = true;
};
