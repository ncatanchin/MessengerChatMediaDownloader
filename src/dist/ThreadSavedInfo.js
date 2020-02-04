"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ThreadSavedInfo {
    constructor(lastTimestamp = null, name = null, messagesRead = 0, completed = false, messageCount = 0) {
        this.messagesRead = 0;
        // Needed in case new messages come between get history calls
        this.messageCount = 0;
        this.completed = false;
        this.lastTimestamp = lastTimestamp;
        this.name = name;
        this.messagesRead = messagesRead;
        this.completed = completed;
        this.messageCount = messageCount;
    }
}
exports.ThreadSavedInfo = ThreadSavedInfo;
//# sourceMappingURL=ThreadSavedInfo.js.map