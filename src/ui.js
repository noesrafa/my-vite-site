// UI Components and rendering
import { state } from './state.js';
import { api } from './api.js';

/**
 * Render agents list
 */
export function renderAgentsList() {
  const container = document.getElementById('agents-list');
  if (!container) return;

  if (state.isLoading) {
    container.innerHTML = '<div class="loading">Loading agents...</div>';
    return;
  }

  if (state.agents.length === 0) {
    container.innerHTML = '<div class="empty">No agents found</div>';
    return;
  }

  container.innerHTML = state.agents.map(agent => `
    <div class="agent-card ${state.selectedAgent?.sessionKey === agent.sessionKey ? 'selected' : ''}" 
         data-session-key="${agent.sessionKey}">
      <div class="agent-avatar">${getAgentEmoji(agent)}</div>
      <div class="agent-info">
        <h3>${agent.label || agent.sessionKey}</h3>
        <p class="agent-kind">${agent.kind}</p>
        <span class="agent-status status-${agent.status || 'unknown'}">${agent.status || 'unknown'}</span>
      </div>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.agent-card').forEach(card => {
    card.addEventListener('click', () => {
      const sessionKey = card.dataset.sessionKey;
      const agent = state.agents.find(a => a.sessionKey === sessionKey);
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

  const messagesHtml = state.messages.map(msg => `
    <div class="message message-${msg.role}">
      <div class="message-header">
        <span class="message-role">${msg.role}</span>
        <span class="message-time">${formatTime(msg.timestamp)}</span>
      </div>
      <div class="message-content">${escapeHtml(msg.content)}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="chat-header">
      <h2>${state.selectedAgent.label || state.selectedAgent.sessionKey}</h2>
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
      loadAgentHistory(state.selectedAgent.sessionKey);
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
  
  await loadAgentHistory(agent.sessionKey);
}

/**
 * Load agent history
 */
async function loadAgentHistory(sessionKey) {
  try {
    state.setLoading(true);
    const response = await api.getHistory(sessionKey);
    
    if (response.ok && response.result?.messages) {
      state.setMessages(response.result.messages);
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
    const response = await api.sendMessage(state.selectedAgent.sessionKey, message);
    
    // Add assistant response
    if (response.ok && response.result?.reply) {
      state.addMessage({
        role: 'assistant',
        content: response.result.reply,
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
  if (agent.label?.toLowerCase().includes('jarvis')) return '😸';
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
