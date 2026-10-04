# Studio Lite Web

Editor web profissional inspirado no fluxo de criação do Roblox Studio Lite.

## Base atual
- Editor 3D WebGL com Explorer e Properties.
- Projetos persistentes no Supabase quando o servidor está configurado.
- Pipeline inicial para .rbxl/.rbxlx.
- Arquitetura preparada para Roblox Open Cloud.
- Segredos somente no servidor.

## Variáveis do servidor
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
STUDIO_ENCRYPTION_KEY

Nunca coloque uma Roblox API Key em NEXT_PUBLIC_*.

## Próximos módulos
Importação completa do DataModel, scripts Luau, versionamento, validação e publicação via Place Publishing API.