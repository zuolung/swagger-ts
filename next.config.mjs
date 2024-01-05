import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  sassOptions: {
    includePaths: [path.join(__dirname, './pages')],
  },
  server: {  
    port: process.env.PORT || 4444,
  },  
}

export default config