class BaseProvider {
  constructor(settings) {
    this.settings = settings;
  }

  formatTools(_canonicalTools) {
    throw new Error('formatTools() must be implemented');
  }

  formatMessages(_messages) {
    throw new Error('formatMessages() must be implemented');
  }

  chat(_messages, _tools) {
    throw new Error('chat() must be implemented');
  }

  formatToolResult(_callId, _name, _result) {
    throw new Error('formatToolResult() must be implemented');
  }

  async *chatStream(_messages, _tools) {
    throw new Error('chatStream() not implemented for this provider');
  }
}

module.exports = BaseProvider;
