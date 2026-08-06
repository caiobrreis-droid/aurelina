# Moldura — Deputada Aurelina Medeiros

Página web responsiva que permite ao usuário tirar uma foto com a câmera do celular ou computador e receber a imagem final com a moldura personalizada da Deputada Aurelina Medeiros.

---

## 📁 Estrutura do projeto

```
moldura-aurelina/
├── index.html          # Página principal
├── style.css           # Estilos visuais
├── script.js           # Lógica da aplicação
├── assets/
│   └── moldura.png     # ← Coloque aqui a moldura PNG com fundo transparente
└── README.md           # Este arquivo
```

---

## 🖼️ Como adicionar a moldura

1. Prepare a imagem da moldura no formato **PNG com fundo transparente**.
2. A resolução ideal é **1080 × 1350 pixels** (proporção 4:5, formato Instagram).
3. Salve o arquivo como `moldura.png` dentro da pasta `assets/`.
4. O caminho final deve ser: `assets/moldura.png`.

> **Importante:** a moldura é desenhada *por cima* da foto. As áreas transparentes do PNG revelarão o rosto da pessoa.

---

## 🚀 Como executar localmente

### Opção 1 — Extensão Live Server (VS Code)

1. Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
2. Abra a pasta do projeto no VS Code.
3. Clique com o botão direito em `index.html` → **Open with Live Server**.
4. O navegador abrirá automaticamente em `http://127.0.0.1:5500`.

### Opção 2 — Servidor Python

```bash
# Python 3
cd moldura-aurelina
python -m http.server 8080

# Acesse: http://localhost:8080
```

### Opção 3 — Servidor Node.js

```bash
npx -y serve .
```

> ⚠️ **HTTPS:** O acesso à câmera exige conexão segura. `localhost` e `127.0.0.1` funcionam sem HTTPS. Para acessar em outros dispositivos na rede local, será necessário HTTPS.

---

## 🎨 Como alterar as cores

Edite as variáveis CSS no início do arquivo `style.css`:

```css
:root {
    --cor-primaria: #123b73;        /* Azul institucional */
    --cor-secundaria: #f4c542;      /* Amarelo/dourado */
    --cor-fundo: #f5f7fb;           /* Fundo da página */
    --cor-texto: #172033;           /* Texto principal */
}
```

---

## 📐 Como alterar a proporção da imagem final

Edite as constantes no início do arquivo `script.js`:

```javascript
const CONFIG = {
    LARGURA_FINAL: 1080,
    ALTURA_FINAL: 1350,   // ← Altere aqui
    // ...
};
```

| Proporção | Largura | Altura | Uso recomendado         |
|-----------|---------|--------|-------------------------|
| 4:5       | 1080    | 1350   | Feed do Instagram       |
| 1:1       | 1080    | 1080   | Feed quadrado           |
| 9:16      | 1080    | 1920   | Stories / Reels / TikTok|

> **Lembre-se** de ajustar a moldura PNG para a mesma proporção.

---

## ✏️ Como alterar textos

Os textos estão diretamente no arquivo `index.html`. Busque e altere:

- **Nome:** `Deputada Aurelina Medeiros`
- **Título:** `Registre este momento`
- **Subtítulo:** `Tire uma foto com a nossa moldura...`
- **Nome do arquivo de download:** no `script.js`, campo `NOME_ARQUIVO`

---

## 🌐 Como publicar (deploy)

### GitHub Pages

1. Crie um repositório no GitHub.
2. Faça push de todos os arquivos.
3. Vá em **Settings → Pages → Source → main / root**.
4. O site estará em `https://seuusuario.github.io/nome-do-repo/`.

### Netlify

1. Acesse [netlify.com](https://www.netlify.com).
2. Arraste a pasta do projeto para a área de deploy.
3. Pronto! Você receberá uma URL com HTTPS.

### Vercel

```bash
npx -y vercel --prod
```

### Railway

1. Crie um projeto em [railway.app](https://railway.app).
2. Conecte o repositório Git.
3. Deploy automático com HTTPS.

---

## 📱 Compatibilidade

| Navegador           | Status |
|---------------------|--------|
| Google Chrome       | ✅     |
| Microsoft Edge      | ✅     |
| Safari (iPhone)     | ✅     |
| Chrome (Android)    | ✅     |
| Samsung Internet    | ✅     |
| Firefox             | ✅     |

---

## 🔒 Privacidade

- Nenhuma foto é enviada para servidores.
- Todo o processamento ocorre no dispositivo do usuário.
- A câmera é desligada ao sair da tela de captura.
- Nenhum dado pessoal é coletado.

---

## 📋 Funcionalidades

- [x] Captura de foto com câmera frontal ou traseira
- [x] Moldura PNG sobreposta em tempo real
- [x] Imagem final em alta resolução (1080 × 1350)
- [x] Download da foto com moldura
- [x] Compartilhamento via Web Share API
- [x] Efeito de flash ao capturar
- [x] Espelhamento correto da câmera frontal
- [x] Tratamento de erros amigável
- [x] Design responsivo (mobile-first)
- [x] Suporte a safe areas (notch)
- [x] Acessibilidade (teclado, aria, reduced-motion)
