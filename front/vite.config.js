import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Écoute sur toutes les interfaces réseau
    port: 5714,      // Vous pouvez aussi spécifier un port fixe (optionnel)
  }
})
