# Studio Lite — Publicação, configuração e segurança

## 1. Visão geral

O Studio Lite é um editor web estático. O fluxo recomendado é:

1. abrir o site;
2. criar/editar a cena;
3. salvar localmente;
4. exportar um JSON de backup;
5. validar o projeto;
6. quando houver um arquivo Roblox válido, usar RBXL → Roblox;
7. informar Universe ID, Place ID e a credencial de publicação;
8. publicar;
9. verificar a versão no Creator Dashboard/Roblox Studio.

> Importante: o navegador não deve ser tratado como um cofre de segredos. Tudo que é enviado ao navegador pode ser inspecionado pelo usuário.

## 2. Universe ID e Place ID

O Roblox usa dois identificadores diferentes:

- Universe ID: identifica a experiência/jogo.
- Place ID: identifica um lugar dentro da experiência.

O fluxo oficial de Place Publishing exige os dois.

### Como encontrar

No Creator Dashboard:

1. abra a experiência;
2. para o Universe ID, use a opção de copiar o Universe ID da experiência;
3. para o Place ID, abra a experiência e entre em Places/Lugares;
4. abra o lugar desejado;
5. o Place ID aparece na URL da página de configuração.

Documentação oficial:
https://create.roblox.com/docs/cloud/guides/usage-place-publishing
https://create.roblox.com/docs/cloud/auth/api-keys

## 3. Criar a Roblox Open Cloud API Key

No Creator Dashboard:

1. abra API Keys;
2. clique em Create API Key;
3. dê um nome, por exemplo STUDIO_LITE_PLACE_PUBLISH;
4. em Access Permissions, selecione o sistema necessário para publicação de Places;
5. restrinja a chave à experiência quando essa opção estiver disponível;
6. habilite somente a operação necessária, normalmente Write para o jogo selecionado;
7. copie a chave uma única vez para um local seguro.

Para Place Publishing, a documentação atual da Roblox indica a permissão universe-places e a operação Write para a experiência selecionada.

### Nunca faça

Não coloque a API Key em:

- index.html;
- app.js;
- style.css;
- README;
- GitHub;
- LocalStorage;
- código JavaScript público;
- screenshots;
- mensagens públicas.

Se uma chave real for publicada acidentalmente, revogue/rotacione-a imediatamente.

## 4. Publicação no Studio Lite

O Studio Lite usa o endpoint de Place Publishing:

POST https://apis.roblox.com/universes/v1/{universeId}/places/{placeId}/versions?versionType=Published

O arquivo pode ser:

- .rbxl → application/octet-stream
- .rbxlx → application/xml

Fluxo:

1. clique em RBXL → Roblox;
2. informe Universe ID;
3. informe Place ID;
4. selecione o arquivo Roblox;
5. informe a API Key;
6. envie;
7. aguarde a resposta;
8. confira a versão no Creator Dashboard ou no Roblox Studio.

O Studio Lite não deve fingir que um JSON comum é um .rbxl binário válido. Para uma publicação real, use um arquivo Roblox compatível com o endpoint.

## 5. CORS e produção

Uma chamada direta do navegador para a Open Cloud pode depender das políticas CORS do ambiente.

Se a chamada direta funcionar no seu ambiente, a chave fica somente na memória durante o envio.

Para produção, a arquitetura mais segura é:

Frontend → seu backend/Worker → Roblox Open Cloud

O navegador nunca recebe a chave permanente.

O backend deve:

1. receber o arquivo;
2. validar tamanho e extensão;
3. validar Universe/Place;
4. autenticar o usuário, se necessário;
5. ler a API Key de um Secret;
6. enviar para Roblox;
7. devolver somente o resultado necessário.

## 6. Cloudflare Pages / Workers

### Pages

Para uma versão puramente estática, o projeto pode ser publicado no Cloudflare Pages.

Arquivos principais:

- index.html
- style.css
- app.js

Não existe build obrigatório.

### Quando usar Worker

Use um Worker quando precisar de:

- segredo Roblox;
- proxy de publicação;
- validação de uploads;
- rate limit;
- autenticação;
- endpoints privados.

Segredos devem ficar em Workers Secrets / Variables e não no repositório.

## 7. Supabase

O Studio Lite usa Supabase para recursos de colaboração/Party e persistência que foram configurados no projeto.

No frontend, use somente uma publishable key.

A chave secreta do Supabase nunca deve ir para o navegador.

Atualmente a documentação do Supabase recomenda:

- sb_publishable_... para código que roda no cliente;
- sb_secret_... somente para backend.

As antigas anon e service_role são legadas e estão em processo de substituição.

### Segurança obrigatória

As tabelas públicas precisam de RLS apropriado.

Nunca use uma chave secreta para resolver um problema de permissão do frontend.

## 8. Checklist antes de publicar

- [ ] Projeto salvo
- [ ] Backup JSON exportado
- [ ] Validação executada
- [ ] Diagnóstico executado
- [ ] Universe ID correto
- [ ] Place ID correto
- [ ] API Key criada para a experiência correta
- [ ] Permissão universe-places
- [ ] Operação Write
- [ ] Arquivo .rbxl/.rbxlx correto
- [ ] Nenhum segredo no GitHub
- [ ] Nenhuma chave no LocalStorage
- [ ] Se produção: segredo no backend/Worker
- [ ] Publicação conferida no Roblox

## 9. Diagnóstico integrado

Abra ? Ajuda → Diagnóstico.

O diagnóstico verifica:

- DOM principal;
- Three.js;
- WebGL ou fallback 2D;
- estado do projeto;
- seleção;
- referências Parent;
- IDs duplicados;
- LocalStorage;
- Code Studio;
- Party;
- Console;
- exportação;
- botão de publicação.

Também é possível abrir o Console e executar:

selftest

ou:

doctor

ou:

diagnose

## 10. Console

O Console é uma ferramenta de diagnóstico e operação.

Comandos principais:

- help
- selftest
- objects
- selected
- save
- validate
- play
- stop
- focus
- grid
- party
- clear

## 11. Backup e recuperação

Recomendação:

1. antes de uma alteração grande, exporte JSON;
2. mantenha pelo menos uma cópia fora do navegador;
3. use nomes como meu-jogo-2026-10-03.json;
4. só publique depois da validação.

O LocalStorage é útil para continuidade, mas não deve ser considerado um backup permanente.

## 12. Limites técnicos reais

O projeto foi desenhado para ser muito útil no celular e no navegador, mas existem limites que não devem ser escondidos:

- Luau é editado como código; não é executado como Roblox dentro do navegador.
- A física do Play Mode é uma simulação simplificada.
- MeshPart/Terrain no editor web não equivalem automaticamente à geometria/voxels reais do Roblox.
- Um RBXL binário completo não é fabricado fielmente pelo JavaScript do navegador.
- A publicação real depende das permissões da conta, do arquivo e da API Roblox.
- CORS pode exigir backend.
- Party depende do Supabase e de sua configuração.

## 13. Arquitetura recomendada para produção

### Frontend

Cloudflare Pages

- UI
- editor
- WebGL/fallback
- Code Studio
- Console

### Backend

Cloudflare Worker ou outro backend

- Roblox Open Cloud
- API Keys privadas
- validação de upload
- rate limiting
- autenticação

### Banco

Supabase

- projetos
- versões
- Party
- presença/realtime
- dados públicos com RLS

### Regra de segurança

Frontend = dados públicos + publishable keys.

Backend = segredos + operações privilegiadas.
