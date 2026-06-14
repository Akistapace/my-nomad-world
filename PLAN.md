# My Nomad World — Plano de Desenvolvimento

## Status Atual
Branch: `main` | Stack: Next.js 16 + Supabase + Vercel | Design: Pixel Art 64-bit

---

## ✅ Concluído

### Etapa 1 — Setup & Auth
- [x] Next.js 16 + Supabase SSR configurado
- [x] Login / Signup com seleção de país nativo e personagem
- [x] `UserProvider` context via layout Server Component
- [x] `user.user_metadata.home_code` salvo no signup

### Etapa 2 — Stories
- [x] Modal "Postar Story" com seleção de país visitado
- [x] Insert no Supabase + atualização otimista de UI
- [x] Eye toggle (show/hide senha) em login e signup
- [x] Autofill override (sem fundo branco)
- [x] Estados CSS: `.pixel-input`, `.pixel-input-wrap`, `.pixel-textarea`, `.pixel-select`

### Etapa 3 — Globo
- [x] Auto-rotação suave no eixo X (pausa no hover/drag)
- [x] Globe centraliza no país nativo do usuário ao carregar
- [x] País nativo marcado em verde no globo

### Etapa 4 — Social
- [x] Amizade bidirecional (A adiciona B → B vê A automaticamente)
- [x] Ranking de Amigos na página `/ranking` (tab separada do Global)
- [x] Identificador único `@username` em todos os displays
- [x] Busca por `@contains` (ilike `%username%`)
- [x] Usuário aparece no próprio ranking de amigos (com badge "VOCÊ")

---

## 🔄 Em Progresso / Pendente

### Etapa 5 — Sistema de XP ✅
- [x] XP concedido automaticamente ao realizar ações:
  - Visitar país novo → +100 XP
  - Adicionar pin → +20 XP
  - Adicionar amigo → +30 XP
  - Postar story → não adiciona pontos
- [x] Level up automático — threshold `level * 1000` XP por nível
- [x] Toast pixel art ao ganhar XP (com "LEVEL UP!" quando sobe de nível)
- [x] `rank` recalculado via `recalculate_ranks()` RPC após cada XP grant

### Etapa 6 — Pins no Globo (coordenadas reais) ✅
- [x] Pins em (0,0) já filtrados pelo WorldGlobe — não renderizam
- [x] AddCountryForm e AddCountryModal criam travel pin com centróide real
- [x] Coordenadas de `COUNTRY_CENTERS[code]` → `[lng, lat]` → `lat=center[1], lng=center[0]`

### Etapa 7 — Stories: funcionalidades restantes ✅
- [x] Upload de foto opcional → bucket `story-photos`, exibe no feed e no viewer
- [x] Comentários — modal com lista + input, tabela `story_comments` com RLS
- [x] Paginação "Load More" — `PAGE_SIZE=10`, `.range()` no Supabase

### Etapa 8 — Perfil do usuário
- [ ] Página `/profile` com stats completas
- [ ] Editar personagem após criação
- [ ] Histórico de países visitados

### Etapa 9 — Deploy Vercel
- [x] Configurar variáveis de ambiente no Vercel
- [x] Push para produção
- [x] Testar autenticação em produção

---

## Bugs Conhecidos
- Story sem foto aceita insert mas exibe placeholder quebrado

## Bugs Corrigidos
- [x] Usuário com 0 XP não aparecia no ranking global (fora do top 50) → fetch separado se não incluído

---

## Decisões Técnicas
- `homeCode` lido de `user.user_metadata` (server-side, sem query extra)
- Amizade: `upsert ignoreDuplicates: true` evita duplicatas bidirecionais
- Busca: `ilike(username, raw%)` — prefix only, não contains
- Globe rotation: `[-lng, -lat, 0]` para centralizar em país


## Próximas etapas
### Item 1, inserir um painel admin, para que eu possa criar novas missões
- [] forneça as 100 primeiras missões