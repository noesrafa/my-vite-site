// OpenClaw Gateway Configuration
export const config = {
  // Gateway API endpoint
  gatewayUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:18789'
    : 'https://openclaw.soyrafa.dev',
  
  // Auth token (set via env, sessionStorage, or prompt)
  gatewayToken: import.meta.env.VITE_GATEWAY_TOKEN || 
                (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gatewayToken') : null) || 
                null,
  
  // UI settings
  ui: {
    refreshInterval: 5000,  // 5s
    maxMessages: 100,
    animationSpeed: 300     // ms
  }
};
