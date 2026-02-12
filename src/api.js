// OpenClaw Gateway API Client
import { config } from './config.js';

class OpenClawAPI {
  constructor() {
    this.baseUrl = config.gatewayUrl;
    this.token = config.gatewayToken;
  }

  /**
   * Make authenticated request to Gateway
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Get list of sessions (agents)
   */
  async getSessions(limit = 50) {
    return await this.request(`${config.endpoints.sessions}?limit=${limit}`);
  }

  /**
   * Get session history
   */
  async getHistory(sessionKey, limit = 100) {
    return await this.request(config.endpoints.sessionHistory(sessionKey) + `?limit=${limit}`);
  }

  /**
   * Send message to session
   */
  async sendMessage(sessionKey, message, timeoutSeconds = 60) {
    return await this.request(config.endpoints.sessionSend(sessionKey), {
      method: 'POST',
      body: JSON.stringify({
        message,
        timeoutSeconds
      })
    });
  }

  /**
   * Get session status
   */
  async getStatus(sessionKey) {
    return await this.request(config.endpoints.sessionStatus(sessionKey));
  }

  /**
   * Spawn new sub-agent
   */
  async spawnAgent(task, options = {}) {
    return await this.request(config.endpoints.sessionSpawn, {
      method: 'POST',
      body: JSON.stringify({
        task,
        label: options.label,
        model: options.model,
        agentId: options.agentId || 'default',
        runTimeoutSeconds: options.runTimeoutSeconds,
        cleanup: options.cleanup || 'keep'
      })
    });
  }
}

export const api = new OpenClawAPI();
