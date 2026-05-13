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
                <div class="capa-produto">
                    <img src="${escapeHtml(produto.imagem)}" alt="${escapeHtml(produto.imagemAlt || produto.nome)}">
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
                        ${produtosDaCategoria.map(produto => renderCard(produto, "catalogo")).join("")}
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
