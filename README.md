# Agenda de Espaços PNSG

Aplicação web para gerenciamento de reservas de salas e espaços, com agenda diária, semanal e mensal, recorrência, cadastro de espaços, relatório em PDF e autenticação pelo Supabase.

## Tecnologias

- React + TypeScript
- Vite
- Supabase (banco de dados e autenticação)
- jsPDF (relatórios em PDF)
- Vercel (deploy)

## Rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o Supabase

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publishable_ou_anon_public
```

Use a URL completa do projeto no campo **Project URL** do Supabase. O `Project ID` sozinho não é a URL.

Para encontrar esses dados no Supabase:

1. Acesse **Project Settings → API**.
2. Copie o **Project URL** para `VITE_SUPABASE_URL`.
3. Copie a chave **Publishable key** (ou a chave legada `anon public`) para `VITE_SUPABASE_PUBLISHABLE_KEY`.

Nunca coloque a chave `service_role` neste projeto ou em variáveis `VITE_`.

### 3. Iniciar o projeto

```bash
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

### 4. Validar a produção

```bash
npm run build
npm run preview
```

## Supabase e acesso

O frontend usa o Supabase diretamente com a chave pública. A segurança dos dados deve ser garantida pelas políticas de acesso (RLS) configuradas no Supabase. A autenticação utiliza a sessão persistida no navegador, permitindo que o usuário continue conectado conforme a configuração do projeto.

## Estrutura principal

```text
src/
├── components/
│   ├── CalendarViews.tsx
│   ├── Dashboard.tsx
│   ├── ReservationDialogs.tsx
│   └── SpacesView.tsx
├── lib/
│   └── supabaseClient.ts
├── main.tsx
├── styles.css
└── types.ts
```

## Scripts

| Comando | Função |
| --- | --- |
| `npm run dev` | Executa o ambiente local |
| `npm run build` | Gera a versão de produção |
| `npm run preview` | Visualiza a versão de produção localmente |
