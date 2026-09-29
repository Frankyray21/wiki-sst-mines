# Diagrammes sur fond noir (29 septembre 2026) : pour redessiner les figures des captures de cours (pyramides,
# arêtes de poisson, lignes de défense, logigrammes), que le gabarit « affiche » (gabarit.py) ne sait pas tracer.
# Même police (Figtree, incorporée réduite aux glyphes employés), même largeur (480), mêmes règles de fond que les
# affiches : chaque mot vient de la page ; la structure reste neutre ; une couleur n'est employée que pour une raison,
# nommée dans la légende sous le titre. Fond : le noir du wiki (retenu par Frank le 29 septembre 2026).
import math, re
from xml.sax.saxutils import escape
import gabarit as kit

W = kit.W
MARGE = 14
# ---------- palette : les jetons du thème sombre du site (tools/style.css) ----------
FOND = '#16181d'        # --bg
CADRE = '#2b3038'       # --border-soft
CARTE = '#1d2026'       # --content-bg
CARTE_2 = '#23262d'     # --bg-surface-2
BORD = '#3a404a'        # --border-light
TRAIT = '#8b939c'       # traits et flèches neutres
TEXTE = '#f2f6fa'       # --text
TEXTE_2 = '#b6c2d1'     # --text-soft
TEXTE_3 = '#8fa0b3'     # --text-faint
# couleurs à justifier (légende) : les teintes des pictogrammes du site
AMBRE = '#fbb843'
ROSE = '#f9a1a5'
VERT = '#75fcc6'


def t(x, y, texte, poids=600, taille=14, couleur=TEXTE, ancre='start'):
    return kit.t(x, y, texte, poids, taille, couleur, ancre)


def t_riche(x, y, texte, poids=500, taille=12, couleur=TEXTE_2, ancre='start'):
    """Une ligne dont les exposants s'écrivent ^{…} (Figtree n'a pas les chiffres en exposant)."""
    morceaux = re.split(r'(\^\{[^}]*\})', texte)
    out = []
    for m in morceaux:
        if m.startswith('^{'):
            s = m[2:-1]
            kit._employes[poids].update(s)
            out.append(f'<tspan baseline-shift="super" font-size="{taille * 0.72:.1f}">{escape(s)}</tspan>')
        elif m:
            kit._employes[poids].update(m)
            out.append(escape(m))
    a = f' text-anchor="{ancre}"' if ancre != 'start' else ''
    return f'<text x="{x:.1f}" y="{y:.1f}" font-weight="{poids}" font-size="{taille}" fill="{couleur}"{a}>{"".join(out)}</text>'


def lignes(x, y, texte, largeur_max, poids=600, taille=14, couleur=TEXTE, ancre='middle', interligne=None):
    """Texte coupé à « largeur_max », une ligne sous l'autre ; y : ligne de base de la première. Rend (éléments, hauteur)."""
    inter = interligne or round(taille * 1.25, 1)
    ls = kit.couper(texte, poids, taille, largeur_max)
    return [t(x, y + i * inter, l, poids, taille, couleur, ancre) for i, l in enumerate(ls)], inter * len(ls)


def rect(x, y, w, h, fond=CARTE, bord=BORD, rx=10, epaisseur=1.3, tirets=None):
    d = f' stroke-dasharray="{tirets}"' if tirets else ''
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fond}" stroke="{bord}" stroke-width="{epaisseur}"{d}/>'


def poly(points, fond=CARTE, bord=BORD, epaisseur=1.3):
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in points)}" fill="{fond}" stroke="{bord}" stroke-width="{epaisseur}" stroke-linejoin="round"/>'


def trait(x1, y1, x2, y2, couleur=TRAIT, epaisseur=2, tirets=None):
    d = f' stroke-dasharray="{tirets}"' if tirets else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{couleur}" stroke-width="{epaisseur}" stroke-linecap="round"{d}/>'


def chemin(d, couleur=TRAIT, epaisseur=2, fond='none', tirets=None):
    dd = f' stroke-dasharray="{tirets}"' if tirets else ''
    return f'<path d="{d}" fill="{fond}" stroke="{couleur}" stroke-width="{epaisseur}" stroke-linecap="round" stroke-linejoin="round"{dd}/>'


def pointe(x, y, angle, couleur=TRAIT, taille=9):
    """Pointe de flèche pleine en (x, y), orientée selon « angle » (radians)."""
    a1, a2 = angle + math.radians(152), angle - math.radians(152)
    return (f'<polygon points="{x:.1f},{y:.1f} {x + taille * math.cos(a1):.1f},{y + taille * math.sin(a1):.1f} '
            f'{x + taille * math.cos(a2):.1f},{y + taille * math.sin(a2):.1f}" fill="{couleur}"/>')


def fleche(x1, y1, x2, y2, couleur=TRAIT, epaisseur=2.2, taille=9):
    ang = math.atan2(y2 - y1, x2 - x1)
    xb, yb = x2 - (taille - 2) * math.cos(ang), y2 - (taille - 2) * math.sin(ang)
    return trait(x1, y1, xb, yb, couleur, epaisseur) + pointe(x2, y2, ang, couleur, taille)


def boite_texte(x, y, w, titre, detail=None, fond=CARTE, bord=BORD, taille=14.5, taille_detail=12, pad=9, couleur=TEXTE):
    """Carte centrée : titre (gras) et détail (plus petit, gris). Rend (éléments, hauteur)."""
    corps, yy = [], y + pad + taille * 0.95
    e, h1 = lignes(x + w / 2, yy, titre, w - 2 * pad, 700, taille, couleur)
    corps += e
    h = pad + h1
    if detail:
        e, h2 = lignes(x + w / 2, y + h + taille_detail * 0.95 + 2, detail, w - 2 * pad, 500, taille_detail, TEXTE_2)
        corps += e
        h += h2 + 2
    h += pad - 2
    return [rect(x, y, w, h, fond, bord)] + corps, h


def en_tete(titre, sous_titre=None, y=6):
    corps, h = lignes(W / 2, y + 26, titre, W - 2 * MARGE - 6, 900, 22, TEXTE, interligne=27)
    y = y + 26 + h - 27 + 8
    if sous_titre:
        e, h2 = lignes(W / 2, y + 16, sous_titre, W - 2 * MARGE - 6, 600, 13, TEXTE_2, interligne=17)
        corps += e
        y += 16 + h2 - 17 + 6
    return corps, y + 8


def legende(items, y):
    """Ligne centrée : chaque couleur employée, et ce qu'elle marque. items : [(couleur, libellé)]."""
    largeurs = [12 + 6 + kit.largeur(txt, 600, 12) for c, txt in items]
    total = sum(largeurs) + 18 * (len(items) - 1)
    if total > W - 2 * MARGE:
        raise ValueError(f'légende trop longue : {items}')
    x, out = W / 2 - total / 2, []
    for (c, txt), w in zip(items, largeurs):
        out.append(f'<rect x="{x:.1f}" y="{y - 9:.1f}" width="12" height="12" rx="3" fill="{c}"/>')
        out.append(t(x + 18, y + 1, txt, 600, 12, TEXTE_2))
        x += w + 18
    return out, y + 16


def repere(texte, y, titre='Repère'):
    """Bandeau du bas : une phrase de la page."""
    x0, w0 = MARGE, W - 2 * MARGE
    ls = kit.couper(titre + ' — ' + texte, 500, 12.5, w0 - 24)
    h = 14 + 16 * len(ls)
    out = [rect(x0, y, w0, h, CARTE_2, BORD, 10)]
    yy = y + h / 2 - 16 * len(ls) / 2 + 12
    for i, l in enumerate(ls):
        if i == 0 and l.startswith(titre):
            reste = l[len(titre):]
            out.append(f'<text x="{x0 + 12}" y="{yy:.1f}" font-size="12.5"><tspan font-weight="800" fill="{TEXTE}">{escape(titre)}</tspan><tspan font-weight="500" fill="{TEXTE_2}">{escape(reste)}</tspan></text>')
            kit._employes[800].update(titre)
            kit._employes[500].update(reste)
        else:
            out.append(t(x0 + 12, yy, l, 500, 12.5, TEXTE_2))
        yy += 16
    return out, y + h + MARGE


def svg(corps, hauteur, titre_access, desc):
    H = int(math.ceil(hauteur))
    fond = rect(0.75, 0.75, W - 1.5, H - 1.5, FOND, CADRE, 14, 1.5)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" '
            f'aria-labelledby="t d" font-family="Figtree, \'Segoe UI\', Arial, sans-serif">'
            f'<title id="t">{escape(titre_access)}</title><desc id="d">{escape(desc)}</desc>'
            f'<style>{kit.polices_css()}</style>{fond}' + ''.join(corps) + '</svg>'), H


def nouveau():
    """À appeler avant chaque schéma : la police incorporée ne garde que les glyphes du schéma en cours."""
    for p in kit.POIDS:
        kit._employes[p].clear()
