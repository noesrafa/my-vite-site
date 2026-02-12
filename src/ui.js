// UI Components and rendering
import { state } from './state.js';
import { api } from './api.js';
import { marked } from 'marked';

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
    const agentId = extractAgentId(sessionKey);
    const label = getAgentName(agentId, sessionKey);
    const kind = agent.kind || 'unknown';
    const status = 'active'; // Assume active if we got it from the list
    
    return `
      <div class="agent-card ${state.selectedAgent?.key === sessionKey ? 'selected' : ''}" 
           data-session-key="${sessionKey}">
        <div class="agent-avatar">${getAgentEmoji(agent, agentId)}</div>
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

  const messagesHtml = state.messages
    .map(msg => {
      // Extract text and media content from message
      let textContent = '';
      let mediaItems = [];
      
      if (typeof msg.content === 'string') {
        textContent = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Content is array of blocks (Anthropic format)
        msg.content.forEach(block => {
          if (block.type === 'text') {
            textContent += block.text + '\n';
          } else if (block.type === 'image') {
            // Extract image source from text content or block
            mediaItems.push({ type: 'image', data: block });
          }
        });
      } else if (msg.content?.text) {
        textContent = msg.content.text;
      }
      
      // Check if text contains MEDIA: references
      const mediaRegex = /MEDIA:\s*([^\s]+\.(png|jpg|jpeg|gif|webp))/gi;
      let match;
      while ((match = mediaRegex.exec(textContent)) !== null) {
        mediaItems.push({ type: 'image', url: match[1] });
        // Remove MEDIA: reference from text
        textContent = textContent.replace(match[0], '');
      }
      
      // Also check for inline filenames (filename.png format)
      const filenameRegex = /([a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp))/g;
      const possibleFiles = textContent.match(filenameRegex);
      if (possibleFiles && possibleFiles.length > 0) {
        // Only add if it looks like a standalone filename (not in a sentence)
        possibleFiles.forEach(filename => {
          const regex = new RegExp(`(?:^|\\s)(${filename})(?:\\s|$)`, 'g');
          if (regex.test(textContent)) {
            // Use /media/ path for web access
            mediaItems.push({ type: 'image', url: `/media/${filename}` });
            // Remove filename from text content
            textContent = textContent.replace(filename, '');
          }
        });
      }
      
      textContent = textContent.trim();
      
      // Skip messages with no text content (thinking, tool calls, etc.)
      if (!textContent || textContent.trim().length === 0) {
        if (mediaItems.length === 0) return null;
      }
      
      // Render markdown to HTML
      const htmlContent = textContent ? marked.parse(textContent) : '';
      
      // Build media HTML
      const mediaHtml = mediaItems.map(item => {
        if (item.type === 'image') {
          const src = item.url || item.data?.source || '';
          return `<img src="${src}" alt="Image" class="message-image" />`;
        }
        return '';
      }).join('');
      
      return `
        <div class="message message-${msg.role}">
          <div class="message-header">
            <span class="message-role">${msg.role}</span>
            <span class="message-time">${formatTime(msg.timestamp)}</span>
          </div>
          <div class="message-content">${htmlContent}</div>
          ${mediaHtml ? `<div class="message-media">${mediaHtml}</div>` : ''}
        </div>
      `;
    })
    .filter(html => html !== null)
    .join('');

  const sessionKey = state.selectedAgent.key || state.selectedAgent.sessionKey;
  const agentId = extractAgentId(sessionKey);
  const label = getAgentName(agentId, sessionKey);
  
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
    const result = await api.getHistory(sessionKey, 100); // Load more messages
    
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
 * Extract agent ID from session key
 * Format: agent:<agentId>:<mainKey>
 */
function extractAgentId(sessionKey) {
  if (!sessionKey) return null;
  const parts = sessionKey.split(':');
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Get friendly agent name from agentId
 */
function getAgentName(agentId, fallback) {
  const nameMap = {
    'main': 'Jarvis',
    'cleo': 'Cleo'
  };
  
  if (agentId && nameMap[agentId]) {
    return nameMap[agentId];
  }
  
  // Capitalize agentId if available
  if (agentId) {
    return agentId.charAt(0).toUpperCase() + agentId.slice(1);
  }
  
  return fallback || 'Unknown Agent';
}

/**
 * Get emoji for agent
 */
function getAgentEmoji(agent, agentId) {
  const emojiMap = {
    'main': '😸',
    'cleo': '🎨'
  };
  
  if (agentId && emojiMap[agentId]) {
    return emojiMap[agentId];
  }
  
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
