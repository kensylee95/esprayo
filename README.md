start cloudflared dev tunel web
cloudflared tunnel --config frontend-tunnel-config.yml run user-web

start cloudflared dev tunel api
cloudflared tunnel --config api-tunnel-config.yml run api

start api
cd apps/api
pnpm dev

start web 
cd apps/user-web
pnpm dev

for firebase json in env: use this in windows powershell `(Get-Content "path/to/google-service-json.json" -Raw) -replace '\s+', '' | Set-Clipboard`to trim spaces and put the json in one line
the output should be in clipboard just paste it in Env
