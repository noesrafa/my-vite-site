// OpenClaw Agent Viewer - Main Entry Point
import './style.css';
import { state } from './state.js';
import { api } from './api.js';
import { renderAgentsList, renderChat, renderError } from './ui.js';
import { config } from './config.js';

/**
 * Initialize app
 */
async function init() {
  console.log('🎮 OpenClaw Agent Viewer starting...');
  
  // Check for token
  if (!config.gatewayToken) {
    promptForToken();
    return;
  }

  // Subscribe to state changes
  state.subscribe(() => {
    renderAgentsList();
    renderChat();
    renderError();
  });

  // Load initial data
  await loadAgents();

  // Setup auto-refresh
  setInterval(loadAgents, config.ui.refreshInterval);

  console.log('✅ Agent Viewer ready!');
}

/**
 * Load agents from Gateway
 */
async function loadAgents() {
  try {
    state.setLoading(true);
    const response = await api.getSessions();
    
    if (response.ok && response.result?.sessions) {
      state.setAgents(response.result.sessions);
    } else {
      throw new Error('Invalid response from Gateway');
    }
  } catch (error) {
    console.error('Failed to load agents:', error);
    state.setError(`Failed to load agents: ${error.message}`);
  } finally {
    state.setLoading(false);
  }
}

/**
 * Prompt user for Gateway token
 */
function promptForToken() {
  const container = document.getElementById('app');
  container.innerHTML = `
    <div class="token-prompt">
      <h1>🔐 OpenClaw Agent Viewer</h1>
      <p>Enter your Gateway token to continue:</p>
      <input type="password" id="token-input" placeholder="Gateway token" />
      <button id="token-submit" class="btn-primary">Connect</button>
      <p class="help-text">
        Find your token in: <code>~/.openclaw/openclaw.json</code><br>
        Look for: <code>gateway.auth.token</code>
      </p>
    </div>
  `;

  document.getElementById('token-submit')?.addEventListener('click', () => {
    const input = document.getElementById('token-input');
    const token = input?.value.trim();
    
    if (token) {
      config.gatewayToken = token;
      api.token = token;
      
      // Store in sessionStorage (not localStorage for security)
      sessionStorage.setItem('gatewayToken', token);
      
      // Restart app
      location.reload();
    }
  });
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
