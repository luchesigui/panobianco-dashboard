# Auditoria do dashboard contra o brandbook Panobianco 2026

Data: 30 de agosto de 2026
Escopo: `/login`, `/kpis`, `/kpis/entrada-dados`, `/kpis/configuracoes`
Natureza: auditoria de leitura. Nenhum arquivo de produção foi alterado.

O brandbook é a referência. Onde o código diverge, é o código que está errado,
inclusive quando a solução dele passa em contraste. Documento dentro deste
repositório não vale como exceção enquanto não for confirmado.

Contrastes calculados em sRGB sobre os hexes reais do código, com as camadas de
opacidade compostas contra o fundo real. Contagens por varredura de `app/` e
`components/`, excluindo `node_modules`.

---

## Placar

| Métrica | Valor |
| --- | --- |
| Tokens de paleta corretos | 8 de 8 |
| Declarações de negrito | 117 |
| Ocorrências de raio | 65 |
| Ocorrências de sombra | 48 |
| Chanfros, todos num arquivo só | 8 |

A paleta foi convertida por inteiro e bem. Nenhuma outra camada do sistema
atravessou junto: geometria, tipografia e peso continuam no estado anterior.

---

## Bloqueadores

### 01. O anel de foco some no item de navegação ativo

`app/kpis/Navbar.tsx:36-38` · `app/kpis/kpi-brand.module.css:48-56`

O link ativo recebe `brandControl`, que aplica `clip-path`, e ao mesmo tempo
pede o foco via `focus-visible:outline-3 outline-offset-3`. O `clip-path`
recorta o outline junto com tudo que passa da borda, então o anel é desenhado e
imediatamente descartado. É a armadilha 3 do brandbook, e
`kpi-brand.module.css:53` repete o mesmo erro com `outline: 3px solid` em vez de
`box-shadow: inset`.

Vale igual para `SaveButton`, que é um `brandControl` em `/kpis/entrada-dados`.
Navegando por teclado, os dois controles ficam sem indicação nenhuma de foco.

Efeito colateral: `SaveButton.tsx:25` ainda pede `shadow-sm` num elemento
chanfrado. A sombra também é recortada, é CSS morto (armadilha 5).

### 02. O anel de foco global é laranja claro, abaixo do mínimo

`app/globals.css:103,130` · `components/ui/input.tsx:12`

`--focus-ring: var(--pb-orange)` alimenta `--ring`, e todo Input e Button do
shadcn desenha o foco com `ring-ring/50`. Elemento não-textual precisa de 3:1.

| Situação | Razão |
| --- | --- |
| laranja sobre creme, na superfície da página | 2.60:1 |
| laranja sobre branco, no card | 3.02:1, no limite exato |
| laranja a 50% sobre branco, o que o shadcn realmente pinta | 1.78:1 |

Sobre creme o brandbook já resolve: o anel tem que ser `--pb-orange-warm`, e sem
alfa.

### 03. `text-slate-400` em rótulo de tabela, a 2.56:1

29 ocorrências em 12 arquivos de `/kpis/entrada-dados` e `/kpis/configuracoes`.

Cabeçalhos de coluna e rótulos de linha da grade semanal usam `text-slate-400`
sobre branco e sobre `bg-slate-100`. São rótulos essenciais, não decoração: quem
lê a tabela depende deles para saber que coluna está preenchendo.

| Situação | Razão |
| --- | --- |
| sobre branco | 2.56:1, contra mínimo de 4.5:1 |
| sobre `bg-slate-50` | 2.45:1 |

Exemplo em `WeeklyDataGrid.tsx:105,141,157,193,233,239`. O token do projeto já
existe e passa com folga: `--text-muted` é grafite, 12.17:1 sobre branco.

### 04. Um seletor global impõe peso 900, caixa alta e cor fora da paleta em todo card

`app/globals.css:156-162`

A regra `[data-slot="card-title"]` aplica `font-weight: 900 !important`,
`text-transform: uppercase` e `color: #15191a !important` em cada CardTitle do
shadcn, nas quatro rotas. São três proibições absolutas do brandbook numa regra
de sete linhas, e o `!important` impede qualquer componente de corrigir
localmente.

Como é global, é o maior ganho por linha alterada de toda a auditoria.

### 05. Nenhum CTA do produto usa uma das três receitas da seção 6

`app/globals.css:102,120` · `kpi-brand.module.css:51` · `login/page.tsx:78` ·
`page.module.css:308,318,522-542`

A seção 6 não dá uma receita de CTA, dá três. O produto não usa nenhuma delas:
`--action-foreground: var(--pb-black)` pinta preto sobre laranja, combinação que
não existe no brandbook. Como esse token alimenta `--primary-foreground`, ele
atinge todo Button do shadcn, a navegação ativa, o login, o SaveButton e sete
pontos de `page.module.css`.

| Receita da seção 6 | Razão | Admissível em |
| --- | --- | --- |
| Fundo `--pb-black` + texto branco | 18.23:1 | qualquer tamanho |
| Fundo branco + texto `--pb-orange-warm` | 5.20:1 | qualquer tamanho |
| Fundo `--pb-orange` + texto branco | 3.02:1 | só a partir de 24px |
| Fundo `--pb-orange` + texto preto (o que o código faz) | 6.04:1 | não é receita do brandbook |

O contraste alto do preto sobre laranja não legitima a combinação: passar em AA
é condição necessária, não licença para inventar uma quarta receita. Duas das
três sancionadas passam com folga em qualquer tamanho, então não há tensão real
a resolver.

Encaminhamento: trocar `--action-foreground` para `--pb-white` e, nos CTAs de
texto pequeno, adotar a receita escura (fundo `--pb-black`). A navegação ativa é
o caso mais claro: 12px em caixa alta sobre laranja não alcança 24px, então a
receita escura é a única aplicável ali.

---

## Estado por seção do brandbook

| Seção | Estado | Evidência |
| --- | --- | --- |
| 1 · Paleta (valores) | Convertida | Os oito hexes de `globals.css:81-88` batem com o brandbook. |
| 1 · Paleta (nomes) | Divergente | `--pb-burgundy` em vez de `--pb-grena`. Mesmo `#330000`, nome fora do vocabulário da marca. |
| 1 · Alternância de superfícies | Ausente | Tudo em creme. Nenhuma faixa grená ou laranja. |
| 2 · Chanfro | Isolado | 8 `clip-path`, todos em `kpi-brand.module.css`. Sem escala `--tamanho-chanfro*`. |
| 2 · Armadilha 1 (padding) | Correto | `brandFrame`: chanfro 12px, padding 16-24px. |
| 2 · Armadilha 4 (portais) | Correto | Tooltip e Select usam `Portal` do Radix. |
| 3 · Fonte | Parcial | Archivo só dentro de `/kpis`. `/login` e `/` em Geist. |
| 3 · Sem negrito | 117 violações | Inclusive a própria fonte de display, instanciada só em 700/800/900. |
| 3 · Escala tipográfica | Inexistente | 17 tamanhos distintos, de 9px a 72px. |
| 4 · Ritmo vertical | Ad hoc | `margin-bottom: 3.25rem` entre seções, sem o par 80/112px. |
| 6 · Receita de CTA | Nenhuma das três | Preto sobre laranja, via `--action-foreground`. Ver bloqueador 05. |
| 6 · Sem raio | 65 ocorrências | Raiz nos primitivos shadcn: `rounded-xl`, `rounded-lg`. |
| 6 · Sem sombra | 48 ocorrências | 3 tokens de sombra próprios em `page.module.css:19-21`. |
| 6 · Sem vidro | 1 | `backdrop-blur` na Navbar. |
| 6 · Sem degradê decorativo | 2 | Dois `radial-gradient` no shell. |

### A fonte de display não consegue renderizar peso 400

`app/kpis/layout.tsx:17-22`

`--font-kpi-display` é uma instância de Archivo carregada com
`weight: ["700","800","900"]`. Enquanto for assim, o "sem negrito" do brandbook
é fisicamente impossível em qualquer título: o arquivo com peso 400 não é nem
baixado. É a correção que precisa vir antes das outras 117, senão cada título
corrigido cai num fallback.

### Vidro e degradê no shell e na barra

`app/kpis/layout.module.css:4-7` · `app/kpis/Navbar.tsx:19`

O shell pinta dois `radial-gradient` por cima do creme, um laranja e um grená. A
Navbar soma `backdrop-blur`, `shadow-sm` e fundo a 95% de opacidade. São quatro
dos itens da lista de proibições da seção 6, todos na moldura que aparece em
toda tela autenticada.

O contraste da Navbar, por outro lado, passa: 16.7:1 na marca, 8.5:1 no link
inativo, 6.0:1 no ativo.

---

## Cor fora da paleta

Três paletas rodando ao mesmo tempo. A oficial existe e está certa. Ao lado dela
sobreviveram um sistema de cinzas Tailwind e um sistema cromático de estado em
verde, azul e vermelho.

| Origem | Qtd | Onde | Vivo? |
| --- | --- | --- | --- |
| `slate-*` do Tailwind | 169 | entrada-dados e configuracoes, quase todo componente | Sim |
| Estado verde/vermelho/âmbar | 14 | `StatusAlert.tsx:15`, `SettingsMessage.tsx:15` | Sim |
| Badges azul/verde/vermelho | 6 | `projecao.module.css:171-183` | Sim |
| Marrom avulso `#5c3d1e` | 2 | `page.module.css:603-604` | Sim |
| Cinzas `#9c9b96`, `#6b6a65`, `#1a1a18` | 45 | 5 módulos de gráfico | Não |

**Os 45 cinzas são inertes.** Todos aparecem como fallback dentro de
`var(--token, #9c9b96)`. Enquanto os tokens resolverem, nenhum deles pinta um
pixel. São dívida de leitura, não bug visual, e podem sair em passada de limpeza
sem risco.

**Os badges de análise, não.** `.iconInfo`, `.iconGood` e `.iconBad` em
`projecao.module.css:171-183` são hexes crus sem `var()`, consumidos por
`ProjecaoAnalise.tsx:5-8`. Azul, verde e vermelho chapados, na tela. Passam em
contraste (5.9:1, 6.4:1 e 5.7:1) mas não existem no brandbook.

---

## Rota a rota

### `/login`

`app/login/page.tsx`, 86 linhas.

Nenhum traço da marca além da cor de fundo. Card com `shadow-md` e raio 18px
herdado, título em `font-black uppercase`, marca em `font-extrabold`, erro em
`text-red-600`, texto em `text-slate-900` e `text-slate-950`. Sem chanfro, sem
Archivo: a rota está fora do layout de `/kpis`, então roda em Geist.

É a primeira tela que qualquer pessoa vê e a menor da auditoria. Melhor relação
entre esforço e efeito de todas as rotas.

### `/kpis`

`app/kpis/page.module.css`, 806 linhas.

22 declarações de negrito, 13 de raio, 10 de sombra, mais os três tokens de
sombra próprios. Também mantém apelidos legados remapeados: `--blue` aponta para
grená e `--purple` para grafite. Os valores estão certos, os nomes vão induzir a
erro na próxima pessoa que editar.

### `/kpis/entrada-dados` e `/kpis/configuracoes`

As duas rotas que a conversão de tokens praticamente não tocou. Concentram as
169 ocorrências de `slate-*`, as 29 de `text-slate-400` do bloqueador 03 e os
dois cabeçalhos em `text-[clamp(42px,7vw,72px)] font-black uppercase`
(`PageHeader.tsx:23`, `SettingsForm.tsx:34`).

---

## Decisão pendente: a fronteira da seção 7

Este é o único ponto da auditoria que depende de uma decisão, e não de medição.

`docs/brand-assets.md` declara que cards densos de KPI, tabelas, inputs, plots,
tooltips e estados de validação permanecem retangulares e convencionais, e
restringe o chanfro ao cabeçalho editorial, à navegação ativa e aos marcadores
de seção. `kpi-brand.module.css` implementa exatamente esse recorte.

A seção 7 do brandbook admite exceções desse tipo, para superfícies com
propósito próprio. Mas ela também exige que a fidelidade seja confirmada antes,
e esse documento vive neste repositório: é o código concedendo a exceção a si
mesmo, não o brandbook concedendo. Enquanto não for confirmada, conta como
divergência em aberto, não como limite estabelecido.

O mesmo vale para a tipografia. A escala `3.5rem / 1.5rem / 1rem / 3rem` tem
quatro degraus e o produto usa 17 tamanhos entre 9px e 72px. Supor que a escala
"não se aplica" a uma grade densa é exceção a pedir, não a assumir.

Confirmar a fronteira, ou derrubá-la e converter as superfícies densas junto. As
duas respostas mudam bastante o tamanho da conversão.

---

## Ordem sugerida de correção

Ordenada por dependência, não por gravidade. Os três primeiros são pequenos e
destravam os demais.

1. Adicionar o peso 400 em `--font-kpi-display`. Sem isso, corrigir negrito não tem efeito.
2. Remover `[data-slot="card-title"]` de `globals.css:156-162`. Uma regra, quatro rotas.
3. Trocar `--focus-ring` para `--pb-orange-warm` e tirar o alfa do anel do shadcn.
4. Trocar `outline` por `box-shadow: inset` nas classes chanfradas de `kpi-brand.module.css`.
5. Levar os CTAs para uma das três receitas da seção 6: `--action-foreground` para `--pb-white`, e receita escura onde o texto for menor que 24px.
6. Substituir as 29 ocorrências de `text-slate-400` por `--text-muted`.
7. Converter `/login` inteira. Rota pequena, isolada, alto impacto.
8. Tirar vidro e degradê do shell e da Navbar.
9. Renomear `--pb-burgundy` para `--pb-grena`, alinhando o vocabulário ao da marca.
10. Raio e sombra nos primitivos shadcn, depois nos módulos CSS.

Antes do item 8 e do resto da tipografia: decidir a fronteira da seção 7.
