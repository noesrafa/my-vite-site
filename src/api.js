// OpenClaw Gateway API Client
import { config } from './config.js';

class OpenClawAPI {
  constructor() {
    this.baseUrl = config.gatewayUrl;
    this.token = config.gatewayToken;
  }

  /**
   * Invoke a tool via Gateway /tools/invoke endpoint
   */
  async invokeTool(tool, args = {}, action = null) {
    const url = `${this.baseUrl}/tools/invoke`;
    
    const body = {
      tool,
      args,
      ...(action && { action })
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid token');
        }
        if (response.status === 404) {
          throw new Error(`Tool '${tool}' not available`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error?.message || 'Tool invocation failed');
      }

      // Return parsed details if available, otherwise raw result
      return data.result?.details || data.result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Get list of sessions (agents)
   */
  async getSessions(limit = 50) {
    return await this.invokeTool('sessions_list', { limit });
  }

  /**
   * Get session history
   */
  async getHistory(sessionKey, limit = 100) {
    return await this.invokeTool('sessions_history', {
      sessionKey,
      limit
    });
  }

  /**
   * Send message to session
   */
  async sendMessage(sessionKey, message, timeoutSeconds = 60) {
    return await this.invokeTool('sessions_send', {
      sessionKey,
      message,
      timeoutSeconds
    });
  }

  /**
   * Get session status
   */
  async getStatus(sessionKey) {
    return await this.invokeTool('session_status', {
      sessionKey
    });
  }

  /**
   * Spawn new sub-agent
   */
  async spawnAgent(task, options = {}) {
    return await this.invokeTool('sessions_spawn', {
      task,
      label: options.label,
      model: options.model,
      agentId: options.agentId || 'default',
      runTimeoutSeconds: options.runTimeoutSeconds,
      cleanup: options.cleanup || 'keep'
    });
  }
}

export const api = new OpenClawAPI();
