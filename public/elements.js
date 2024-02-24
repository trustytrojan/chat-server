/** @type {HTMLDivElement} */
const messagesView = document.getElementById("messages-view");

/** @type {HTMLDialogElement} */
const startDialog = document.getElementById("start-form");

/** @type {HTMLInputElement} */
const usernameInput = document.getElementById("username-input");

/** @type {HTMLInputElement} */
const messageInput = document.getElementById("message-input");

/** @type {HTMLDivElement} */
const errorLabel = document.getElementById("error-label");

/** @type {HTMLDivElement} */
const usernameLabel = document.getElementById("username-label");

/** @type {HTMLButtonElement} */
const leaveChatButton = document.getElementById("leave-chat-button");

/** @type {HTMLDivElement} */
const typingLabel = document.getElementById("typing-label");

/** @type {HTMLDivElement} */
const typingUsernames = document.getElementById("typing-usernames");

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
