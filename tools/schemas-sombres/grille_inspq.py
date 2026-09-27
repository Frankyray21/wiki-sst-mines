# Grille INSPQ (27 septembre 2026) : les 12 indicateurs de la Grille d'identification de risques psychosociaux du
# travail, en deux parties, d'après la page corrigée (lot 2026-09-27-corr-grille-inspq-didentification-des-rps) et
# le Recueil de fiches de l'INSPQ (publication 2371), qui donne les noms officiels. Même gabarit et mêmes règles que
# lot10.py : chaque mot vient de la page, structure en bleu-gris neutre ; les indicateurs sont des éléments neutres
# (points gris, sans légende de couleur) : le schéma ne dit pas ce qui pèse ni ce qui protège.
#
#   SORTIE=/tmp/grille python3 tools/schemas-sombres/grille_inspq.py
#   node tools/poser_schemas.mjs --spec /tmp/grille/grille-inspq-didentification-des-rps/spec.json \
#        --medias /tmp/grille/grille-inspq-didentification-des-rps \
#        --lot content-updates/2026-09-27-grille-inspq-didentification-des-rps-schemas.json [--ecrire]
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gabarit as kit
from lot10 import ty, tyl, decrire

SORTIE = os.environ.get('SORTIE') or os.path.join(os.getcwd(), 'grille-inspq')
PAGE = 'grille-inspq-didentification-des-rps'
RECUEIL = ('https://www.inspq.qc.ca/recueil-de-fiches-portant-sur-les-indicateurs-de-la-grille-'
           'd-identification-de-risques-psychosociaux-du-travail')

SCHEMA = dict(
    sujet='indicateurs',
    # texte présent avant ET après la correction de la page (« Chaque catégorie / Chaque indicateur est documenté
    # avec : … ») : le lot s'applique au vault, que la correction y soit déjà passée ou non
    ancre="définition, exemples, indicateurs observables, recommandations d'action",
    titre='Grille INSPQ : 12 indicateurs',
    sous_titre="Grille d'identification de risques psychosociaux du travail",
    sections=[
        dict(icone='mdiClipboardTextOutline', titre='Partie 1', etiquette='6 indicateurs',
             note=dict(titre='', texte='Contexte de travail et mesures de prévention en place'),
             colonnes=[dict(titre='', puce='point', items=["Contexte de travail et d'emploi",
                                                           'Absentéisme maladie et présentéisme',
                                                           'Activités ou politique de santé au travail']),
                       dict(titre='', puce='point', items=['Activités ou politique contre la violence et le harcèlement',
                                                           'Activités ou politique de retour au travail',
                                                           'Activités ou politique de conciliation travail et vie personnelle'])]),
        dict(icone='mdiSitemapOutline', titre='Partie 2', etiquette='6 indicateurs',
             note=dict(titre='', texte="Composantes clés de l'organisation du travail"),
             colonnes=[dict(titre='', puce='point', items=['Charge de travail', 'Reconnaissance au travail',
                                                           'Soutien social du supérieur']),
                       dict(titre='', puce='point', items=['Soutien social des collègues', 'Autonomie décisionnelle',
                                                           'Information et communication'])])],
    repere=dict(titre='Repère rapide', texte="la démarche de l'INSPQ : informer et sensibiliser le milieu, l'évaluer à "
                                              "l'aide de la Grille, soutenir la prise en charge, puis suivre le plan d'action."),
    legende="Les 12 indicateurs de la Grille, sous leurs noms officiels, dans ses deux parties : le contexte de travail "
            "et les mesures de prévention en place, puis les composantes clés de l'organisation du travail. Le tableau "
            "de la page en illustre huit par des exemples ; la phrase qui le suit nomme les quatre autres.",
    sources="D'après cette page (L'essentiel ; Structure de la grille ; Démarche d'utilisation) et le "
            f'<a href="{RECUEIL}">Recueil de fiches de l\'INSPQ</a> (noms et partie des indicateurs). '
            "Schéma de principe : aucun ordre de priorité entre les indicateurs, aucun score.",
)


def construire():
    s = SCHEMA
    sp = tyl({k: v for k, v in s.items() if k not in ('sujet', 'ancre', 'legende', 'sources')})
    sp['sections'] = [dict(x, etiquette=x.get('etiquette') or None) for x in sp['sections']]
    puces, alt = decrire(sp)
    sp['titre_access'] = sp['titre']
    sp['desc'] = ' '.join(puces)
    svg, H = kit.schema(sp)
    dossier = os.path.join(SORTIE, PAGE)
    os.makedirs(dossier, exist_ok=True)
    fichier = f'wiki-{PAGE}-{s["sujet"]}-v1.svg'
    open(os.path.join(dossier, fichier), 'w', encoding='utf-8').write(svg)
    # sources : ty() ne touche ni aux adresses (« https:// ») ni aux guillemets droits des attributs
    spec = {'page': f'w/psychosocial/{PAGE}.html',
            'note': {'titre': "Grille INSPQ d'identification des RPS", 'wiki': 'Wiki SST psychosociale'},
            'schemas': [{'fichier': fichier, 'ancre': s['ancre'], 'remplace': None, 'sombre': True,
                         'alt': alt, 'legende': ty(s['legende']), 'sources': ty(s['sources'])}]}
    json.dump(spec, open(os.path.join(dossier, 'spec.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{fichier} : {H} de haut, {len(svg.encode()) // 1024} Ko')


if __name__ == '__main__':
    construire()
