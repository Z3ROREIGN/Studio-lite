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


## Novidades da versão 4.2 PRO

- Botão **RBXL → Roblox** para abrir rapidamente o fluxo de publicação.
- Upload direto de `.rbxl` e `.rbxlx` para o Place escolhido.
- `.rbxl` importado é mantido na sessão e pode ser usado diretamente na publicação.
- Content-Type automático: `application/octet-stream` para RBXL e `application/xml` para RBXLX.
- Validação de extensão antes do envio.
- Exibição do arquivo selecionado e tamanho no fluxo de publicação.
- Publicação continua usando a API Key somente em memória, sem salvar a chave.

## Novidades da versão 4.0 PRO

- Primitivas 3D: Part, Sphere, Cylinder e Wedge
- Command Palette com Ctrl/⌘ K
- Navegação de câmera com teclas de seta
- Alternância visual do Grid
- Fullscreen com entrada e saída
- Autosave periódico e persistência de Grid/Snap
- Validação e normalização de projetos carregados
- Tratamento seguro de falha de WebGL
- Descarte de geometrias e materiais removidos
- Presets de formas preservados no JSON
- Toolbox expandida com novas primitivas

### Limites reais

Scripts Luau não são executados dentro do navegador, física/simulação Roblox não é reproduzida e um RBXL binário completo não pode ser fabricado com fidelidade apenas pelo JavaScript do navegador. O fluxo Open Cloud exige um .rbxl válido para publicação. Se o navegador bloquear a chamada Open Cloud por CORS, é necessário um backend ou proxy seguro.