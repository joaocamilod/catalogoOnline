# Catálogo Online

> Uma aplicação web moderna de e-commerce desenvolvida com React, focada em performance, UI/UX e boas práticas de desenvolvimento front-end.

## Visão Geral

O **Catálogo Online** é uma aplicação Single Page Application (SPA) que simula uma plataforma completa de e-commerce. O projeto foi desenvolvido com foco em criar uma experiência de usuário fluida e responsiva, implementando funcionalidades essenciais de uma loja virtual moderna.

### Objetivos do Projeto

- Demonstrar domínio de conceitos modernos do React (Hooks, Context, Memoization)
- Implementar uma interface de usuário intuitiva e acessível
- Aplicar boas práticas de desenvolvimento front-end
- Criar uma arquitetura escalável e de fácil manutenção
- Otimizar performance e experiência do usuário

## Arquitetura e Tecnologias

#### Front-end Framework
- **React 18.2.0**
  - Hooks para gerenciamento de estado (`useState`, `useMemo`, `useEffect`)
  - Componentes funcionais com props drilling
  - Virtual DOM para renderização otimizada

#### Build Tool
- **Vite 5.0.8**
  - Hot Module Replacement (HMR) para desenvolvimento rápido
  - Build otimizado com Rollup
  - Suporte nativo a ES Modules
  - Configuração mínima e performance superior ao Webpack

#### Bibliotecas de UI
- **React Icons 5.5.0**
  - Ícones vetoriais escaláveis (FontAwesome)
  - Tree-shaking para bundle size otimizado
  - Componentes React nativos

#### Estilização
- **CSS3 Moderno**
  - CSS Variables para temas consistentes
  - Flexbox e CSS Grid para layouts responsivos
  - Animações com `@keyframes` e `transition`
  - Media queries para responsividade
  - Metodologia modular (um CSS por componente)

#### Tipografia
- **Google Fonts (Inter)**
  - Font weights: 300, 400, 500, 600, 700
  - Otimização com `font-display: swap`

### Gerenciamento de Estado

O projeto utiliza **React State Management** nativo:
- `useState` para estados locais dos componentes
- `useMemo` para memoização de cálculos pesados (filtros e ordenação)
- Props drilling para comunicação entre componentes

**Decisão arquitetural**: Optou-se por não utilizar Redux/Context API devido ao escopo do projeto, mantendo a simplicidade e clareza do código.

## Instalação e Configuração

### Pré-requisitos

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0 ou **yarn** >= 1.22.0
- **Git** (para clonagem do repositório)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/catalogo-online.git
cd catalogo-online
```

2. **Instalação das dependências**
```bash
npm install
# ou
yarn install
```

3. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

4. **Acesse a aplicação**
```
http://localhost:3000
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Gera build de produção otimizado na pasta `dist/` |
| `npm run preview` | Visualiza o build de produção localmente |

### Convenções de Nomenclatura

- **Componentes**: PascalCase (ex: `ProductCard.jsx`)
- **Arquivos CSS**: Mesmo nome do componente (ex: `ProductCard.css`)
- **Funções/Variáveis**: camelCase (ex: `addToCart`, `filteredProducts`)
- **Constantes**: camelCase para objetos, UPPER_CASE para valores primitivos

## Decisões Técnicas

### 1. Escolha do Vite sobre Create React App

**Justificativa**:
- Tempo de inicialização mais rápido
- HMR instantâneo independente do tamanho do projeto
- Configuração mínima out-of-the-box
- Melhor experiência de desenvolvimento

### 2. CSS Modules vs CSS-in-JS

**Decisão**: CSS puro com arquivos separados por componente

**Justificativa**:
- Melhor performance (sem JavaScript gerando CSS)
- Familiaridade e simplicidade
- Facilita debugging com DevTools

### 3. State Management Local vs Global

**Decisão**: React Hooks nativos sem biblioteca externa

**Justificativa**:
- Props drilling gerenciável com estrutura atual
- Menos dependências = menor bundle
- Curva de aprendizado reduzida
- Manutenção simplificada


Desenvolvido como projeto pessoal de demonstração de habilidades em desenvolvimento front-end moderno.

**Tecnologias**: React • Vite • JavaScript ES6+ • CSS3 • HTML5

## Multi-tenancy

- Catálogo público por loja: `/:slug`
- Admin por loja: `/admin/:slug`
- Login global: `/login`
- Onboarding de loja: `/nova-loja`

### Variáveis de ambiente

Crie um `.env` com:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Migrations

Aplicar as migrations da pasta `supabase/migrations` em ordem, com foco na migration:

- `013_multi_tenant_lojas_rls.sql`

Essa migration cria `lojas`, adiciona `tenant_id` nas tabelas principais e ajusta RLS/trigger para isolamento por tenant.

### Deploy Vercel

Consulte o guia completo em `README-deploy.md`.
