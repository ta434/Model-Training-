import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {execSync} from 'child_process';
import {defineConfig, Plugin} from 'vite';

function gitPushApiPlugin(): Plugin {
  return {
    name: 'git-push-api',
    configureServer(server) {
      server.middlewares.use('/api/github-push', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const token = data.token ? data.token.trim() : '';
            const repoUrl = data.repoUrl ? data.repoUrl.trim() : 'https://github.com/ta434/Amazon-ml-challenge-2-';

            if (!token) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'GitHub Personal Access Token is required to authenticate push.' }));
              return;
            }

            // Extract repo path e.g. ta434/Amazon-ml-challenge-2-
            const cleanRepo = repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
            const authenticatedUrl = `https://${token}@github.com/${cleanRepo}.git`;

            // Commit any untracked or modified files first
            execSync('git config user.name "AI Studio Engineer" && git config user.email "engineer@aistudio.build"', { cwd: __dirname });
            execSync('git add -A && git commit -m "feat: complete production entity resolution model & pipeline" || true', { cwd: __dirname });
            execSync('git branch -M main', { cwd: __dirname });
            execSync(`git remote set-url origin ${authenticatedUrl} || git remote add origin ${authenticatedUrl}`, { cwd: __dirname });

            const pushOutput = execSync('git push -u origin main --force', {
              cwd: __dirname,
              encoding: 'utf-8',
              timeout: 30000
            });

            // Sanitize remote url in git config so token is not saved permanently
            try {
              execSync(`git remote set-url origin https://github.com/${cleanRepo}.git`, { cwd: __dirname });
            } catch {}

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: `Successfully pushed branch 'main' to https://github.com/${cleanRepo}`,
              output: pushOutput
            }));
          } catch (err: any) {
            // Clean token from error message if present
            const safeError = (err.message || String(err)).replace(/https:\/\/[^@]+@/g, 'https://***@');
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: safeError,
              output: err.stdout ? String(err.stdout) : '',
              stderr: err.stderr ? String(err.stderr).replace(/https:\/\/[^@]+@/g, 'https://***@') : ''
            }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gitPushApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
