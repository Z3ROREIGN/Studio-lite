# Studio Lite

Editor 3D web inspirado no fluxo do Roblox Studio Lite, feito para funcionar diretamente no navegador.

## Stack

- HTML5
- CSS3
- JavaScript puro
- Three.js via CDN
- LocalStorage para persistência local

Não depende de Next.js, React, TypeScript, npm ou build step.

## Recursos

- Viewport 3D WebGL com iluminação e grid
- Seleção de Parts na cena
- Explorer com filtro
- Properties com nome, posição, rotação, escala, cor, material, Anchored e CanCollide
- Ferramentas Select, Move, Rotate e Scale
- Arrastar objetos diretamente na viewport
- Snap e grid configuráveis
- Duplicar, excluir, focar e vistas Home/Top/Front
- Undo/Redo com histórico
- Autosave local no navegador
- Play Mode visual
- Editor Luau integrado
- Importação de JSON e RBXLX
- Exportação de JSON e RBXLX
- Layout responsivo para celular
- Preparação de publicação via Roblox Open Cloud

## Como usar

Abra `index.html` em um servidor estático. Também funciona em hospedagens como Cloudflare Pages e GitHub Pages.

O projeto usa Three.js pelo CDN jsDelivr, portanto é necessária conexão com a internet para carregar a biblioteca.

## Publicação Roblox

A interface de publicação está preparada, mas uma API Key da Roblox **nunca deve ser colocada no JavaScript do navegador**.

Para publicação real, adicione um backend seguro em PHP ou outro servidor que receba o projeto e faça a chamada à Roblox Open Cloud. O frontend deve enviar somente os dados necessários ao endpoint.

## Formatos

### JSON
Formato nativo do Studio Lite. Preserva os objetos e propriedades suportados pelo editor.

### RBXLX
Exporta um DataModel XML simplificado com Workspace, Parts, SpawnLocation, CFrame, tamanho, Anchored e CanCollide.

A importação de RBXL binário não é feita no navegador; para isso é necessário um conversor/backend.

## Estrutura

```
index.html
style.css
app.js
README.md
```

## Segurança

Não coloque tokens, API Keys, service-role keys ou credenciais privadas em `app.js`.

O projeto foi estruturado para ser estático e simples de publicar.
