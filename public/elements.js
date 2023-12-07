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
 * @param {keyof HTMLElementTagNameMap} tagName
 * @param {{
 *     className: string | undefined,
 *     innerHTML: string | undefined,
 *     id: string | undefined,
 *     style: CSSStyleDeclaration | undefined,
 *     appendStyles: CSSStyleDeclaration | undefined
 * }}
 */
const createElement = (tagName, { className, innerHTML, id, style }) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (innerHTML) element.innerHTML = innerHTML;
	if (id) element.id = id;
	if (style) for (const k in element.style) element.style[k] = style[k];
	return element;
};

const hideInteractiveElements = () => {
	messageInput.hidden = true;
	leaveChatButton.hidden = true;
};

/** 
 * @param {HTMLDivElement} messageElement
 */
const appendMessage = (messageElement) => messagesView.appendChild(messageElement);

/**
 * @param {string} innerHTML 
 */
const appendUserMessage = (innerHTML) => appendMessage(createElement("div", { className: "user-message", innerHTML }));

/**
 * @param {string} innerHTML 
 */
const appendSystemMessage = (innerHTML) => appendMessage(createElement("div", { className: "system-message", innerHTML }));

const showTypingLabel = () => typingLabel.style.display = "inline";
const hideTypingLabel = () => typingLabel.style.display = "none";
