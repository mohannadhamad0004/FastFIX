# diagnosis module

Receives photo/video/audio uploads, calls the external AI provider, and stores the preliminary diagnosis plus the mechanic's confirmation or correction. This is the only module that talks to the AI provider, and no other module imports its provider code.

| File | Purpose |
| --- | --- |
| `diagnosis.routes.js` | Express router: URLs and which controller handles them |
| `diagnosis.controller.js` | Reads the request, calls the service, sends the response |
| `diagnosis.service.js` | Business logic |
| `diagnosis.model.js` | Database queries for this module |
| `ai-provider.js` | Wrapper around the external AI provider. Reads the API key from environment variables; the key never leaves the server |
