# Studio Lite — Professional Web Editor

Editor 3D inspirado no Roblox Studio Lite, construído para rodar direto no navegador em celular e computador.

## Stack
HTML5, CSS3, JavaScript puro, Three.js via CDN e LocalStorage. Sem Next.js, React, TypeScript, npm ou build step.

## Interface profissional
- Layout desktop com Explorer + Viewport + Properties/Toolbox
- Modo retrato para celular
- Painéis laterais deslizantes no mobile
- Toolbar compacta e adaptável
- Fullscreen
- Câmera Home / Top / Front / Right
- Grid configurável e Snap
- Seleção visual e foco de câmera
- HUD, status, contador de objetos e atalhos
- Tema escuro profissional
- UI touch-friendly

## Editor 3D
- Part, SpawnLocation, Folder e Script
- Explorer com filtro
- Seleção por clique
- Move / Rotate / Scale
- Snap de transformação
- Duplicar / excluir / renomear
- Position / Rotation / Size
- Color
- Material: Plastic, Metal, Wood, Glass, Neon
- Transparency
- Anchored, CanCollide, Locked e Visible
- Undo / Redo
- Play Mode visual
- Editor Luau com numeração de linhas
- Autosave local

## Arquivos

Importação: JSON nativo, RBXLX XML simplificado e RBXL binário preservado como arquivo de publicação.

Exportação: JSON completo e RBXLX XML simplificado.

O navegador não gera um RBXL binário Roblox completo a partir do zero. A publicação de um Place real usa um arquivo .rbxl válido importado pelo usuário ou fornecido no diálogo de publicação.

## Publicar no Roblox

O botão Publicar possui fluxo para Roblox Open Cloud:

1. Informe o Universe ID.
2. Informe o Place ID.
3. Informe sua Roblox Open Cloud API Key.
4. Selecione um .rbxl ou use o .rbxl importado na sessão.
5. Clique em Enviar e Publicar.
6. O Studio Lite envia o arquivo ao endpoint de Place Publishing com versionType=Published.

A API Key digitada não é gravada no LocalStorage.

### CORS
Alguns ambientes podem bloquear chamadas diretas do navegador para a Open Cloud por CORS. Nessa situação, use um proxy/backend PHP seguro e mantenha a credencial no servidor.

Nunca coloque uma API Key permanente diretamente no código do repositório.

## Segurança
- A API Key de publicação fica somente na memória da página durante a publicação.
- Universe/Place ID podem ser lembrados separadamente.
- Não há segredo privado hardcoded em app.js.

## Hospedagem
Funciona em hospedagem estática, incluindo GitHub Pages e Cloudflare Pages.

O Three.js é carregado por CDN; é necessária internet para o motor 3D, a menos que a biblioteca seja hospedada localmente.

## Estrutura
index.html
style.css
app.js
README.md

## Status
A interface e o fluxo de publicação estão implementados em JavaScript puro. A conversão completa de RBXL binário, física real, colaboração multiplayer e publicação de cenas geradas do zero exigem serviços/conversores adicionais e não são simulados como se fossem recursos reais.
