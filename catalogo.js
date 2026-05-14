(function () {
    const produtos = window.produtosLojaKiwi || [];
    const categorias = window.categoriasLojaKiwi || {};

    function escapeHtml(valor) {
        return String(valor || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function criarSlug(produto) {
        return String(produto.slug || `${produto.nome}-${produto.subtitulo || produto.categoriaNome}`)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function criarLinkProduto(produto) {
        return `produtos.html?produto=${encodeURIComponent(criarSlug(produto))}`;
    }

    function renderTags(tags) {
        return (tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    }

    function renderItens(itens) {
        if (!itens || itens.length === 0) {
            return "";
        }

        return `
            <ul class="itens-lista">
                ${itens.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
        `;
    }

    function renderCapa(produto) {
        if (produto.imagem) {
            return `
                <div class="capa-produto" data-fallback="${escapeHtml(produto.capaTexto || produto.categoriaNome || "Produto digital")}">
                    <img src="${escapeHtml(produto.imagem)}" alt="${escapeHtml(produto.imagemAlt || produto.nome)}" onerror="this.closest('.capa-produto').classList.add('imagem-indisponivel'); this.remove();">
                    ${produto.badge ? `<span class="badge-novo">${escapeHtml(produto.badge)}</span>` : ""}
                </div>
            `;
        }

        return `
            <div class="capa-produto capa-ilustrada ${escapeHtml(produto.capaClasse)}">
                ${produto.badge ? `<span class="badge-novo">${escapeHtml(produto.badge)}</span>` : ""}
                <span class="cover-title">${escapeHtml(produto.capaTexto || produto.categoriaNome)}</span>
            </div>
        `;
    }

    function renderAcao(produto, contexto) {
        if (contexto === "home" && !produto.linkCompra) {
            return `<a href="produtos.html#${escapeHtml(produto.categoria)}" class="btn-notify">Ver na lista completa</a>`;
        }

        if (contexto === "home") {
            return `
                <a href="${escapeHtml(criarLinkProduto(produto))}" class="btn-buy-large">Ver detalhes</a>
                ${produto.linkCompra ? `<a href="${escapeHtml(produto.linkCompra)}" class="btn-notify" target="_blank">${escapeHtml(produto.textoCompra || "Comprar")}</a>` : ""}
            `;
        }

        if (produto.linkCompra) {
            return `
                <a href="${escapeHtml(produto.linkCompra)}" class="btn-buy-large" target="_blank">${escapeHtml(produto.textoCompra || "Comprar")}</a>
                ${produto.textoSeguro ? `<p class="compra-segura">${escapeHtml(produto.textoSeguro)}</p>` : ""}
            `;
        }

        return `<a href="${escapeHtml(produto.linkConsulta || "#")}" class="btn-notify" target="_blank">Consultar disponibilidade</a>`;
    }

    function renderCard(produto, contexto) {
        const descricao = contexto === "catalogo" && produto.descricaoCatalogo ? produto.descricaoCatalogo : produto.descricao;
        const subtitulo = contexto === "home" && produto.subtituloInicial ? produto.subtituloInicial : produto.subtitulo;

        return `
            <div class="card-produto ${produto.destaque ? "destaque" : ""}">
                ${produto.destaque ? `<div class="badge-destaque">${escapeHtml(produto.destaque)}</div>` : ""}
                ${renderCapa(produto)}
                <div class="info-produto">
                    <div class="tags-produto">${renderTags(produto.tags)}</div>
                    <h3>${escapeHtml(produto.nome)}</h3>
                    <h4>${escapeHtml(subtitulo)}</h4>
                    <p class="desc">${escapeHtml(descricao)}</p>
                    ${contexto === "catalogo" ? renderItens(produto.itens) : ""}
                    <p class="preco-produto">${escapeHtml(produto.preco)}</p>
                    <div class="compra-area">${renderAcao(produto, contexto)}</div>
                </div>
            </div>
        `;
    }

    function renderCatalogoAcao(produto) {
        return `<a href="${escapeHtml(criarLinkProduto(produto))}" class="btn-catalogo">Ver detalhes</a>`;
    }

    function renderCatalogoCard(produto) {
        return `
            <div class="produto-catalogo">
                <a href="${escapeHtml(criarLinkProduto(produto))}" class="catalogo-capa" aria-label="Ver detalhes de ${escapeHtml(produto.nome)}">
                    ${renderCapa(Object.assign({}, produto, { badge: "" }))}
                </a>
                <div class="catalogo-info">
                    <h3>${escapeHtml(produto.nome)}</h3>
                    <p class="catalogo-subtitulo">${escapeHtml(produto.subtituloInicial || produto.subtitulo || produto.categoriaNome)}</p>
                    <p class="preco-produto">${escapeHtml(produto.preco)}</p>
                    ${renderCatalogoAcao(produto)}
                </div>
            </div>
        `;
    }

    function renderListaDetalhe(titulo, itens) {
        if (!itens || itens.length === 0) {
            return "";
        }

        return `
            <div class="detalhe-bloco">
                <h2>${escapeHtml(titulo)}</h2>
                <ul class="detalhe-lista">
                    ${itens.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
            </div>
        `;
    }

    function renderPassosDetalhe(passos) {
        if (!passos || passos.length === 0) {
            return "";
        }

        return `
            <div class="detalhe-bloco">
                <h2>Como usar</h2>
                <div class="detalhe-passos">
                    ${passos.map((passo, index) => `
                        <div class="detalhe-passo">
                            <span>${index + 1}</span>
                            <p>${escapeHtml(passo)}</p>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    function renderDetalheAcao(produto) {
        if (produto.linkCompra) {
            return `
                <a href="${escapeHtml(produto.linkCompra)}" class="btn-buy-large detalhe-compra" target="_blank">${escapeHtml(produto.textoCompra || "Comprar")}</a>
                ${produto.textoSeguro ? `<p class="compra-segura">${escapeHtml(produto.textoSeguro)}</p>` : ""}
            `;
        }

        return `<a href="${escapeHtml(produto.linkConsulta || "#")}" class="btn-buy-large detalhe-compra" target="_blank">Consultar disponibilidade</a>`;
    }

    function renderProdutoDetalhe(produto) {
        const relacionados = produtos
            .filter(item => item !== produto && item.categoria === produto.categoria)
            .slice(0, 3);

        return `
            <article class="produto-detalhe">
                <a href="produtos.html#${escapeHtml(produto.categoria)}" class="voltar-catalogo">Voltar ao catálogo</a>
                <div class="detalhe-hero">
                    <div class="detalhe-galeria">
                        ${renderCapa(produto)}
                    </div>
                    <div class="detalhe-resumo">
                        <div class="tags-produto">${renderTags(produto.tags)}</div>
                        <span class="section-label">${escapeHtml(produto.categoriaNome)}</span>
                        <h1>${escapeHtml(produto.nome)}</h1>
                        <h2>${escapeHtml(produto.subtitulo || produto.subtituloInicial || "")}</h2>
                        <p>${escapeHtml(produto.descricaoDetalhada || produto.descricao)}</p>
                        <p class="preco-produto">${escapeHtml(produto.preco)}</p>
                        <div class="compra-area">${renderDetalheAcao(produto)}</div>
                    </div>
                </div>
                <div class="detalhe-conteudo">
                    ${renderListaDetalhe("O que vem no arquivo", produto.itens)}
                    ${renderListaDetalhe("Ideal para", produto.idealPara)}
                    ${renderPassosDetalhe(produto.comoUsar)}
                    ${renderListaDetalhe("Antes de comprar", produto.observacoes)}
                </div>
                ${relacionados.length ? `
                    <section class="detalhe-relacionados">
                        <div class="categoria-heading">
                            <div>
                                <span class="section-label">Mais opções</span>
                                <h2>Produtos relacionados</h2>
                            </div>
                        </div>
                        <div class="grid-produtos">
                            ${relacionados.map(renderCatalogoCard).join("")}
                        </div>
                    </section>
                ` : ""}
            </article>
        `;
    }

    function renderDetalheSeNecessario() {
        const container = document.getElementById("catalogo-produtos");

        if (!container) {
            return false;
        }

        const params = new URLSearchParams(window.location.search);
        const slug = params.get("produto");

        if (!slug) {
            return false;
        }

        const produto = produtos.find(item => criarSlug(item) === slug);
        const pageHero = document.querySelector(".page-hero");

        if (!produto) {
            if (pageHero) {
                pageHero.querySelector("h1").textContent = "Produto não encontrado";
                pageHero.querySelector("p").textContent = "Esse item pode ter mudado de endereço. Veja o catálogo completo abaixo.";
            }

            return false;
        }

        document.title = `${produto.nome} | Loja do Kiwi`;

        if (pageHero) {
            pageHero.classList.add("page-hero-compacto");
            pageHero.querySelector(".section-label").textContent = "Detalhes do produto";
            pageHero.querySelector("h1").textContent = produto.nome;
            pageHero.querySelector("p").textContent = produto.subtitulo || produto.descricaoCatalogo || produto.categoriaNome;
        }

        container.innerHTML = renderProdutoDetalhe(produto);
        return true;
    }

    function renderHome() {
        const container = document.getElementById("produtos-destaque");

        if (!container) {
            return;
        }

        container.innerHTML = produtos
            .filter(produto => produto.mostrarNaInicial)
            .map(produto => renderCard(produto, "home"))
            .join("");
    }

    function renderCatalogo() {
        const container = document.getElementById("catalogo-produtos");

        if (!container) {
            return;
        }

        if (renderDetalheSeNecessario()) {
            return;
        }

        container.innerHTML = Object.entries(categorias).map(([categoriaId, categoria]) => {
            const produtosDaCategoria = produtos.filter(produto => produto.categoria === categoriaId);

            return `
                <div id="${escapeHtml(categoriaId)}" class="categoria-produtos">
                    <div class="categoria-heading">
                        <div>
                            <span class="section-label">${escapeHtml(categoria.nome)}</span>
                            <h2>${escapeHtml(categoria.titulo)}</h2>
                        </div>
                        <p>${escapeHtml(categoria.descricao)}</p>
                    </div>
                    <div class="grid-produtos">
                        ${produtosDaCategoria.map(renderCatalogoCard).join("")}
                    </div>
                </div>
            `;
        }).join("");

        if (window.location.hash) {
            const destino = document.getElementById(window.location.hash.slice(1));

            if (destino) {
                destino.scrollIntoView();
            }
        }
    }

    renderHome();
    renderCatalogo();
}());
