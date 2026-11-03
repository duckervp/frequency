import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { ALL_ICONS } from './src/lib/icons'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // The icon font is requested with only the icons in src/lib/icons.ts (about 16 KB instead of 1 MB)
      name: 'material-symbols-subset',
      transformIndexHtml: (html) => html.replace('%MATERIAL_ICONS%', ALL_ICONS.join(',')),
    },
  ],

})
