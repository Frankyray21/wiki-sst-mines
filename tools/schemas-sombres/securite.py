# Pilote du bloc 3 (29 septembre 2026) : les figures des captures de cours du wiki Sécurité industrielle, redessinées
# sur fond noir (diagrammes.py). Chaque mot vient de la page où le schéma se pose, au plus raccourci ; un schéma qui
# montre la même chose qu'une capture la remplace (« remplace ») ; sinon il s'ajoute après un repère (« ancre »).
#   SORTIE=/tmp/securite python3 tools/schemas-sombres/securite.py [filtre]
# écrit, par page (SORTIE/<wiki>/<page>/), les SVG et un spec.json pour tools/poser_schemas.mjs.
import json, math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import diagrammes as d

SORTIE = os.environ.get('SORTIE') or os.path.join(os.getcwd(), 'securite')
NB, FI = ' ', ' '


def ty(s):
    """Typographie française : apostrophe courbe, insécable avant « : », fine avant « ; ? ! », guillemets."""
    s = s.replace("'", '’')
    s = re.sub(r' ?:(?=\s|$)', NB + ':', s)
    s = re.sub(r' ?([;?!])(?=\s|$)', FI + r'\1', s)
    s = re.sub(r'«\s*', '«' + NB, s)
    s = re.sub(r'\s*»', NB + '»', s)
    return s


# ------------------------------------------------------------------ Hiérarchie des moyens de prévention
def hierarchie():
    d.nouveau()
    titre, sous = 'Hiérarchie des moyens de prévention', 'Du plus efficace au moins efficace'
    corps, y = d.en_tete(ty(titre), ty(sous))
    niveaux = [('Élimination du danger', None), ('Substitution', 'produit, procédé, équipement'),
               ('Ingénierie', 'encoffrement, ventilation locale'), ('Administratif', 'rotation, formation, procédures'),
               ('EPI', 'dernière barrière')]
    hb, y0, cx, wt, wb = 54, y + 22, d.W / 2 + 14, 408, 150
    larg = lambda yy: wt - (wt - wb) * (yy - y0) / (hb * len(niveaux))
    gris = ['#3a404a', '#343941', '#2e3239', '#282c32', '#23262d']  # du plus clair au plus sombre : l'ordre, sans couleur
    corps.append(d.t(22, y0 - 8, ty('Plus efficace'), 700, 12, d.TEXTE_2))
    for i, (nom, detail) in enumerate(niveaux):
        ya, yb = y0 + i * hb, y0 + (i + 1) * hb
        wa, wbb = larg(ya), larg(yb)
        corps.append(d.poly([(cx - wa / 2, ya), (cx + wa / 2, ya), (cx + wbb / 2, yb), (cx - wbb / 2, yb)], gris[i], d.FOND, 2))
        ymil = (ya + yb) / 2
        if detail:
            corps.append(d.t(cx, ymil - 3, ty(nom), 800, 15, d.TEXTE, 'middle'))
            corps.append(d.t(cx, ymil + 14, ty(detail), 500, 12, d.TEXTE_2, 'middle'))
        else:
            corps.append(d.t(cx, ymil + 5, ty(nom), 800, 15, d.TEXTE, 'middle'))
    yfin = y0 + hb * len(niveaux)
    corps.append(d.fleche(28, y0, 28, yfin, d.TRAIT, 2.4, 10))
    corps.append(d.t(22, yfin + 20, ty('Moins efficace'), 700, 12, d.TEXTE_2))
    r, y = d.repere(ty('LSST art. 2 : élimination à la source ; art. 3 : les EPI ne diminuent en rien l’obligation d’éliminer à la source.'), yfin + 34, ty('Principe directeur'))
    corps += r
    desc = ty('Titre : « Hiérarchie des moyens de prévention », sous-titre « Du plus efficace au moins efficace ». Figure sur fond noir. '
              'Une pyramide inversée de cinq niveaux, du plus efficace en haut au moins efficace en bas : élimination du danger ; '
              'substitution (produit, procédé, équipement) ; ingénierie (encoffrement, ventilation locale) ; administratif (rotation, '
              'formation, procédures) ; EPI (dernière barrière). Une flèche descend de « Plus efficace » à « Moins efficace ». En bas, '
              'principe directeur : LSST art. 2, élimination à la source ; art. 3, les EPI ne diminuent en rien l’obligation d’éliminer à la source.')
    alt = ty('Pyramide inversée de la hiérarchie des moyens de prévention, du plus efficace au moins efficace : élimination du danger, '
             'substitution, ingénierie, administratif, EPI (dernière barrière) ; principe directeur : LSST art. 2 et 3.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ Lignes de défense (Reason)
def reason():
    d.nouveau()
    titre, sous = 'Lignes de défense (Reason)', 'Plusieurs barrières percées s’alignent pour laisser passer le danger'
    corps, y = d.en_tete(ty(titre), ty(sous))
    r, y = d.legende([(d.AMBRE, ty('le danger, jusqu’à l’accident'))], y + 6)
    corps += r
    haut, bas = y + 20, y + 190
    ymil = (haut + bas) / 2 + 6
    barrieres = ['Technique', 'Individuel', 'Organisationnel']
    trous = [[(0, 0.1), (0, 0.9), (0.5, None)], [(0, 0.2), (0, 0.84), (0.5, None)], [(0, 0.06), (0, 0.8), (0.5, None)]]
    for i, nom in enumerate(barrieres):
        x = 112 + i * 104
        pente = 22
        corps.append(d.poly([(x, haut + pente), (x + 46, haut), (x + 46, bas - pente), (x, bas)], '#2e3239', '#4d545e', 1.6))
        corps.append(d.poly([(x + 46, haut), (x + 58, haut + 5), (x + 58, bas - pente + 5), (x + 46, bas - pente)], '#23262d', '#4d545e', 1.2))
        for fx, fy in trous[i]:
            yy = ymil if fy is None else haut + pente + (bas - haut - 2 * pente) * fy
            corps.append(f'<ellipse cx="{x + 23:.1f}" cy="{yy:.1f}" rx="9" ry="12" fill="{d.FOND}" stroke="#4d545e" stroke-width="1"/>')
        corps.append(d.t(x + 26, bas + 22, ty(nom), 700, 13, d.TEXTE, 'middle'))
    corps.append(d.t(40, ymil - 16, ty('Danger'), 800, 13, d.AMBRE, 'middle'))
    corps.append(d.fleche(22, ymil, 384, ymil, d.AMBRE, 3, 12))
    r, h = d.boite_texte(388, ymil - 20, 78, ty('Accident'), None, d.CARTE, d.AMBRE, 13.5, pad=10)
    corps += r
    r, y = d.repere(ty('un accident résulte de défaillances combinées au niveau technique, individuel et organisationnel.'), bas + 38, ty('Le modèle de Reason'))
    corps += r
    desc = ty('Titre : « Lignes de défense (Reason) », sous-titre « Plusieurs barrières percées s’alignent pour laisser passer le danger ». '
              'Figure sur fond noir. Sous le titre, la légende : l’ambre marque le danger, jusqu’à l’accident. Trois barrières percées, '
              'nommées technique, individuel et organisationnel ; une flèche ambre partie de « Danger » traverse un trou de chaque barrière, '
              'alignés, et atteint « Accident ». En bas : selon le modèle de Reason, un accident résulte de défaillances combinées au niveau '
              'technique, individuel et organisationnel.')
    alt = ty('Lignes de défense de Reason : le danger traverse les trous alignés de trois barrières (technique, individuel, '
             'organisationnel) jusqu’à l’accident.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ Diagramme d'Ishikawa (6M)
def ishikawa():
    d.nouveau()
    titre, sous = 'Diagramme d’Ishikawa', 'Classer les causes possibles d’un effet par rubriques (6M)'
    corps, y = d.en_tete(ty(titre), ty(sous))
    haut = [('Matériel', 'machines, équipements'), ('Méthode', 'tâches, procédures'), ('Main-d’œuvre', 'comportements, formation')]
    bas = [('Milieu', 'environnement'), ('Matière', 'intrants'), ('Management', 'organisation')]
    yb = y + 16            # haut des étiquettes du haut
    ym = yb + 44 + 70      # arête centrale
    yl = ym + 70           # haut des étiquettes du bas
    xs = [16, 132, 248]    # colonne de chaque rubrique (étiquettes de 110 de large)
    for x, (nom, det) in zip(xs, haut):
        r, h = d.boite_texte(x, yb, 110, ty(nom), ty(det), d.CARTE, d.BORD, 13.5, 11, 7)
        corps += r
        corps.append(d.trait(x + 55, yb + h, x + 100, ym, d.TRAIT, 2))
    for x, (nom, det) in zip(xs, bas):
        r, h = d.boite_texte(x, yl, 110, ty(nom), ty(det), d.CARTE, d.BORD, 13.5, 11, 7)
        corps += r
        corps.append(d.trait(x + 55, yl, x + 100, ym, d.TRAIT, 2))
    corps.append(d.fleche(14, ym, 372, ym, d.TRAIT, 3, 11))
    r, h = d.boite_texte(376, ym - 18, 90, ty('Effet'), None, d.CARTE_2, d.TEXTE_2, 14, pad=9)
    corps += r
    r, y = d.repere(ty('équipe pluridisciplinaire, remue-méninges, classement consensuel par rubrique, puis priorisation.'), yl + 62, ty('Construction'))
    corps += r
    desc = ty('Titre : « Diagramme d’Ishikawa », sous-titre « Classer les causes possibles d’un effet par rubriques (6M) ». Figure sur fond noir. '
              'Une arête centrale mène à « Effet ». Six arêtes y aboutissent, une par rubrique : en haut, matériel (machines, équipements), '
              'méthode (tâches, procédures) et main-d’œuvre (comportements, formation) ; en bas, milieu (environnement), matière (intrants) '
              'et management (organisation). En bas : construction en équipe pluridisciplinaire, remue-méninges, classement consensuel par '
              'rubrique, puis priorisation.')
    alt = ty('Diagramme d’Ishikawa en arête de poisson : six rubriques (matériel, méthode, main-d’œuvre, milieu, matière, management) '
             'mènent à l’effet.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ Nœud papillon
def noeud_papillon():
    d.nouveau()
    titre, sous = 'Nœud papillon', 'Autour d’un événement redouté central'
    corps, y = d.en_tete(ty(titre), ty(sous))
    r, y = d.legende([(d.AMBRE, ty('l’événement redouté'))], y + 6)
    corps += r
    ytete = y + 14
    corps.append(d.t(80, ytete + 12, ty('En amont : causes'), 800, 13.5, d.TEXTE, 'middle'))
    corps.append(d.t(80, ytete + 28, ty('arbre de défaillance'), 500, 11.5, d.TEXTE_2, 'middle'))
    corps.append(d.t(400, ytete + 12, ty('En aval : conséquences'), 800, 13.5, d.TEXTE, 'middle'))
    corps.append(d.t(400, ytete + 28, ty('arbre d’événements'), 500, 11.5, d.TEXTE_2, 'middle'))
    y0 = ytete + 44
    ys = [y0, y0 + 52, y0 + 104]
    ymil = y0 + 52 + 17
    cx = d.W / 2
    # les deux ailes du papillon
    corps.append(d.poly([(24, y0 - 8), (cx - 42, ymil), (24, y0 + 142)], '#1f2227', '#2b3038', 1))
    corps.append(d.poly([(d.W - 24, y0 - 8), (cx + 42, ymil), (d.W - 24, y0 + 142)], '#1f2227', '#2b3038', 1))
    for yy in ys:
        r, h = d.boite_texte(26, yy, 110, ty('Cause'), None, d.CARTE, d.BORD, 13, pad=8)
        corps += r
        corps.append(d.fleche(136, yy + 17, cx - 46, ymil, d.TRAIT, 2, 8))
        r, h = d.boite_texte(d.W - 136, yy, 110, ty('Conséquence'), None, d.CARTE, d.BORD, 13, pad=8)
        corps += r
        corps.append(d.fleche(cx + 46, ymil, d.W - 140, yy + 17, d.TRAIT, 2, 8))
    corps.append(d.poly([(cx, ymil - 46), (cx + 46, ymil), (cx, ymil + 46), (cx - 46, ymil)], d.CARTE_2, d.AMBRE, 2.4))
    corps.append(d.t(cx, ymil - 4, ty('Événement'), 800, 12, d.TEXTE, 'middle'))
    corps.append(d.t(cx, ymil + 11, ty('redouté'), 800, 12, d.TEXTE, 'middle'))
    r, y = d.repere(ty('incendie d’usine de peinture en Allemagne (2008), fuite de CO2, 107 intoxications.'), y0 + 162, ty('Exemple historique'))
    corps += r
    desc = ty('Titre : « Nœud papillon », sous-titre « Autour d’un événement redouté central ». Figure sur fond noir. Sous le titre, la légende : '
              'l’ambre marque l’événement redouté. À gauche, en amont, les causes (arbre de défaillance) : trois cases « Cause » dont les '
              'flèches convergent vers l’événement redouté, au centre. À droite, en aval, les conséquences (arbre d’événements) : trois flèches '
              'partent de l’événement redouté vers trois cases « Conséquence ». En bas, exemple historique : incendie d’usine de peinture en '
              'Allemagne (2008), fuite de CO2, 107 intoxications.')
    alt = ty('Nœud papillon : en amont, les causes (arbre de défaillance) convergent vers l’événement redouté central ; en aval, les '
             'conséquences (arbre d’événements) en partent.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ ISO 12100 : méthode en trois étapes
def iso12100_etapes():
    d.nouveau()
    titre, sous = 'ISO 12100 : méthode en trois étapes', 'Sécurité machine (art. 6.1)'
    corps, y = d.en_tete(ty(titre), ty(sous))
    etapes = [('Mesures de prévention intrinsèque', 'à la conception', '« Première et plus importante étape »'),
              ('Protection et mesures de prévention complémentaires', 'protecteurs et dispositifs', None),
              ('Informations pour l’utilisation', 'formation, signalisation, manuels', 'quand les étapes précédentes n’épuisent pas le risque')]
    y += 10
    x, w, pas = 16, 300, 74
    depart = None   # bas du rond numéroté de l'étape précédente
    for i, (nom, det, note) in enumerate(etapes):
        xx = x + i * pas
        cx, cy = xx + 16, y + 20   # rond numéroté de l'étape
        if depart:
            # coude : descend du rond précédent, passe au-dessus de cette étape, descend jusqu'à son rond
            corps.append(d.chemin(f'M{depart[0]:.1f},{depart[1]:.1f} V{y - 6:.1f} H{cx:.1f} V{cy - 14:.1f}', d.TRAIT, 2))
            corps.append(d.pointe(cx, cy - 13, math.pi / 2, d.TRAIT, 8))
        r, h = d.boite_texte(xx + 34, y, w - 34, ty(nom), ty(det), d.CARTE, d.BORD, 14, 11.5, 9)
        corps += r
        corps.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="13" fill="{d.CARTE_2}" stroke="{d.TRAIT}" stroke-width="1.6"/>')
        corps.append(d.t(cx, cy + 5, str(i + 1), 800, 14, d.TEXTE, 'middle'))
        yn = y + h
        if note:
            e, hn = d.lignes(xx + 34 + (w - 34) / 2, yn + 15, ty(note), w - 40, 600, 11.5, d.TEXTE_3)
            corps += e
            yn += hn + 4
        depart = (cx, cy + 13)
        y = yn + 12
    r, y = d.repere(ty('la modification 2021 de la LSST (art. 59 et 61.2) rend cette hiérarchie obligatoire.'), y + 4, ty('Au Québec'))
    corps += r
    desc = ty('Titre : « ISO 12100 : méthode en trois étapes », sous-titre « Sécurité machine (art. 6.1) ». Figure sur fond noir. Trois étapes '
              'numérotées, en escalier : 1, mesures de prévention intrinsèque, à la conception, « première et plus importante étape » ; '
              '2, protection et mesures de prévention complémentaires (protecteurs et dispositifs) ; 3, informations pour l’utilisation '
              '(formation, signalisation, manuels), quand les étapes précédentes n’épuisent pas le risque. En bas : au Québec, la modification '
              '2021 de la LSST (art. 59 et 61.2) rend cette hiérarchie obligatoire.')
    alt = ty('Méthode en trois étapes de l’ISO 12100 : prévention intrinsèque à la conception, puis protection et mesures complémentaires, '
             'puis informations pour l’utilisation.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ Démarche ISO 12100 (itérative)
def demarche_iso12100():
    d.nouveau()
    titre, sous = 'Démarche ISO 12100', 'Méthode itérative en quatre étapes'
    corps, y = d.en_tete(ty(titre), ty(sous))
    y += 8
    x, w = 70, 300
    etapes = [('Déterminer les limites', 'de la machine ou du système : espace, temps, usage prévu, mauvais usage raisonnablement prévisible'),
              ('Identifier les phénomènes dangereux', None), ('Estimer le risque', 'par scénario')]
    haut_boucle = y
    centres = []
    for i, (nom, det) in enumerate(etapes):
        r, h = d.boite_texte(x, y, w, ty(nom), ty(det) if det else None, d.CARTE, d.BORD, 14, 11.5, 9)
        corps += r
        corps.append(d.t(x - 14, y + h / 2 + 5, str(i + 1), 800, 14, d.TEXTE_3, 'middle'))
        centres.append((y, h))
        y += h
        corps.append(d.fleche(x + w / 2, y, x + w / 2, y + 22, d.TRAIT, 2, 8))
        y += 22
    # 4 : évaluer (losange)
    lh, lw = 46, 150
    cx, cy = x + w / 2, y + lh
    corps.append(d.poly([(cx, cy - lh), (cx + lw, cy), (cx, cy + lh), (cx - lw, cy)], d.CARTE_2, d.BORD, 1.6))
    corps.append(d.t(x - 14, cy + 5, '4', 800, 14, d.TEXTE_3, 'middle'))
    corps.append(d.t(cx, cy - 5, ty('Évaluer le risque :'), 700, 13.5, d.TEXTE, 'middle'))
    corps.append(d.t(cx, cy + 13, ty('tolérable ?'), 700, 13.5, d.TEXTE, 'middle'))
    # oui : fin de la démarche
    corps.append(d.fleche(cx + lw, cy, cx + lw + 34, cy, d.TRAIT, 2, 8))
    corps.append(d.t(cx + lw + 8, cy - 8, ty('Oui'), 700, 12, d.TEXTE_2))
    corps.append(f'<circle cx="{cx + lw + 44:.1f}" cy="{cy:.1f}" r="8" fill="{d.TEXTE_2}"/>')
    # non : réduction, puis on recommence
    yr = cy + lh + 24
    corps.append(d.fleche(cx, cy + lh, cx, yr, d.TRAIT, 2, 8))
    corps.append(d.t(cx + 8, cy + lh + 16, ty('Non'), 700, 12, d.TEXTE_2))
    r, h = d.boite_texte(x, yr, w, ty('Appliquer la hiérarchie de réduction'), None, d.CARTE, d.BORD, 14, pad=10)
    corps += r
    ymr = yr + h / 2
    xg = 28
    corps.append(d.chemin(f'M{x:.1f},{ymr:.1f} H{xg:.1f} V{haut_boucle + centres[0][1] / 2:.1f}', d.TRAIT, 2))
    corps.append(d.fleche(xg, haut_boucle + centres[0][1] / 2, x - 26, haut_boucle + centres[0][1] / 2, d.TRAIT, 2, 8))
    corps.append(f'<text x="{xg - 8:.1f}" y="{(ymr + haut_boucle) / 2:.1f}" font-weight="600" font-size="11.5" fill="{d.TEXTE_2}" text-anchor="middle" transform="rotate(-90 {xg - 8:.1f} {(ymr + haut_boucle) / 2:.1f})">{ty("puis recommencer")}</text>')
    d.kit._employes[600].update(ty('puis recommencer'))
    y = yr + h + 16
    desc = ty('Titre : « Démarche ISO 12100 », sous-titre « Méthode itérative en quatre étapes ». Figure sur fond noir. Un logigramme : '
              '1, déterminer les limites de la machine ou du système (espace, temps, usage prévu, mauvais usage raisonnablement prévisible) ; '
              '2, identifier les phénomènes dangereux ; 3, estimer le risque, par scénario ; 4, évaluer le risque : tolérable ? Si oui, la '
              'démarche s’arrête. Si non : appliquer la hiérarchie de réduction, puis recommencer à l’étape 1.')
    alt = ty('Logigramme de la démarche ISO 12100 : déterminer les limites, identifier les phénomènes dangereux, estimer le risque, '
             'évaluer s’il est tolérable ; sinon, appliquer la hiérarchie de réduction puis recommencer.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ Chaîne accidentelle
def chaine():
    d.nouveau()
    titre, sous = 'Chaîne accidentelle', 'Pour chaque scénario'
    corps, y = d.en_tete(ty(titre), ty(sous))
    y += 8
    x, w = 16, 268
    maillons = [('Phénomène dangereux', 'source potentielle de dommage'),
                ('Situation dangereuse', 'personne exposée à au moins un phénomène'),
                ('Événement dangereux', 'susceptible de causer un dommage : défaillance, erreur humaine, défaut organisationnel'),
                ('Dommage', 'blessure physique ou atteinte à la santé')]
    y_fleche_evit = None
    for i, (nom, det) in enumerate(maillons):
        r, h = d.boite_texte(x, y, w, ty(nom), ty(det), d.CARTE, d.BORD, 14.5, 11.5, 9)
        corps += r
        y += h
        if i < len(maillons) - 1:
            corps.append(d.fleche(x + w / 2, y, x + w / 2, y + 26, d.TRAIT, 2.2, 9))
            if i == 2:
                y_fleche_evit = y + 13
            y += 26
    # possibilité d'évitement, en marge du dernier passage
    xe, we = x + w + 22, d.W - (x + w + 22) - 16
    r, he = d.boite_texte(xe, y_fleche_evit - 60, we, ty('Possibilité d’évitement'), ty('qui est exposé (formation), temps de réaction humain vs temps d’action du phénomène, conscience du risque'), d.CARTE_2, d.BORD, 13, 11, 8)
    corps += r
    corps.append(d.trait(xe, y_fleche_evit, x + w / 2 + 6, y_fleche_evit, d.TEXTE_3, 1.6, '4 4'))
    r, y = d.repere(ty('« pour quelle raison le travailleur se trouve-t-il là ? »'), y + 16, ty('À demander'))
    corps += r
    desc = ty('Titre : « Chaîne accidentelle », sous-titre « Pour chaque scénario ». Figure sur fond noir. Quatre maillons reliés '
              'par des flèches : phénomène dangereux (source potentielle de dommage) ; situation dangereuse (personne exposée à au moins un '
              'phénomène) ; événement dangereux (susceptible de causer un dommage : défaillance, erreur humaine, défaut organisationnel) ; '
              'dommage (blessure physique ou atteinte à la santé). En marge du passage de l’événement au dommage, la possibilité d’évitement : '
              'qui est exposé (formation), temps de réaction humain contre temps d’action du phénomène, conscience du risque. En bas, à '
              'demander : « pour quelle raison le travailleur se trouve-t-il là ? »')
    alt = ty('Chaîne accidentelle : phénomène dangereux, situation dangereuse, événement dangereux, dommage, avec la possibilité '
             'd’évitement entre l’événement et le dommage.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ Estimation du risque (IRSST/CNESST)
def estimation():
    d.nouveau()
    titre, sous = 'Estimation du risque', 'Outil IRSST/CNESST : quatre facteurs combinés en indice'
    corps, y = d.en_tete(ty(titre), ty(sous))
    y += 8
    facteurs = [('G', 'Gravité du dommage', ['G1 : lésion légère réversible', '(premiers soins)', 'G2 : lésion grave irréversible', '(membre brisé, décès)']),
                ('F', 'Fréquence/durée d’exposition', ['F1 : rare ou courte', '(< 1 fois/quart)', 'F2 : fréquente à continue', '(plusieurs fois/jour)']),
                ('O', 'Probabilité d’occurrence de l’événement', ['O1 : très faible (technologie éprouvée)', 'O2 : faible (défaillance ≥ 10^{–5} /h', 'ou personne qualifiée)', 'O3 : élevée (défaillance ≥ 10^{–3} /h', 'ou personne non formée)']),
                ('P', 'Possibilité d’éviter le dommage', ['P1 : possible dans certaines', 'conditions', 'P2 : impossible ou rarement', 'possible'])]
    wc, gap = 218, 12
    for rang in (0, 1):
        hauteurs = []
        blocs = []
        for col in (0, 1):
            lettre, nom, niveaux = facteurs[rang * 2 + col]
            xx = 16 + col * (wc + gap)
            e = []
            e.append(f'<circle cx="{xx + 22:.1f}" cy="{y + 22:.1f}" r="13" fill="{d.CARTE_2}" stroke="{d.TRAIT}" stroke-width="1.6"/>')
            e.append(d.t(xx + 22, y + 27, lettre, 800, 14, d.TEXTE, 'middle'))
            el, hn = d.lignes(xx + 42, y + 20, ty(nom), wc - 50, 700, 13, d.TEXTE, 'start', 16)
            e += el
            yy = y + max(52, 26 + hn)   # sous le rond de la lettre et sous le nom
            if nom.startswith('Probabilité'):
                e.append(d.t(xx + 42, yy, ty('(pas du dommage)'), 600, 11, d.TEXTE_3))
                yy += 16
            for n in niveaux:
                e.append(d.t_riche(xx + 12 + (0 if n[:1] in 'GFOP' and n[1:2].isdigit() else 12), yy, ty(n), 500, 11.5, d.TEXTE_2))
                yy += 15
            hauteurs.append(yy - y + 4)
            blocs.append((xx, e))
        h = max(hauteurs)
        for xx, e in blocs:
            corps.append(d.rect(xx, y, wc, h))
            corps += e
        y += h + gap
    r, y = d.repere(ty('G2 + F2 + O2 + P2 = indice de risque 5.'), y + 2, ty('Exemple'))
    corps += r
    desc = ty('Titre : « Estimation du risque », sous-titre « Outil IRSST/CNESST : quatre facteurs combinés en indice ». Figure sur fond noir. '
              'Quatre cartes. G, gravité du dommage : G1, lésion légère réversible (premiers soins) ; G2, lésion grave irréversible (membre '
              'brisé, décès). F, fréquence ou durée d’exposition : F1, rare ou courte (moins d’une fois par quart) ; F2, fréquente à continue '
              '(plusieurs fois par jour). O, probabilité d’occurrence de l’événement, pas du dommage : O1, très faible (technologie éprouvée) ; '
              'O2, faible (défaillance d’au moins 10 puissance moins 5 par heure, ou personne qualifiée) ; O3, élevée (défaillance d’au moins '
              '10 puissance moins 3 par heure, ou personne non formée). P, possibilité d’éviter le dommage : P1, possible dans certaines '
              'conditions ; P2, impossible ou rarement possible. En bas, exemple : G2 + F2 + O2 + P2 = indice de risque 5.')
    alt = ty('Les quatre facteurs de l’outil IRSST/CNESST, combinés en indice : gravité (G1, G2), fréquence d’exposition (F1, F2), '
             'probabilité d’occurrence (O1 à O3), possibilité d’éviter (P1, P2) ; exemple : G2 + F2 + O2 + P2 = indice 5.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ Appréciation puis traitement du risque
def appreciation_traitement():
    d.nouveau()
    titre, sous = 'Appréciation et traitement du risque', 'Selon l’ISO Guide 73'
    corps, y = d.en_tete(ty(titre), ty(sous))
    y += 8
    xf, wf = 16, d.W - 32
    etapes = [('Identification', None), ('Analyse', 'descriptive'), ('Évaluation', 'décisionnelle')]
    hf = 136
    corps.append(d.rect(xf, y, wf, hf, '#1a1d22', d.BORD, 12, 1.4, '6 5'))
    corps.append(d.t(xf + 14, y + 22, ty('Appréciation du risque'), 800, 13.5, d.TEXTE))
    corps.append(d.t(xf + wf - 14, y + 22, ty('plus large'), 600, 11.5, d.TEXTE_3, 'end'))
    wb, gap = 120, 23
    x0 = xf + (wf - 3 * wb - 2 * gap) / 2
    for i, (nom, det) in enumerate(etapes):
        xx = x0 + i * (wb + gap)
        r, h = d.boite_texte(xx, y + 42, wb, ty(nom), ty(det) if det else None, d.CARTE, d.BORD, 14, 11.5, 10)
        corps += r
        if i < 2:
            corps.append(d.fleche(xx + wb + 3, y + 42 + 24, xx + wb + gap - 3, y + 42 + 24, d.TRAIT, 2, 8))
    y += hf
    corps.append(d.fleche(d.W / 2, y, d.W / 2, y + 28, d.TRAIT, 2.2, 9))
    y += 28
    r, h = d.boite_texte(110, y, d.W - 220, ty('Traitement du risque'), ty('modifier (réduire) un risque'), d.CARTE, d.BORD, 14.5, 12, 10)
    corps += r
    y += h + 14
    r, y = d.repere(ty('trois grandes catégories de techniques selon l’étape ciblée : identification, analyse, évaluation.'), y, ty('IEC/ISO 31010'))
    corps += r
    desc = ty('Titre : « Appréciation et traitement du risque », sous-titre « Selon l’ISO Guide 73 ». Figure sur fond noir. Un cadre « Appréciation '
              'du risque », plus large, contient trois étapes reliées par des flèches : identification, analyse (descriptive), évaluation '
              '(décisionnelle). Une flèche mène ensuite au traitement du risque : modifier (réduire) un risque. En bas, IEC/ISO 31010 : '
              'trois grandes catégories de techniques selon l’étape ciblée : identification, analyse, évaluation.')
    alt = ty('L’appréciation du risque (identification, analyse, évaluation) précède le traitement du risque, qui le modifie ou le réduit.')
    return d.svg(corps, y, ty(titre), desc), alt


# ------------------------------------------------------------------ ALARP
def alarp():
    d.nouveau()
    titre, sous = 'ALARP : trois zones', 'As Low As Reasonably Practicable'
    corps, y = d.en_tete(ty(titre), ty(sous))
    y += 12
    zones = [('Intolérable', 'à corriger sauf circonstances exceptionnelles', d.ROSE),
             ('Zone ALARP', 'réduire si raisonnablement possible', d.AMBRE),
             ('Largement acceptable', 'pas d’action requise', d.VERT)]
    hb, xg, wt, wb = 70, 20, 250, 70
    larg = lambda yy: wt - (wt - wb) * (yy - y) / (hb * 3)
    cx = xg + wt / 2
    for i, (nom, action, c) in enumerate(zones):
        ya, yb = y + i * hb, y + (i + 1) * hb
        wa, wbb = larg(ya), larg(yb)
        corps.append(d.poly([(cx - wa / 2, ya), (cx + wa / 2, ya), (cx + wbb / 2, yb), (cx - wbb / 2, yb)], c, d.FOND, 2.5).replace('/>', ' fill-opacity="0.28"/>'))
        corps.append(d.t(cx, (ya + yb) / 2 + 5, ty(nom), 800, 13.5 if i < 2 else 12.5, d.TEXTE, 'middle'))
        corps.append(f'<rect x="{xg + wt + 18:.1f}" y="{(ya + yb) / 2 - 20:.1f}" width="6" height="40" rx="3" fill="{c}"/>')
        e, h = d.lignes(xg + wt + 34, (ya + yb) / 2 - 3, ty(action), d.W - (xg + wt + 34) - 16, 600, 12.5, d.TEXTE_2, 'start', 16)
        corps += e
    y += 3 * hb + 16
    r, y = d.repere(ty('porter un jugement : le risque est-il tolérable ?'), y, ty('Évaluer'))
    corps += r
    desc = ty('Titre : « ALARP : trois zones », sous-titre « As Low As Reasonably Practicable ». Figure sur fond noir. Un triangle pointe en bas, '
              'en trois bandes, chacune de sa couleur, nommée sur la bande : en haut, en rose, « Intolérable » : à corriger sauf circonstances '
              'exceptionnelles ; au milieu, en ambre, « Zone ALARP » : réduire si raisonnablement possible ; en bas, en vert, « Largement '
              'acceptable » : pas d’action requise. En bas : évaluer, c’est porter un jugement : le risque est-il tolérable ?')
    alt = ty('Les trois zones ALARP : intolérable (à corriger sauf circonstances exceptionnelles), zone ALARP (réduire si raisonnablement '
             'possible), largement acceptable (pas d’action requise).')
    return d.svg(corps, y, ty(titre), desc), alt


SCHEMAS = {
    'hierarchie': hierarchie, 'iso12100-etapes': iso12100_etapes,
    'reason': reason, 'ishikawa': ishikawa, 'noeud-papillon': noeud_papillon,
    'demarche-iso12100': demarche_iso12100, 'chaine': chaine, 'estimation': estimation,
    'appreciation-traitement': appreciation_traitement, 'alarp': alarp,
}

# Pose, page par page : « remplace » (capture de cours qui montre la même chose ; sans « ancre », le schéma prend
# sa place exacte), « ancre » (texte visible après lequel le schéma se pose).
PRECAUTIONS = ('Schémas dessinés d’après le texte de la page seulement (aucun mot, aucun chiffre d’ailleurs) ; pas de '
               'validation spécialisée. Les captures remplacées restent dans le vault : seule leur ligne quitte la note.')
# Les deux schémas de « Hiérarchie des moyens de prévention », que la page du même nom du wiki Hygiène industrielle,
# au même texte et aux mêmes captures, reprend aussi (29 septembre 2026, accord de Frank).
HIERARCHIE = [
    dict(sujet='hierarchie', remplace='pasted-image-20240923184314',
         legende='Les cinq niveaux de la hiérarchie, du plus efficace au moins efficace, avec les exemples de la '
                 'page ; l’EPI est la dernière barrière. Le principe directeur de la LSST : éliminer à la source.',
         sources='D’après la section « Logique générale de la hiérarchie » de cette page (liste et principe '
                 'directeur). Schéma de principe.'),
    dict(sujet='iso12100-etapes', remplace='pasted-image-20250301155751',
         legende='La méthode en trois étapes de l’ISO 12100 (art. 6.1) en sécurité machine : la prévention '
                 'intrinsèque d’abord, puis la protection, et l’information quand les étapes précédentes '
                 'n’épuisent pas le risque.',
         sources='D’après l’introduction et les sections « Logique générale de la hiérarchie », « Étape 1 » et '
                 '« Étape 3 » de cette page. Schéma de principe.'),
]
WIKIS = {'securite': ('Wiki Sécurité industrielle', 'Sécurité industrielle'),
         'hygiene': ('Wiki Hygiène industrielle', 'Hygiène industrielle')}
PAGES = {
    'securite/theorie-causale-des-accidents': dict(
        titre='Accidents et incidents, théorie causale',
        portee='trois schémas sur fond noir (lignes de défense de Reason, diagramme d’Ishikawa, nœud papillon) ; les deux '
               'premiers remplacent des captures de cours (figure adaptée de Reason, diapositive UQAT).',
        schemas=[
            dict(sujet='reason', remplace='pasted-image-20250112231542',
                 legende='Selon la page, le modèle de Reason est aujourd’hui la référence : plusieurs barrières percées '
                         's’alignent pour laisser passer le danger, et l’accident résulte de défaillances combinées au niveau '
                         'technique, individuel et organisationnel. Une barrière par niveau ; les trous sont de principe.',
                 sources='D’après le tableau « Modèles causaux » (ligne « Lignes de défense ») et le paragraphe qui le suit, '
                         'dans cette page ; cadre conceptuel : Reason, 1990 (tableau « Ressources »). Schéma de principe.'),
            dict(sujet='ishikawa', remplace='pasted-image-20250112233919',
                 legende='Le diagramme d’Ishikawa, en arête de poisson, classe les causes possibles d’un effet par '
                         'rubriques ; ici, les six rubriques (6M) que la page énumère. Outil collectif, complémentaire de '
                         'l’arbre des causes.',
                 sources='D’après la section « Diagramme d’Ishikawa » de cette page. Schéma de principe.'),
            dict(sujet='noeud-papillon', ancre="Nœud papillon : combine arbre de défaillance (en amont, causes)",
                 legende='Le nœud papillon combine, autour d’un événement redouté central, l’arbre de défaillance en amont '
                         '(les causes) et l’arbre d’événements en aval (les conséquences). Trois causes et trois '
                         'conséquences, pour le principe.',
                 sources='D’après la section « Arbre de défaillance et nœud papillon » de cette page. Schéma de principe.'),
        ]),
    'securite/hierarchie-des-moyens-de-prevention': dict(
        titre='Hiérarchie des moyens de prévention',
        portee='deux schémas sur fond noir (hiérarchie des moyens de prévention, méthode en trois étapes de l’ISO 12100), '
               'qui remplacent deux captures de cours (figure de manuel, « Vue améliorée de la méthode »).',
        schemas=HIERARCHIE),
    'securite/appreciation-du-risque': dict(
        titre='Appréciation du risque, méthodes',
        portee='cinq schémas sur fond noir (démarche ISO 12100, chaîne accidentelle, estimation IRSST/CNESST, appréciation '
               'et traitement du risque, zones ALARP) ; quatre remplacent des captures de cours, et deux de ces schémas '
               'se posent dans la section qu’ils illustrent (démarche, chaîne accidentelle).',
        schemas=[
            dict(sujet='demarche-iso12100', remplace='pasted-image-20250119002441',
                 ancre='Si non : appliquer la hiérarchie de réduction puis recommencer.',
                 legende='La démarche ISO 12100 est itérative : déterminer les limites, identifier les phénomènes '
                         'dangereux, estimer le risque par scénario, puis évaluer s’il est tolérable ; sinon, appliquer la '
                         'hiérarchie de réduction et recommencer.',
                 sources='D’après la section « Démarche ISO 12100 » de cette page. Hiérarchie de réduction : '
                         '{{lien:w/securite/hierarchie-des-moyens-de-prevention.html|Hiérarchie des moyens de prévention}}. '
                         'Schéma de principe.'),
            dict(sujet='chaine', remplace='pasted-image-20250127212816', ancre='Chaîne accidentelle',
                 legende='Les quatre maillons de la chaîne accidentelle, pour chaque scénario, du phénomène dangereux au '
                         'dommage ; la possibilité d’évitement est celle d’éviter le dommage. Certains phénomènes ne '
                         'laissent aucune chance (électricité, explosion).',
                 sources='D’après la section « Chaîne accidentelle » de cette page (définitions et possibilité '
                         'd’évitement). Schéma de principe.'),
            dict(sujet='estimation', remplace='pasted-image-20250127205551',
                 legende='Les quatre facteurs de l’outil IRSST/CNESST et leurs niveaux, tels que la page les donne ; '
                         'combinés, ils forment un indice de risque, dont la page donne un exemple. O porte sur '
                         'l’occurrence de l’événement, pas du dommage.',
                 sources='D’après la section « Estimation du risque (outil IRSST/CNESST) » de cette page. Schéma de '
                         'principe : la table qui combine les facteurs en indice n’est pas reproduite.'),
            dict(sujet='appreciation-traitement', remplace='pasted-image-20250125150328',
                 legende='Dans la terminologie de la page, l’appréciation du risque, plus large, regroupe identification, '
                         'analyse (descriptive) et évaluation (décisionnelle) ; le traitement du risque le modifie (le '
                         'réduit). Les techniques de l’IEC/ISO 31010 se rangent selon l’étape ciblée.',
                 sources='D’après le tableau de la section « Cadre normatif et terminologie » et la section « Catalogue '
                         'd’outils IEC 31010 » de cette page. Pour le traitement : '
                         '{{lien:w/securite/gestion-des-risques.html|Gestion des risques en entreprise}}. Schéma de principe.'),
            dict(sujet='alarp', ancre='Largement acceptable : pas d’action requise.',
                 legende='Les trois zones ALARP et l’action que la page associe à chacune ; évaluer, c’est juger si le '
                         'risque est tolérable. Les couleurs distinguent les zones ; la largeur des bandes est de principe.',
                 sources='D’après la section « Évaluation du risque, ALARP et SFAIRP » de cette page. Schéma de principe : '
                         'aucun seuil entre les zones.'),
        ]),
    'hygiene/hierarchie-des-moyens-de-prevention': dict(
        titre='Hiérarchie des moyens de prévention',
        portee='les deux schémas sur fond noir de la page Sécurité du même nom, au même texte (hiérarchie des moyens de '
               'prévention, méthode en trois étapes de l’ISO 12100), qui remplacent les deux mêmes captures de cours '
               '(figure de manuel, « Vue améliorée de la méthode ») ; mêmes fichiers.',
        schemas=HIERARCHIE),
}


def construire(filtre=''):
    """Écrit, dans SORTIE/<wiki>/<page>/, les SVG et le spec.json de tools/poser_schemas.mjs."""
    for cle, p in PAGES.items():
        wiki, page = cle.split('/')
        nom_wiki, nom_court = WIKIS[wiki]
        spec = {'page': f'w/{cle}.html', 'note': {'titre': p['titre'], 'wiki': nom_wiki},
                'lot': {'portee': ty(f'Page « {p["titre"]} » ({nom_court}) : ') + ty(p['portee']), 'precautions': ty(PRECAUTIONS)},
                'schemas': []}
        dossier = os.path.join(SORTIE, wiki, page)
        for x in p['schemas']:
            if filtre and filtre not in cle + '-' + x['sujet']:
                continue
            (svg, H), alt = SCHEMAS[x['sujet']]()
            # nommé d'après la page seule : deux pages du même nom et au même texte partagent le fichier, et le vault
            # n'en garde qu'un (Infographies/)
            fichier = f'wiki-{page}-{x["sujet"]}-v1.svg'
            os.makedirs(dossier, exist_ok=True)
            open(os.path.join(dossier, fichier), 'w', encoding='utf-8').write(svg)
            s = {'fichier': fichier, 'sombre': True, 'alt': alt, 'legende': ty(x['legende']), 'sources': ty(x['sources'])}
            if x.get('ancre'):
                s['ancre'] = x['ancre']
            if x.get('remplace'):
                s['remplace'] = x['remplace']
            spec['schemas'].append(s)
            print(f'{fichier} : {H} de haut, {len(svg.encode()) // 1024} Ko')
        if spec['schemas']:
            json.dump(spec, open(os.path.join(dossier, 'spec.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    construire(sys.argv[1] if len(sys.argv) > 1 else '')
