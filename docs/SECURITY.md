# Studio Lite — Security Policy

## Nunca expor

- Roblox Open Cloud API Keys
- Supabase secret keys
- Supabase service_role legacy keys
- tokens de autenticação
- credenciais de backend
- senhas
- chaves privadas

## Pode aparecer no frontend

- HTML/CSS/JS
- identificadores públicos
- Supabase publishable key
- configurações não secretas

Mesmo uma chave publicável deve estar protegida por RLS e permissões corretas.

## Se um segredo vazar

1. revogue a chave;
2. crie uma nova;
3. remova o segredo do repositório;
4. procure cópias em commits antigos;
5. revise logs;
6. revise permissões;
7. atualize o backend.

Remover o segredo do arquivo atual não invalida automaticamente uma chave que já foi exposta.

## Regra de ouro

Se o navegador consegue ler uma variável, o usuário também consegue ler essa variável.

Para operações privilegiadas use:

Frontend → Backend → serviço externo

e mantenha o segredo somente no backend.
