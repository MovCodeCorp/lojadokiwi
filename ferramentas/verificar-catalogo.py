#!/usr/bin/env python3
"""
Confere o catálogo antes de publicar.

Pega a classe de erro que já derrubou vendas nesta loja:

  - produto com link de compra ainda no texto de exemplo
  - produto apontando para uma imagem que não existe
  - produto em uma categoria que não existe (foi "casamento" x "casamentos")
  - dois produtos com o mesmo endereço
  - preço fora do padrão "R$ 0,00"
  - campos obrigatórios em falta

Rode antes de cada envio:

    python3 ferramentas/verificar-catalogo.py

Sai com código 1 se achar algum erro, para poder ser usado em automação.
"""

import json
import os
import re
import subprocess
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OBRIGATORIOS = ["nome", "subtitulo", "categoria", "categoriaNome",
                "preco", "imagem", "descricao"]
EXEMPLOS = ("SEU_LINK", "COLOQUE", "INSIRA", "TODO", "XXX")


def carregar():
    """Lê produtos.js com o Node, para não reimplementar o parser."""
    script = """
      const fs = require('fs');
      global.window = {};
      eval(fs.readFileSync(process.argv[1], 'utf8'));
      process.stdout.write(JSON.stringify({
        produtos: window.produtosLojadoKiwi,
        categorias: window.categoriasLojadoKiwi,
      }));
    """
    try:
        saida = subprocess.run(
            ["node", "-e", script, os.path.join(RAIZ, "produtos.js")],
            capture_output=True, text=True, check=True).stdout
    except FileNotFoundError:
        sys.exit("Node.js não encontrado — é necessário para ler o produtos.js.")
    except subprocess.CalledProcessError as e:
        sys.exit(f"produtos.js tem erro de sintaxe:\n{e.stderr}")
    return json.loads(saida)


def apelido(p):
    """Reproduz o criarSlug() do script.js: é o endereço do produto."""
    base = p.get("slug") or f"{p.get('nome','')}-{p.get('subtitulo','')}"
    base = unicodedata.normalize("NFD", str(base))
    base = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")


def main():
    dados = carregar()
    produtos = dados["produtos"] or []
    categorias = dados["categorias"] or {}

    erros, avisos = [], []
    apelidos = {}

    for i, p in enumerate(produtos, 1):
        nome = p.get("nome", f"produto #{i}")
        publicado = p.get("publicado") is not False
        onde = f'"{nome}"' + ("" if publicado else "  [rascunho]")
        # rascunho pode ter pendência; produto no ar, não
        registrar = erros.append if publicado else avisos.append

        for campo in OBRIGATORIOS:
            if not p.get(campo):
                registrar(f"{onde}: falta o campo obrigatório `{campo}`")

        cat = p.get("categoria")
        if cat and cat not in categorias:
            proximas = [c for c in categorias if c.startswith(str(cat)[:5])]
            dica = f"  (você quis dizer `{proximas[0]}`?)" if proximas else ""
            erros.append(f"{onde}: categoria `{cat}` não existe em categoriasLojadoKiwi{dica}")
        elif cat and p.get("categoriaNome") and p["categoriaNome"] != categorias[cat]["nome"]:
            avisos.append(f'{onde}: categoriaNome "{p["categoriaNome"]}" '
                          f'não bate com "{categorias[cat]["nome"]}"')

        link = str(p.get("linkCompra") or "")
        if any(x in link.upper() for x in EXEMPLOS) or not link:
            registrar(f"{onde}: link de compra ainda é texto de exemplo ({link or 'vazio'})")
        elif not link.startswith("http"):
            registrar(f"{onde}: link de compra não é um endereço válido ({link})")

        img = p.get("imagem")
        if img and not img.startswith("http"):
            if not os.path.exists(os.path.join(RAIZ, img)):
                registrar(f"{onde}: a imagem {img} não existe")
            else:
                partes = img.rsplit("/", 1)
                thumb = f"{partes[0]}/thumbs/{partes[1]}" if len(partes) == 2 else None
                if thumb and not os.path.exists(os.path.join(RAIZ, thumb)):
                    avisos.append(f"{onde}: falta a miniatura {thumb} — rode "
                                  f"ferramentas/otimizar-imagens.py")

        preco = str(p.get("preco") or "")
        if not re.fullmatch(r"R\$ \d{1,3}(\.\d{3})*,\d{2}", preco):
            registrar(f'{onde}: preço "{preco}" fora do padrão "R$ 0,00"')

        a = apelido(p)
        if a in apelidos:
            erros.append(f"{onde}: mesmo endereço de {apelidos[a]} (?produto={a})")
        apelidos[a] = onde

    for chave, cat in categorias.items():
        n = sum(1 for p in produtos if p.get("categoria") == chave and p.get("publicado") is not False)
        if n == 0:
            avisos.append(f"categoria `{chave}` ({cat['nome']}) não tem produto publicado "
                          f"— fica oculta no menu até receber um")

    publicados = [p for p in produtos if p.get("publicado") is not False]
    print(f"\n{len(produtos)} produtos cadastrados, {len(publicados)} publicados, "
          f"{len(categorias)} categorias\n")

    if erros:
        print(f"ERROS ({len(erros)}) — corrija antes de publicar:")
        for e in erros:
            print(f"  x  {e}")
        print()
    if avisos:
        print(f"avisos ({len(avisos)}) — não impedem a publicação:")
        for a in avisos:
            print(f"  -  {a}")
        print()
    if not erros and not avisos:
        print("Tudo certo.\n")
    elif not erros:
        print("Nenhum erro.\n")

    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
