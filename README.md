# 🎮 OpenClaw Agent Viewer

Un dashboard interactivo para visualizar y controlar tus agentes de OpenClaw.

## ✨ Features

- 📊 **Vista en tiempo real** de todos tus agentes (main, isolated, subprocess)
- 💬 **Chat directo** con cualquier agente
- 🔄 **Auto-refresh** cada 5 segundos
- 🎨 **UI estilo gaming** con tema cyberpunk
- 🔐 **Autenticación segura** con token de Gateway

## 🚀 Stack Tecnológico

- **Frontend**: Vite + Vanilla JavaScript
- **Estilos**: CSS puro (sin dependencias)
- **API**: OpenClaw Gateway REST API
- **Deploy**: nginx + SSL (Let's Encrypt)

## 📁 Estructura del Proyecto

```
my-vite-site/
├── src/
│   ├── main.js       # Entry point
│   ├── config.js     # Configuración
│   ├── api.js        # Cliente API Gateway
│   ├── state.js      # State management
│   ├── ui.js         # Componentes UI
│   └── style.css     # Estilos
├── index.html
├── package.json
└── README.md
```

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Dev server
npm run dev

# Build para producción
npm run build
```

## 🌐 Producción

**URL**: https://openclaw.soyrafa.dev

**Configuración nginx**:
- Static files en `/var/www/html/`
- API proxy a `localhost:18789`
- SSL automático con Let's Encrypt

**Deploy**:
```bash
npm run build
cp -r dist/* /var/www/html/
systemctl reload nginx
```

## 🔐 Autenticación

Al abrir la app por primera vez, te pedirá el token de Gateway:

```bash
# Encontrar tu token
cat ~/.openclaw/openclaw.json | jq '.gateway.auth.token'
```

El token se guarda en `sessionStorage` (por sesión, más seguro que localStorage).

## 📡 API Endpoints Usados

- `GET /api/sessions` - Listar agentes
- `GET /api/sessions/:key/history` - Historial
- `POST /api/sessions/:key/send` - Enviar mensaje
- `POST /api/sessions/spawn` - Crear sub-agent

## 🎯 Roadmap

### Phase 1: MVP ✅ (Completado)
- [x] API client funcional
- [x] Lista de agentes
- [x] Chat interface
- [x] Auto-refresh
- [x] Deploy con SSL

### Phase 2: Gaming UI (Próximamente)
- [ ] Vista isométrica 3D
- [ ] Agentes como personajes
- [ ] Animaciones de estado
- [ ] Efectos visuales

### Phase 3: Features Avanzadas
- [ ] WebSocket real-time
- [ ] Crear sub-agents desde UI
- [ ] Dashboard con stats
- [ ] Gráficos de uso

### Phase 4: Polish
- [ ] Responsive design
- [ ] Temas personalizables
- [ ] Sonidos y música
- [ ] Easter eggs

## 💡 Notas Técnicas

- **Security**: Token nunca expuesto en código, solo en sessionStorage
- **CORS**: Proxy nginx maneja todo, sin issues de CORS
- **Performance**: Polling cada 5s, optimizable con WebSocket
- **Responsive**: Desktop-first, mobile simplificado

---

Made with 😸 by rafiña & Jarvis
