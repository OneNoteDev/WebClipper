export abstract class MessageHandler {
	/*
	 * The handler object for incoming messages.
	 * Each implementation has its own handler signature.
	 */
	protected messageHandler: any;

	/*
	 * Initializes the handler object for incoming messages
	 */
	protected abstract initMessageHandler(): void;

	/*
	 * Sends information to another MessageHandler
	 */
	public abstract sendMessage(data: string): void;

	/*
	 * The handler is no longer needed, do any cleanup
	 */
	public abstract tearDown(): void;

	/*
	 * Event handler that the Communicator uses to know when this MessageHandler received a message
	 */
	public onMessageReceived(data: string) {
		// This method is overwritten by the parent Communicator
		// Should be called when this MessageHandler receives a message
	}
}
