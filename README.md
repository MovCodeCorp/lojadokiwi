# Loja do Kiwi

Loja de materiais digitais para imprimir — kits de atividades, materiais pedagógicos,
cursos e lembrancinhas em PDF. O pagamento e a entrega dos arquivos são feitos pela
Kiwify; este repositório é a vitrine.

**No ar:** <https://lojadokiwi.com.br>

---

## Como o site funciona

São páginas HTML estáticas publicadas pelo **GitHub Pages**. Não há servidor, banco de
dados nem etapa de compilação: o que está na branch `main` é exatamente o que vai ao ar,
poucos segundos depois do envio.

O catálogo inteiro mora em um único arquivo, o **`produtos.js`**. O `script.js` lê esse
arquivo e monta a vitrine, as categorias, a busca e a página de cada produto no
navegador. Para mexer na loja — preço, produto novo, texto — o arquivo a editar é quase
sempre o `produtos.js`.

## Estrutura

```
index.html            página inicial (carrossel, mais vendidos, categorias)
produtos/             catálogo, busca e página de detalhe de cada produto
duvidas/              perguntas frequentes e canais de atendimento
termos-de-uso/        termos de uso e política de reembolso
404.html              página de endereço não encontrado

produtos.js           CATÁLOGO: todos os produtos e categorias
script.js             monta as vitrines, busca, menu, carrossel e acordeão
style.css             estilos de todo o site

imagens/              imagens de 800px, usadas na página de detalhe
imagens/thumbs/       miniaturas de 400px, usadas nos cards da vitrine
ferramentas/          scripts de apoio (ver abaixo)

CNAME                 domínio próprio, lido pelo GitHub Pages
robots.txt            libera a indexação e aponta o sitemap
sitemap.xml           lista de páginas entregue ao Google
```

---

## Tarefas do dia a dia

### Adicionar um produto

**1. Prepare a imagem.** O script gera os dois tamanhos que a loja usa:

```bash
python3 ferramentas/otimizar-imagens.py minha-foto.png --nome cartao-dos-votos
```

Ele cria `imagens/cartao-dos-votos.webp` (800px, página de detalhe) e
`imagens/thumbs/cartao-dos-votos.webp` (400px, card). **Nunca coloque a imagem original
direto na pasta** — foi o que fez a página inicial chegar a 19 MB.

**2. Copie um produto parecido no `produtos.js`** e ajuste os campos. Só `nome`,
`subtitulo`, `categoria`, `categoriaNome`, `preco`, `imagem` e `descricao` são
obrigatórios; o resto enriquece a página de detalhe.

**3. Confira antes de enviar:**

```bash
python3 ferramentas/verificar-catalogo.py
```

### Publicar um produto que estava em rascunho

Um produto com `publicado: false` fica cadastrado no `produtos.js` mas **não aparece na
loja**. Serve para preparar um lançamento sem deixar card sem imagem e botão de compra
quebrado no ar.

Para publicar, três coisas precisam estar prontas:

```js
imagem: "imagens/cartao-dos-votos.webp",   // gerada pelo otimizar-imagens.py
linkCompra: "https://pay.kiwify.com.br/…", // link real do checkout
publicado: true,                            // ou apague a linha
```

A categoria do produto volta sozinha ao menu quando ele for publicado.

### Criar uma categoria

Acrescente uma entrada em `categoriasLojadoKiwi`, no fim do `produtos.js`:

```js
festas: {
    nome: "Festas e Eventos",       // aparece no menu e nas abas
    titulo: "Kits Festas e Eventos", // título da página da categoria
    descricao: "Convites, topos de bolo e decorações para comemorações."
},
```

A **chave** (`festas`) é o que vai no campo `categoria` de cada produto e no endereço
(`/produtos/?cat=festas`). Ela precisa bater exatamente — uma diferença de uma letra já
fez um produto sumir do catálogo. O verificador avisa quando isso acontece.

Categorias sem nenhum produto publicado ficam ocultas no menu, nas abas e na home, e
reaparecem sozinhas ao receber o primeiro produto. Um ícone para a categoria pode ser
acrescentado em `iconesCategorias`, no `script.js`.

### Trocar um banner do carrossel

```bash
python3 ferramentas/otimizar-imagens.py banner-novo.png --banner 1
```

Gera a versão de computador e a de celular. Os banners são aplicados pelo `style.css` e
o destino de cada um está no `index.html`; nada mais precisa mudar.

### Editar textos

As dúvidas ficam em `duvidas/index.html` e os termos em `termos-de-uso/index.html`,
escritos direto no HTML. Ao acrescentar uma pergunta nova, copie um bloco
`item-accordion` inteiro — o `script.js` cuida da abertura e dos atributos de
acessibilidade sozinho.

---

## Antes de publicar

```bash
python3 ferramentas/verificar-catalogo.py
```

Confere link de compra ainda no texto de exemplo, imagem que não existe, categoria
inexistente, endereço repetido, preço fora do padrão e campo obrigatório em falta.
Produtos em rascunho aparecem como aviso; produtos no ar, como erro.

## Rodar na sua máquina

Abrir o `index.html` com dois cliques **não funciona** — os endereços começam com `/` e
o navegador bloqueia parte do JavaScript. Suba um servidor local na pasta do projeto:

```bash
python3 -m http.server 8000
```

E acesse <http://localhost:8000>.

---

## Campos de um produto

| Campo | Obrigatório | Para que serve |
|---|---|---|
| `nome` | sim | Título do produto |
| `subtitulo` | sim | Linha de apoio; entra no endereço do produto |
| `categoria` | sim | Chave da categoria, exatamente como em `categoriasLojadoKiwi` |
| `categoriaNome` | sim | Etiqueta exibida na página de detalhe |
| `preco` | sim | No formato `"R$ 19,99"` |
| `imagem` | sim | Caminho da imagem de 800px em `imagens/` |
| `descricao` | sim | Texto curto; vira a descrição da página no Google |
| `publicado` | não | `false` esconde o produto da loja. Ausente = publicado |
| `linkCompra` | não | Checkout da Kiwify. Sem ele, o botão não leva a lugar nenhum |
| `mostrarNaInicial` | não | `true` coloca o produto em "Mais Vendidos" |
| `imagemAlt` | não | Descrição da imagem para leitores de tela e busca |
| `descricaoDetalhada` | não | Texto longo da página de detalhe |
| `itens` | não | Lista "O que vem no arquivo" |
| `idealPara` | não | Lista "Ideal para" |
| `comoUsar` | não | Lista numerada "Como usar" |
| `observacoes` | não | Lista "Observações" |
| `textoCompra` | não | Texto do botão. Padrão: "Adquirir Material" |
| `slug` | não | Endereço fixo do produto, se não quiser o gerado automaticamente |

---

## Detalhes que vale conhecer antes de mexer

**Dois tamanhos por imagem.** O card mostra a imagem a 200px e a página de detalhe a
400px. Servir o arquivo original de 2000px nos dois lugares custava megabytes por card.
O `script.js` monta o `srcset` sozinho e acha a miniatura pelo caminho — por isso o
nome do arquivo em `imagens/` e em `imagens/thumbs/` precisa ser o mesmo.

**Dois verdes.** `--verde-kiwi` (`#72a325`) é a cor da marca e só aparece em uso
decorativo: bordas, bolinhas, traços. Texto e botões usam `--verde-texto` e
`--verde-botao` (`#4d7215`), porque o verde da marca sobre branco tem contraste de
3,01:1 e a norma de acessibilidade pede 4,5:1. Ao criar um estilo novo com texto verde,
use `--verde-texto`.

**Cabeçalho e rodapé são copiados nas quatro páginas.** É proposital: montá-los por
JavaScript esconderia os links de navegação do Google. Ao mudar o menu, o telefone ou
um link do rodapé, **mude nos quatro arquivos** (`index.html`, `produtos/index.html`,
`duvidas/index.html`, `termos-de-uso/index.html`) e também no `404.html`.

**Todo produto tem página, mas não tem endereço próprio.** As páginas de produto são
montadas no navegador em `/produtos/?produto=nome-do-produto`. O título, a descrição e
a imagem de compartilhamento acompanham o produto aberto — então o link colado no
WhatsApp aparece certo. O que ainda falta é uma pasta de verdade por produto, para cada
um ter a própria entrada no Google.

## Em aberto

- **Endereço próprio por produto** no Google (gerar uma pasta por produto a partir do
  `produtos.js`, de preferência com automação no envio).
- **Ferramenta de medição** — o site não tem Google Analytics nem pixel, então não há
  como saber quantas visitas viram venda.
- **Quatro produtos em rascunho** aguardando link de compra e imagem.

---

© Loja do Kiwi. Os textos, imagens e materiais deste repositório são de uso exclusivo da
Loja do Kiwi e não estão licenciados para reuso. Desenvolvido pela
[MovCode](https://movcode.com.br/).
