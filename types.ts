export enum ChatEventType {
	USER_JOIN,
	USER_MESSAGE,
	USER_LEAVE,
	USER_TYPING,
	USER_STOPPED_TYPING,
}

export enum ErrorType {
	USERNAME_TAKEN,
	NO_USERNAME
}

export interface UserJoinEvent {
	type: ChatEventType.USER_JOIN;
	username: string;
}

export interface UserLeaveEvent {
	type: ChatEventType.USER_LEAVE;
	username?: string;
}

export interface UserMessageEvent {
	type: ChatEventType.USER_MESSAGE;
	sender?: string;
	content: string;
}

export interface UserTypingEvent {
	type: ChatEventType.USER_TYPING;
	username?: string;
}

export interface UserStoppedTypingEvent {
	type: ChatEventType.USER_STOPPED_TYPING;
	username?: string;
}

export type ChatEvent = UserJoinEvent | UserMessageEvent | UserLeaveEvent | UserTypingEvent | UserStoppedTypingEvent;

export interface ErrorEvent {
	error: true;
	type: ErrorType;
}

export type Event = ChatEvent | ErrorEvent;
