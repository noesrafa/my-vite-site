// Simple reactive state manager
class State {
  constructor() {
    this.agents = [];
    this.selectedAgent = null;
    this.messages = [];
    this.isLoading = false;
    this.error = null;
    this.listeners = new Set();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notify() {
    this.listeners.forEach(callback => callback(this));
  }

  /**
   * Update agents list
   */
  setAgents(agents) {
    this.agents = agents;
    this.notify();
  }

  /**
   * Select an agent
   */
  selectAgent(agent) {
    this.selectedAgent = agent;
    this.messages = [];
    this.notify();
  }

  /**
   * Get selected agent session key
   */
  getSelectedSessionKey() {
    if (!this.selectedAgent) return null;
    return this.selectedAgent.key || this.selectedAgent.sessionKey;
  }

  /**
   * Set messages for selected agent
   */
  setMessages(messages) {
    this.messages = messages;
    this.notify();
  }

  /**
   * Add new message
   */
  addMessage(message) {
    this.messages.push(message);
    this.notify();
  }

  /**
   * Set loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    this.notify();
  }

  /**
   * Set error
   */
  setError(error) {
    this.error = error;
    this.notify();
  }

  /**
   * Clear error
   */
  clearError() {
    this.error = null;
    this.notify();
  }
}

export const state = new State();
