#!/usr/bin/env python3
"""
Prepara uma imagem de produto para a loja.

A loja usa dois tamanhos de cada imagem de produto:

  imagens/<nome>.webp          800px  - página de detalhe do produto
  imagens/thumbs/<nome>.webp   400px  - cards da vitrine

Este script gera os dois a partir de um arquivo de qualquer tamanho ou
formato. Foi ele que reduziu a página inicial de 18,99 MB para 0,82 MB;
usá-lo em toda imagem nova mantém o site leve.

Uso:
    python3 ferramentas/otimizar-imagens.py foto-do-produto.png
    python3 ferramentas/otimizar-imagens.py foto.png --nome cartao-dos-votos

    # banners do carrossel (1600px + versão de 800px para celular)
    python3 ferramentas/otimizar-imagens.py banner-novo.png --banner 1

    # gerar as miniaturas que estiverem faltando
    python3 ferramentas/otimizar-imagens.py --faltantes

Requer Pillow:  pip install pillow
"""

import argparse
import os
import re
import sys
import unicodedata

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow não está instalado. Rode:  pip install pillow")

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGENS = os.path.join(RAIZ, "imagens")
THUMBS = os.path.join(IMAGENS, "thumbs")

LARGURA_DETALHE = 800   # a página de detalhe mostra no máximo 400px (800 = retina)
LARGURA_THUMB = 400     # o card mostra no máximo 200px (400 = retina)
LARGURA_BANNER = 1600
LARGURA_BANNER_CELULAR = 800
QUALIDADE = 82


def apelidar(texto):
    """Transforma 'Cartão dos Votos.PNG' em 'cartao-dos-votos'."""
    base = os.path.splitext(os.path.basename(texto))[0]
    base = unicodedata.normalize("NFD", base)
    base = "".join(c for c in base if unicodedata.category(c) != "Mn")
    base = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()
    return base or "imagem"


def gravar(origem, destino, largura):
    """Redimensiona para `largura` (sem ampliar) e grava em WebP."""
    with Image.open(origem) as im:
        im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        if im.width > largura:
            altura = round(im.height * largura / im.width)
            im = im.resize((largura, altura), Image.LANCZOS)
        if im.mode == "RGBA":
            # WebP aceita transparência, mas a loja mostra tudo sobre branco;
            # achatar evita bordas escuras nas miniaturas.
            fundo = Image.new("RGB", im.size, (255, 255, 255))
            fundo.paste(im, mask=im.split()[-1])
            im = fundo
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        im.save(destino, "WEBP", quality=QUALIDADE, method=6)
    return os.path.getsize(destino)


def kb(n):
    return f"{n / 1024:.0f} KB"


def produto(origem, nome=None):
    apelido = nome or apelidar(origem)
    tamanho_antes = os.path.getsize(origem)

    grande = os.path.join(IMAGENS, f"{apelido}.webp")
    thumb = os.path.join(THUMBS, f"{apelido}.webp")
    a = gravar(origem, grande, LARGURA_DETALHE)
    b = gravar(origem, thumb, LARGURA_THUMB)

    print(f"  {os.path.basename(origem)}  ({kb(tamanho_antes)})")
    print(f"    -> imagens/{apelido}.webp          {kb(a)}   (detalhe)")
    print(f"    -> imagens/thumbs/{apelido}.webp   {kb(b)}   (card)")
    print()
    print(f"  Em produtos.js, use:   imagem: \"imagens/{apelido}.webp\"")
    print("  (o script.js encontra a miniatura sozinho)")


def banner(origem, numero):
    grande = os.path.join(IMAGENS, f"banner{numero}.webp")
    celular = os.path.join(IMAGENS, f"banner{numero}-mobile.webp")
    a = gravar(origem, grande, LARGURA_BANNER)
    b = gravar(origem, celular, LARGURA_BANNER_CELULAR)
    print(f"  {os.path.basename(origem)}  ({kb(os.path.getsize(origem))})")
    print(f"    -> imagens/banner{numero}.webp          {kb(a)}   (computador)")
    print(f"    -> imagens/banner{numero}-mobile.webp   {kb(b)}   (celular)")
    print()
    print("  Os banners são aplicados pelo style.css; não precisa mexer em mais nada.")


def faltantes(forcar=False):
    """Gera as miniaturas que estiverem faltando.

    Por padrão nao mexe nas que ja existem: a miniatura sai da imagem de
    800px, que ja e comprimida, entao regerar uma miniatura existente perde
    um pouco de qualidade a cada vez. Use --forcar so se o padrao mudar.
    """
    feitas = puladas = 0
    for arquivo in sorted(os.listdir(IMAGENS)):
        caminho = os.path.join(IMAGENS, arquivo)
        if not arquivo.endswith(".webp") or not os.path.isfile(caminho):
            continue
        if arquivo.startswith("banner"):
            continue
        thumb = os.path.join(THUMBS, arquivo)
        if os.path.exists(thumb) and not forcar:
            puladas += 1
            continue
        gravar(caminho, thumb, LARGURA_THUMB)
        feitas += 1
        print(f"  gerada: thumbs/{arquivo}  {kb(os.path.getsize(thumb))}")

    if feitas:
        print(f"\n  {feitas} miniatura(s) gerada(s).")
    if puladas:
        print(f"  {puladas} ja existiam e foram mantidas "
              f"(use --forcar para regerar, com perda de qualidade).")
    if not feitas and not puladas:
        print("  Nenhuma imagem de produto encontrada em imagens/.")


def main():
    p = argparse.ArgumentParser(
        description="Gera as versões da loja a partir de uma imagem original.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__)
    p.add_argument("origem", nargs="?", help="arquivo de imagem original")
    p.add_argument("--nome", help="apelido do arquivo final (sem extensão)")
    p.add_argument("--banner", type=int, choices=[1, 2, 3], help="tratar como banner do carrossel")
    p.add_argument("--faltantes", action="store_true",
                   help="gerar as miniaturas que estiverem faltando")
    p.add_argument("--forcar", action="store_true",
                   help="com --faltantes, regera tambem as que ja existem")
    a = p.parse_args()

    if a.faltantes:
        print("Conferindo imagens/thumbs/\n")
        faltantes(forcar=a.forcar)
        print()
        return
    if not a.origem:
        p.print_help()
        sys.exit(1)
    if not os.path.exists(a.origem):
        sys.exit(f"Arquivo não encontrado: {a.origem}")

    print()
    if a.banner:
        banner(a.origem, a.banner)
    else:
        produto(a.origem, a.nome)
    print()


if __name__ == "__main__":
    main()
