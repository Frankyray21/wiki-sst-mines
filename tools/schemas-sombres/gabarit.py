# Gabarit du style sombre de Frank (tools/schemas-sombres/gabarit.py) (référence : « CNESST — comprendre les 3 volets », 26 septembre 2026).
# Un schéma se décrit par un dictionnaire (titre, cartes, sections, repère) ; le gabarit mesure le texte en
# Figtree, place chaque élément, incorpore la police réduite aux glyphes employés et rend un SVG 480 × H.
import base64, io, json, os, re
from xml.sax.saxutils import escape
from fontTools.ttLib import TTFont
from fontTools import subset

ICI = os.path.dirname(os.path.abspath(__file__))
W = 480
MARGE = 10
MDI = json.load(open(os.path.join(ICI, 'icones.json'), encoding='utf-8'))  # extrait de Material Design Icons (@mdi/js)

# ---------- palette relevée sur la référence ----------
FOND_HAUT, FOND_BAS = '#0c1a24', '#07121a'
BLANC = '#ffffff'
GRIS_TEXTE = '#c5d0d9'
SOUS_TITRE = '#9fb0bf'
CARTE, CARTE_BORD = '#0f202b', '#23384a'
COULEURS = {
    #          bord       clair (titres, puces)  entête     corps      sous-carte  médaillon
    'vert':   ('#3fcf7a', '#6fe3a0',             '#0a3320', '#06201a', '#0c2c25', '#062016'),
    'bleu':   ('#2596ec', '#5cb8ff',             '#0a2c47', '#061f33', '#0b2940', '#061a2c'),
    'orange': ('#f59a2c', '#ffb454',             '#3b230c', '#1b150f', '#2a1e12', '#1e1308'),
}

# ---------- police ----------
POIDS = (500, 600, 700, 800, 900)
_polices = {p: TTFont(os.path.join(ICI, f'figtree-{p}.woff2')) for p in POIDS}
_cmap = {p: f.getBestCmap() for p, f in _polices.items()}
_hmtx = {p: f['hmtx'] for p, f in _polices.items()}
_upem = {p: f['head'].unitsPerEm for p, f in _polices.items()}
_employes = {p: set() for p in POIDS}


def largeur(texte, poids, taille, espacement=0.0):
    cm, hm = _cmap[poids], _hmtx[poids]
    total = 0
    for ch in texte:
        g = cm.get(ord(ch)) or cm.get(0x20)
        total += hm[g][0]
    return total * taille / _upem[poids] + espacement * max(len(texte) - 1, 0)


def couper(texte, poids, taille, maxi):
    """Lignes d'au plus « maxi » unités ; jamais de coupure à une espace insécable."""
    mots = re.split(r'(?<=[ ])', texte)  # garde l'espace ordinaire en fin de mot
    lignes, courante = [], ''
    for m in mots:
        essai = courante + m
        if courante and largeur(essai.rstrip(' '), poids, taille) > maxi:
            lignes.append(courante.rstrip(' '))
            courante = m
        else:
            courante = essai
    if courante.strip():
        lignes.append(courante.rstrip(' '))
    for l in lignes:
        if largeur(l, poids, taille) > maxi + 0.5:
            raise ValueError(f'mot trop long pour {maxi} : « {l} »')
    return lignes


def t(x, y, texte, poids, taille, couleur, ancre='start', espacement=None, opacite=None):
    _employes[poids].update(texte)
    attrs = f'x="{x:.1f}" y="{y:.1f}" font-weight="{poids}" font-size="{taille}" fill="{couleur}"'
    if ancre != 'start':
        attrs += f' text-anchor="{ancre}"'
    if espacement:
        attrs += f' letter-spacing="{espacement}"'
    if opacite:
        attrs += f' fill-opacity="{opacite}"'
    return f'<text {attrs}>{escape(texte)}</text>'


def icone(nom, x, y, taille, couleur):
    d = MDI[nom]
    k = taille / 24
    return f'<path transform="translate({x:.1f} {y:.1f}) scale({k:.4f})" d="{d}" fill="{couleur}"/>'


def polices_css():
    regles = []
    for p in POIDS:
        if not _employes[p]:
            continue
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['kern', 'liga']
        opts.name_IDs = []
        opts.notdef_outline = False
        # recalcTimestamp=False : la police réduite garde la date d'origine, le SVG est identique d'une fois à l'autre
        f = TTFont(os.path.join(ICI, f'figtree-{p}.woff2'), recalcTimestamp=False)
        s = subset.Subsetter(opts)
        s.populate(text=''.join(sorted(_employes[p])) + ' ')
        s.subset(f)
        buf = io.BytesIO()
        f.flavor = 'woff2'
        f.save(buf)
        b64 = base64.b64encode(buf.getvalue()).decode()
        regles.append(f"@font-face{{font-family:'Figtree';font-weight:{p};src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
    return ''.join(regles)


# ---------- composants ----------
def en_tete(titre, sous_titre, y):
    out = []
    lignes = couper(titre, 900, 25, W - 2 * MARGE - 10)
    for i, l in enumerate(lignes):
        y += 29 if i else 30
        out.append(t(W / 2, y, l, 900, 25, BLANC, 'middle', -0.3))
    if sous_titre:
        for l in couper(sous_titre, 700, 14, W - 2 * MARGE - 20):
            y += 19
            out.append(t(W / 2, y, l, 700, 14, SOUS_TITRE, 'middle'))
    return out, y + 12


def cartes(liste, y):
    """Rangée de cartes : pictogramme blanc, nom, courte description."""
    n = len(liste)
    gap = 6
    lw = (W - 2 * MARGE - gap * (n - 1)) / n
    tailles = []
    for c in liste:
        lt = couper(c['titre'], 800, 14.5, lw - 12)
        ld = couper(c.get('texte', ''), 500, 12, lw - 12) if c.get('texte') else []
        tailles.append((lt, ld))
    h_icone = 38
    h = 10 + h_icone + 6 + max(len(a) * 17 + len(b) * 14.5 for a, b in tailles) + 10
    out = []
    for i, (c, (lt, ld)) in enumerate(zip(liste, tailles)):
        x = MARGE + i * (lw + gap)
        out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{lw:.1f}" height="{h:.1f}" rx="9" fill="{CARTE}" stroke="{CARTE_BORD}" stroke-width="1.3"/>')
        icones = c['icone'] if isinstance(c['icone'], list) else [c['icone']]
        tot = len(icones) * h_icone + (len(icones) - 1) * 4
        ix = x + lw / 2 - tot / 2
        for nom in icones:
            out.append(icone(nom, ix, y + 9, h_icone, '#dfe7ee'))
            ix += h_icone + 4
        yy = y + 10 + h_icone + 6
        for l in lt:
            yy += 15.5
            out.append(t(x + lw / 2, yy, l, 800, 14.5, BLANC, 'middle'))
        yy += 1.5
        for l in ld:
            yy += 14.5
            out.append(t(x + lw / 2, yy, l, 500, 12, GRIS_TEXTE, 'middle'))
    return out, y + h + 8


def puce(genre, x, y, clair, fond):
    """Puce ronde de la couleur de la section : coche (ce que l'on fait), point d'exclamation (ce qui
    pèse) ou point simple. Jamais de croix : rien ne juge un travailleur."""
    r = 7.2
    out = [f'<circle cx="{x + r:.1f}" cy="{y:.1f}" r="{r}" fill="{clair}"/>']
    if genre == 'coche':
        out.append(f'<path d="M{x + 3.6:.1f} {y + 0.2:.1f} l2.6 2.7 l5 -5.2" fill="none" stroke="{fond}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>')
    elif genre == 'alerte':
        out.append(f'<rect x="{x + r - 1.1:.1f}" y="{y - 4.3:.1f}" width="2.2" height="5.4" rx="1.1" fill="{fond}"/><circle cx="{x + r:.1f}" cy="{y + 3.2:.1f}" r="1.25" fill="{fond}"/>')
    else:
        out.append(f'<circle cx="{x + r:.1f}" cy="{y:.1f}" r="2.4" fill="{fond}"/>')
    return out


def colonne(col, x, y, w, couleur, titres=True):
    """Sous-carte : titre de couleur, puis éléments (puce ronde ou pictogramme blanc) et texte blanc. Sans
    titre dans aucune colonne de la section, la liste remonte en haut de la sous-carte."""
    bord, clair, entete, corps, souscarte, medaillon = COULEURS[couleur]
    out = []
    yy = y + (20 if titres else 2)
    if col.get('titre'):
        out.append(t(x + 11, yy, col['titre'], 800, 13.5, clair))
    yy += 6
    for it in col['items']:
        texte = it if isinstance(it, str) else it['texte']
        lignes = couper(texte, 500, 13, w - 11 - 22 - 8)
        cy = yy + 11
        if isinstance(it, dict) and it.get('icone'):
            out.append(icone(it['icone'], x + 10, cy - 8, 16, '#eef3f6'))
        else:
            out += puce(col.get('puce', 'coche'), x + 11, cy, clair, medaillon)
        for j, l in enumerate(lignes):
            out.append(t(x + 11 + 24, cy + 4.5 + j * 15.5, l, 500, 13, BLANC))
        yy += 8 + 15.5 * len(lignes) + 3
    h = yy - y + 7
    return out, h


def section(sec, y):
    bord, clair, entete, corps, souscarte, medaillon = COULEURS[sec['couleur']]
    x0, w0 = MARGE, W - 2 * MARGE
    # entête : médaillon, titre, séparateur, étiquette ; note à droite
    note = sec.get('note')
    x_titre = x0 + 12 + 46 + 10
    largeur_titre = largeur(sec['titre'], 900, 21, -0.2)
    x_sep = x_titre + largeur_titre + 10
    etiquette = sec.get('etiquette')
    x_note = x_sep + (12 + largeur(etiquette, 800, 13) + 10 if etiquette else 4)
    lignes_note = []
    if note:
        lignes_note = couper(note['texte'], 500, 11.5, x0 + w0 - 10 - x_note)
    h_ent = max(60, 16 + (14 if note and note.get('titre') else 0) + 13.5 * len(lignes_note) + 10)
    colonnes = sec['colonnes']
    gap = 7
    cw = (w0 - 2 * 8 - gap * (len(colonnes) - 1)) / len(colonnes)
    rendus, hauteurs = [], []
    for i, col in enumerate(colonnes):
        cx = x0 + 8 + i * (cw + gap)
        r, h = colonne(col, cx, y + h_ent + 8, cw, sec['couleur'], any(c.get('titre') for c in colonnes))
        rendus.append((cx, r))
        hauteurs.append(h)
    h_corps = max(hauteurs) + 16
    H = h_ent + h_corps
    out = [f'<rect x="{x0}" y="{y:.1f}" width="{w0}" height="{H:.1f}" rx="11" fill="{corps}"/>',
           f'<path d="M{x0} {y + h_ent:.1f} V{y + 11:.1f} a11 11 0 0 1 11 -11 H{x0 + w0 - 11} a11 11 0 0 1 11 11 V{y + h_ent:.1f} Z" fill="{entete}"/>',
           f'<line x1="{x0 + 1.5}" y1="{y + h_ent:.1f}" x2="{x0 + w0 - 1.5}" y2="{y + h_ent:.1f}" stroke="{bord}" stroke-opacity="0.45" stroke-width="1"/>',
           f'<rect x="{x0}" y="{y:.1f}" width="{w0}" height="{H:.1f}" rx="11" fill="none" stroke="{bord}" stroke-width="3.5" stroke-opacity="0.45" filter="url(#lueur)"/>',
           f'<rect x="{x0}" y="{y:.1f}" width="{w0}" height="{H:.1f}" rx="11" fill="none" stroke="{bord}" stroke-width="2"/>']
    cy = y + h_ent / 2
    out.append(f'<circle cx="{x0 + 12 + 23}" cy="{cy:.1f}" r="21" fill="none" stroke="{clair}" stroke-width="4" stroke-opacity="0.35" filter="url(#lueur)"/>')
    out.append(f'<circle cx="{x0 + 12 + 23}" cy="{cy:.1f}" r="21" fill="{medaillon}" stroke="{clair}" stroke-width="2.6"/>')
    out.append(icone(sec['icone'], x0 + 12 + 23 - 12.5, cy - 12.5, 25, clair))
    out.append(t(x_titre, cy + 7.5, sec['titre'], 900, 21, BLANC, espacement=-0.2))
    if etiquette:
        out.append(f'<line x1="{x_sep:.1f}" y1="{cy - 14:.1f}" x2="{x_sep:.1f}" y2="{cy + 14:.1f}" stroke="{clair}" stroke-opacity="0.55" stroke-width="1.2"/>')
        out.append(t(x_sep + 11, cy + 5, etiquette, 800, 13, clair))
    if note:
        yy = cy - (13.5 * len(lignes_note) + (14 if note.get('titre') else 0)) / 2 + 10
        if note.get('titre'):
            out.append(t(x_note, yy, note['titre'], 800, 11.5, clair))
            yy += 14
        for l in lignes_note:
            out.append(t(x_note, yy, l, 500, 11.5, BLANC))
            yy += 13.5
    for (cx, r), h in zip(rendus, hauteurs):
        out.append(f'<rect x="{cx:.1f}" y="{y + h_ent + 8:.1f}" width="{cw:.1f}" height="{max(hauteurs):.1f}" rx="8" fill="{souscarte}" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1"/>')
        out += r
    return out, y + H + 8


def repere(rep, y):
    x0, w0 = MARGE, W - 2 * MARGE
    lignes = couper(rep['titre'] + ' — ' + rep['texte'], 500, 12.5, w0 - 46)
    h = 14 + 16 * len(lignes)
    out = [f'<rect x="{x0}" y="{y:.1f}" width="{w0}" height="{h:.1f}" rx="10" fill="#0f1c27" stroke="#21333f" stroke-width="1.3"/>',
           icone('mdiInformation', x0 + 11, y + h / 2 - 10, 20, '#eef3f6')]
    yy = y + h / 2 - 16 * len(lignes) / 2 + 12
    premier = True
    for l in lignes:
        if premier and l.startswith(rep['titre']):
            reste = l[len(rep['titre']):]
            out.append(f'<text x="{x0 + 38}" y="{yy:.1f}" font-size="12.5"><tspan font-weight="800" fill="{BLANC}">{escape(rep["titre"])}</tspan><tspan font-weight="500" fill="{GRIS_TEXTE}">{escape(reste)}</tspan></text>')
            _employes[800].update(rep['titre'])
            _employes[500].update(reste)
        else:
            out.append(t(x0 + 38, yy, l, 500, 12.5, GRIS_TEXTE))
        premier = False
        yy += 16
    return out, y + h + MARGE


def schema(spec):
    """spec : titre, sous_titre, cartes?, sections, repere?, desc (texte accessible), titre_access."""
    for p in POIDS:
        _employes[p].clear()
    corps = []
    y = 4
    r, y = en_tete(spec['titre'], spec.get('sous_titre'), y)
    corps += r
    if spec.get('cartes'):
        r, y = cartes(spec['cartes'], y)
        corps += r
    for sec in spec['sections']:
        r, y = section(sec, y)
        corps += r
    if spec.get('repere'):
        r, y = repere(spec['repere'], y)
        corps += r
    else:
        y += MARGE - 8
    H = int(round(y))
    fond = (f'<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{FOND_HAUT}"/>'
            f'<stop offset="1" stop-color="{FOND_BAS}"/></linearGradient>'
            f'<radialGradient id="h" cx="0.5" cy="0" r="0.8"><stop offset="0" stop-color="#15324a" stop-opacity="0.55"/>'
            f'<stop offset="1" stop-color="#15324a" stop-opacity="0"/></radialGradient>'
            f'<filter id="lueur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>'
            f'<rect width="{W}" height="{H}" fill="url(#f)"/><rect width="{W}" height="{H}" fill="url(#h)"/>')
    css = polices_css()
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" '
            f'aria-labelledby="t d" font-family="Figtree, \'Segoe UI\', Arial, sans-serif">'
            f'<title id="t">{escape(spec["titre_access"])}</title><desc id="d">{escape(spec["desc"])}</desc>'
            f'<style>{css}</style>{fond}' + ''.join(corps) + '</svg>'), H
