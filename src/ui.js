// UI Components and rendering
import { state } from './state.js';
import { api } from './api.js';

/**
 * Render agents list
 */
export function renderAgentsList() {
  const container = document.getElementById('agents-list');
  if (!container) return;

  // Only show loading on first load (when we have no agents yet)
  if (state.isLoading && state.agents.length === 0) {
    container.innerHTML = '<div class="loading">Loading agents...</div>';
    return;
  }

  if (!state.isLoading && state.agents.length === 0) {
    container.innerHTML = '<div class="empty">No agents found</div>';
    return;
  }

  container.innerHTML = state.agents.map(agent => {
    const sessionKey = agent.key || agent.sessionKey;
    const label = agent.displayName || agent.label || sessionKey;
    const kind = agent.kind || 'unknown';
    const status = 'active'; // Assume active if we got it from the list
    
    return `
      <div class="agent-card ${state.selectedAgent?.key === sessionKey ? 'selected' : ''}" 
           data-session-key="${sessionKey}">
        <div class="agent-avatar">${getAgentEmoji(agent)}</div>
        <div class="agent-info">
          <h3>${label}</h3>
          <p class="agent-kind">${kind}</p>
          <span class="agent-status status-${status}">${status}</span>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  container.querySelectorAll('.agent-card').forEach(card => {
    card.addEventListener('click', () => {
      const sessionKey = card.dataset.sessionKey;
      const agent = state.agents.find(a => (a.key || a.sessionKey) === sessionKey);
      if (agent) {
        handleAgentSelect(agent);
      }
    });
  });
}

/**
 * Render chat interface
 */
export function renderChat() {
  const container = document.getElementById('chat-container');
  if (!container) return;

  if (!state.selectedAgent) {
    container.innerHTML = '<div class="empty">Select an agent to start chatting</div>';
    return;
  }

  const messagesHtml = state.messages.map(msg => {
    // Extract text content from message
    let textContent = '';
    if (typeof msg.content === 'string') {
      textContent = msg.content;
    } else if (Array.isArray(msg.content)) {
      // Content is array of blocks (Anthropic format)
      const textBlocks = msg.content.filter(block => block.type === 'text');
      textContent = textBlocks.map(block => block.text).join('\n');
    } else if (msg.content?.text) {
      textContent = msg.content.text;
    }
    
    return `
      <div class="message message-${msg.role}">
        <div class="message-header">
          <span class="message-role">${msg.role}</span>
          <span class="message-time">${formatTime(msg.timestamp)}</span>
        </div>
        <div class="message-content">${escapeHtml(textContent)}</div>
      </div>
    `;
  }).join('');

  const sessionKey = state.selectedAgent.key || state.selectedAgent.sessionKey;
  const label = state.selectedAgent.displayName || state.selectedAgent.label || sessionKey;
  
  container.innerHTML = `
    <div class="chat-header">
      <h2>${label}</h2>
      <button id="refresh-chat" class="btn-icon">🔄</button>
    </div>
    <div class="messages-container" id="messages">
      ${messagesHtml || '<div class="empty">No messages yet</div>'}
    </div>
    <div class="chat-input">
      <input type="text" id="message-input" placeholder="Type a message..." />
      <button id="send-message" class="btn-primary">Send</button>
    </div>
  `;

  // Scroll to bottom
  const messagesDiv = document.getElementById('messages');
  if (messagesDiv) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Add event listeners
  document.getElementById('send-message')?.addEventListener('click', handleSendMessage);
  document.getElementById('message-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });
  document.getElementById('refresh-chat')?.addEventListener('click', () => {
    if (state.selectedAgent) {
      const sessionKey = state.selectedAgent.key || state.selectedAgent.sessionKey;
      loadAgentHistory(sessionKey);
    }
  });
}

/**
 * Handle agent selection
 */
async function handleAgentSelect(agent) {
  state.selectAgent(agent);
  renderAgentsList();
  renderChat();
  
  const sessionKey = agent.key || agent.sessionKey;
  await loadAgentHistory(sessionKey);
}

/**
 * Load agent history
 */
async function loadAgentHistory(sessionKey) {
  try {
    state.setLoading(true);
    const result = await api.getHistory(sessionKey);
    
    if (result?.messages) {
      state.setMessages(result.messages);
      renderChat();
    }
  } catch (error) {
    state.setError(`Failed to load history: ${error.message}`);
  } finally {
    state.setLoading(false);
  }
}

/**
 * Handle send message
 */
async function handleSendMessage() {
  const input = document.getElementById('message-input');
  if (!input || !input.value.trim() || !state.selectedAgent) return;

  const message = input.value.trim();
  input.value = '';

  try {
    // Add user message immediately
    state.addMessage({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    renderChat();

    // Send to API
    const sessionKey = state.selectedAgent.key || state.selectedAgent.sessionKey;
    const result = await api.sendMessage(sessionKey, message);
    
    // Add assistant response
    if (result?.reply) {
      state.addMessage({
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString()
      });
      renderChat();
    }
  } catch (error) {
    state.setError(`Failed to send message: ${error.message}`);
    renderError();
  }
}

/**
 * Render error toast
 */
export function renderError() {
  if (!state.error) return;

  const existing = document.getElementById('error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'error-toast';
  toast.className = 'error-toast';
  toast.textContent = state.error;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    state.clearError();
  }, 5000);
}

/**
 * Get emoji for agent type
 */
function getAgentEmoji(agent) {
  const label = agent.displayName || agent.label || '';
  const key = agent.key || agent.sessionKey || '';
  
  if (label.toLowerCase().includes('jarvis') || key.includes('main')) return '😸';
  if (agent.kind === 'main') return '👑';
  if (agent.kind === 'isolated') return '🤖';
  return '👤';
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
