# Lot 10, version 3 : les douze schémas au style sombre de Frank (référence « CNESST — comprendre les 3 volets »),
# avec la règle de couleur de son retour (« pas trop de couleur, une raison pour chaque couleur ») : structure en
# bleu-gris neutre, couleur réservée aux puces, légende sous le titre. Chaque mot vient de la page ; texte
# alternatif et version texte sont tirés de la mise en page elle-même, pour dire exactement ce que montre le dessin.
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gabarit as kit

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.environ.get('SORTIE') or os.path.join(os.getcwd(), 'lot10v3')  # dossier de sortie (SVG + spec.json par page)
NB, FI = ' ', ' '


def ty(s):
    """Typographie française : apostrophe courbe, insécable avant « : », fine avant « ; ? ! », guillemets."""
    s = s.replace("'", '’')
    s = re.sub(r' ?:(?=\s|$)', NB + ':', s)
    s = re.sub(r' ?([;?!])(?=\s|$)', FI + r'\1', s)
    s = re.sub(r'«\s*', '«' + NB, s)
    s = re.sub(r'\s*»', NB + '»', s)
    return s


def tyl(o):
    if isinstance(o, str):
        return ty(o)
    if isinstance(o, list):
        return [tyl(x) for x in o]
    if isinstance(o, dict):
        return {k: (tyl(v) if k not in ('icone', 'puce') else v) for k, v in o.items()}
    return o


def g(s):
    return '«' + NB + s + NB + '»'


def texte_item(it):
    return it if isinstance(it, str) else it['texte']


def decrire(sp):
    """Version texte (puces) et texte alternatif, tirés de la mise en page."""
    puces = []
    tete = f'Titre{NB}: {g(sp["titre"])}'
    if sp.get('sous_titre'):
        tete += f', sous-titre {g(sp["sous_titre"])}'
    puces.append(tete + '. Infographie sur fond sombre.')
    legende = kit.legende_textes(kit.genres_legende(sp), sp.get('legende_couleurs', {}))
    nom_puce = {'alerte': 'puces orange ' + g('!'), 'coche': 'coches vertes'}
    if legende:
        puces.append(f'Sous le titre, la légende des couleurs{NB}: ' + f'{FI}; '.join(f'{nom_puce[x]}, {txt}' for x, txt in legende) + '. Le reste est en bleu-gris neutre.')
    if sp.get('cartes'):
        n = len(sp['cartes'])
        cs = f'{FI};'.join(f' {g(c["titre"])}' + (f', {c["texte"]}' if c.get('texte') else '') for c in sp['cartes'])
        puces.append(f'En haut, {["", "une carte", "deux cartes", "trois cartes", "quatre cartes"][n]} à pictogramme blanc{NB}:{cs}.')
    for s in sp['sections']:
        p = f'Section {g(s["titre"])}'
        if s.get('etiquette'):
            p += f' ({s["etiquette"]})'
        if s.get('note'):
            n = s['note']
            p += f'{FI}; en tête{NB}: ' + g(((n['titre'] + ' ') if n.get('titre') else '') + n['texte'])
        p += '.'
        for c in s['colonnes']:
            items = f'{FI}; '.join(texte_item(i) for i in c['items'])
            p += (f' {g(c["titre"])}{NB}: ' if c.get('titre') else ' ') + items + '.'
        puces.append(p)
    if sp.get('repere'):
        puces.append(f'En bas, {g(sp["repere"]["titre"])}{NB}: {sp["repere"]["texte"]}')
    noms = ', '.join(g(s['titre']) for s in sp['sections'])
    alt = f'Infographie sur fond sombre, {g(sp["titre"])}'
    if sp.get('sous_titre'):
        alt += f' ({sp["sous_titre"]})'
    if sp.get('cartes'):
        alt += f'{NB}: ' + ', '.join(c['titre'] for c in sp['cartes'])
    alt += f'{FI}; ' + ('section ' if len(sp['sections']) == 1 else 'sections ') + noms
    if legende:
        alt += f'{FI}; ' + ', '.join(f'{nom_puce[x]}{NB}: {txt}' for x, txt in legende)
    if sp.get('repere'):
        alt += f'{FI}; en bas{NB}: {sp["repere"]["texte"]}'
    return puces, alt.rstrip('.') + '.'


SCHEMAS = [
  # ------------------------------------------------------------------ Foreur
  dict(page='foreur-profil-rps-et-leadership-de-chantier', sujet='profil', ancre='Burnout possible chez les foreurs très investis',
   titre="Ce qui pèse sur le foreur", sous_titre="Souvent chef de chantier de fait, sans titre formel",
   cartes=[dict(icone='mdiAccountHardHat', titre='Foreur', texte="responsable de la foreuse et du chantier"),
           dict(icone='mdiAccountHardHat', titre='Aide-foreur', texte="coordination de son travail par le foreur"),
           dict(icone='mdiAccountSupervisor', titre='Contremaître', texte="communication avec le foreur")],
   sections=[
     dict(icone='mdiBrain', titre='Charge', etiquette='Élevée',
          note=dict(titre='Profil typique :', texte='charge cognitive et physique élevées'),
          colonnes=[dict(titre='Cognitive', puce='alerte', items=['Décisions techniques', 'Surveillance multiple', 'Anticipation']),
                    dict(titre='Physique', puce='alerte', items=["Opération d'équipement", 'Manipulation', 'Terrain'])]),
     dict(icone='mdiShieldAccount', titre='Responsabilité', etiquette='Lourde',
          note=dict(titre='Profil typique :', texte="sécurité de soi et de l'aide-foreur"),
          colonnes=[dict(titre='Risques particuliers', puce='alerte', items=['Stress de responsabilité', 'Tensions de pression de production', 'Burnout possible chez les très investis'])]),
     dict(icone='mdiSignDirection', titre='Latitude',
          colonnes=[dict(titre='', items=[dict(icone='mdiCog', texte='Technique : réelle, choix de méthode')]),
                    dict(titre='', items=[dict(icone='mdiLock', texte='Managériale : limitée, structure du chantier dictée')])])],
   repere=dict(titre='Repère rapide', texte='latitude technique réelle, mais responsabilités lourdes.'),
   legende="Le profil RPS typique que la page décrit pour le foreur : des charges élevées et une responsabilité lourde, avec une latitude technique réelle mais une latitude managériale limitée. Ce sont des conditions du poste ; le schéma n’en mesure pas l’intensité.",
   sources="D’après « L’essentiel », la « Description du poste », le tableau « Profil RPS » et les « Risques particuliers » de cette page, qui décrivent un profil typique, sans mesure. Voir aussi {{lien:w/psychosocial/aide-foreur-profil-rps.html|Aide-foreur, profil RPS}}. Schéma de principe."),
  dict(page='foreur-profil-rps-et-leadership-de-chantier', sujet='leviers', ancre='Leviers de prévention',
   titre="Leadership de chantier", sous_titre="Leviers de prévention",
   cartes=[dict(icone='mdiAccountHardHat', titre='Foreur', texte='leadership informel'),
           dict(icone='mdiAccountHardHat', titre='Aide-foreur', texte='sa santé psychologique'),
           dict(icone='mdiAccountGroup', titre='Équipe', texte="le climat de l'équipe")],
   sections=[
     dict(icone='mdiSchool', titre='Primaire', etiquette='Niveau',
          colonnes=[dict(titre='', puce='coche', items=['Sélection intégrant les compétences relationnelles', 'Formation au leadership de chantier', 'Reconnaissance institutionnelle du rôle de leadership'])]),
     dict(icone='mdiHandshake', titre='Secondaire', etiquette='Niveau',
          colonnes=[dict(titre='', puce='coche', items=['Coaching pour foreurs en difficulté relationnelle', 'Surveillance du climat des binômes foreur-aide-foreur'])]),
     dict(icone='mdiBullhorn', titre='Tertiaire', etiquette='Niveau',
          colonnes=[dict(titre='', puce='coche', items=['Mécanismes de signalement et médiation accessibles'])])],
   repere=dict(titre='Repère rapide', texte="le foreur est souvent un acteur clé du climat psychosocial de l'équipe."),
   legende="Bien qu’informel, le leadership du foreur sur son aide-foreur est structurant, selon la page, pour le climat de l’équipe et la santé psychologique de l’aide-foreur. Les leviers sont ceux du tableau, rangés par niveau comme dans la page ; ce sont des choix de l’organisation, pas des garanties d’effet.",
   sources="D’après « L’essentiel », la section « Leadership de chantier » et le tableau « Leviers de prévention » de cette page. Schéma de principe."),
  # ------------------------------------------------------------------ Aide-foreur
  dict(page='aide-foreur-profil-rps', sujet='poste', ancre='Profil RPS structurel',
   titre="Ce qui pèse sur l'aide-foreur", sous_titre='Profil RPS structurel',
   cartes=[dict(icone='mdiAccountHardHat', titre='Aide-foreur', texte="premier niveau dans l'équipe de forage"),
           dict(icone='mdiAccountHardHat', titre='Foreur', texte='la qualité de la relation'),
           dict(icone='mdiCogs', titre='Équipement', texte='impose la cadence')],
   sections=[
     dict(icone='mdiWeightLifter', titre='Le poste', etiquette='Structurel',
          note=dict(titre='Profil typique :', texte="charge physique élevée, cadence imposée par l'équipement"),
          colonnes=[dict(titre='Charge physique', puce='alerte', items=['Équipement lourd', 'Postures contraignantes']),
                    dict(titre="Sécurité d'emploi", puce='alerte', items=["Poste d'entrée, parfois précaire"])]),
     dict(icone='mdiAccountSwitch', titre='La relation', etiquette='Dépendance',
          note=dict(titre='Vulnérabilité particulière :', texte='la dépendance forte à la qualité de la relation avec le foreur'),
          colonnes=[dict(titre='Latitude décisionnelle', puce='alerte', items=['Faible : tâches dictées par le foreur ou par procédures']),
                    dict(titre='Soutien et reconnaissance', puce='alerte', items=['Soutien : dépend fortement de la relation', 'Mérite attribué au foreur'])])],
   repere=dict(titre='Repère rapide', texte='comprendre ce profil structurel permet de cibler les leviers de prévention.'),
   legende="Selon la page, le profil RPS typique de l’aide-foreur combine charge physique élevée, cadence imposée par l’équipement, faible latitude décisionnelle et dépendance forte au foreur. Ce sont des conditions du poste, pas des traits de la personne.",
   sources="D’après cette page (L’essentiel ; tableau « Profil RPS structurel » ; « Vulnérabilité particulière »). Voir aussi {{lien:w/psychosocial/foreur-profil-rps-et-leadership-de-chantier.html|Foreur, profil RPS et leadership de chantier}}. Schéma de principe : aucun chiffre ni durée."),
  dict(page='aide-foreur-profil-rps', sujet='leviers', ancre='Leviers de prévention',
   titre='Leviers de prévention', sous_titre='Aide-foreur, profil RPS',
   sections=[
     dict(icone='mdiSitemap', titre='Primaire', etiquette='Niveau',
          colonnes=[dict(titre='', puce='coche', items=['Concevoir le poste avec une marge de manœuvre minimale (séquençage, méthodes)', 'Plan de progression clair vers foreur']),
                    dict(titre='', puce='coche', items=['Rotation des paires foreur-aide-foreur, si applicable', 'Reconnaissance institutionnelle du poste'])]),
     dict(icone='mdiSchool', titre='Secondaire', etiquette='Niveau',
          colonnes=[dict(titre='', puce='coche', items=['Formation des foreurs au leadership et à la communication', 'Sensibilisation des superviseurs au profil RPS du poste'])]),
     dict(icone='mdiBullhorn', titre='Tertiaire', etiquette='Niveau',
          colonnes=[dict(titre='', puce='coche', items=['Mécanismes de signalement accessibles, en cas de conflit avec le foreur'])])],
   repere=dict(titre='Repère rapide', texte='évolution typique : aide-foreur, puis foreur, puis contremaître ou postes spécialisés.'),
   legende="Les leviers de prévention du tableau de la page, rangés par niveau comme dans la page. Ce sont des choix de l’organisation ; un levier n’est pas une promesse d’effet.",
   sources="D’après cette page (tableau « Leviers de prévention » ; « Évolution typique » de la Description du poste). Pour le leadership de chantier, voir {{lien:w/psychosocial/foreur-profil-rps-et-leadership-de-chantier.html|Foreur, profil RPS et leadership de chantier}}. Schéma de principe : aucun chiffre, aucun ordre de priorité entre les leviers d’un même niveau."),
  # ------------------------------------------------------------------ Contremaître
  dict(page='contremaitre-ou-capitaine-profil-rps', sujet='pression', ancre="Particularité : le contremaître subit les pressions de tous les côtés et a peu d'espace pour décharger.",
   titre='Ce qui pèse sur le contremaître', sous_titre='Superviseur de premier niveau en mine',
   cartes=[dict(icone='mdiAccountTie', titre='Direction', texte='qui pousse'),
           dict(icone='mdiAccountHardHat', titre='Contremaître', texte='pivot entre opérations et direction'),
           dict(icone='mdiAccountGroup', titre='Équipe', texte='qui réclame')],
   sections=[
     dict(icone='mdiArrowCollapseHorizontal', titre='Pivot', etiquette='Pression bidirectionnelle',
          note=dict(titre='Particularité :', texte='il subit les pressions de tous les côtés'),
          colonnes=[dict(titre='Soutien social', puce='alerte', items=['Variable : entre deux niveaux', 'Parfois isolé']),
                    dict(titre='Reconnaissance', puce='alerte', items=['Souvent insuffisante'])]),
     dict(icone='mdiBrain', titre='Charge', etiquette='Mentale',
          note=dict(titre='Profil RPS :', texte="responsabilité de la sécurité de l'équipe"),
          colonnes=[dict(titre='Cognitive : très élevée', puce='alerte', items=['Multitâche', 'Décisions', 'Anticipation']),
                    dict(titre='Émotionnelle : élevée', puce='alerte', items=["Gestion d'équipe", 'Conflits', 'Sécurité'])])],
   repere=dict(titre='Repère rapide', texte="le contremaître a peu d'espace pour décharger."),
   legende="Ce qui pèse sur le poste dans le profil RPS de la page : une pression des deux côtés, des charges cognitive et émotionnelle élevées, un soutien variable et une reconnaissance souvent insuffisante. Ce sont des conditions du poste ; le schéma n’en mesure pas l’intensité.",
   sources="D’après cette page (L’essentiel, Description du poste, tableau « Profil RPS » et « Particularité »), qui décrit un profil typique sans citer d’étude ; les RPS sont des conditions de travail : {{lien:w/psychosocial/definition-des-risques-psychosociaux.html|Définition des risques psychosociaux}}. Schéma de principe."),
  dict(page='contremaitre-ou-capitaine-profil-rps', sujet='leviers', ancre='Soutenir le contremaître',
   titre='Soutenir le contremaître', sous_titre='Contremaître ou capitaine en souterrain',
   sections=[
     dict(icone='mdiAccountTie', titre='Direction',
          colonnes=[dict(titre='', puce='coche', items=['Reconnaître la charge, ne pas surcharger', 'Ratios cadres-travailleurs raisonnables', 'Soutien à la décision : back-up, conseiller SST disponible'])]),
     dict(icone='mdiSchool', titre='Formation et pairs', etiquette='',
          colonnes=[dict(titre='Formation', puce='coche', items=['Au leadership', 'À la gestion de conflits', 'À la communication']),
                    dict(titre='Pairs', puce='coche', items=['Communauté de contremaîtres pour échange'])]),
     dict(icone='mdiMedicalBag', titre='Soutien et conditions', etiquette='',
          colonnes=[dict(titre='Soutien clinique', puce='coche', items=['PAE accessible', 'Débriefing post-incident']),
                    dict(titre='Reconnaissance, conditions', puce='coche', items=['Du rôle de contremaître', 'Outils, équipement, temps suffisants'])])],
   repere=dict(titre='Repère rapide', texte="un contremaître pour trop de monde ne peut pas soutenir."),
   legende="Les leviers que la page propose pour soutenir le contremaître, avec les niveaux de son tableau (direction, formation, soutien clinique, pairs, reconnaissance, conditions). Ce sont des choix de l’organisation, pas des garanties d’effet.",
   sources="D’après le tableau « Soutenir le contremaître » et L’essentiel de cette page, qui ne cite pas d’étude ; PAE : {{lien:w/psychosocial/programme-daide-aux-employes-pae.html|Programme d’aide aux employés (PAE)}}. Schéma de principe."),
  # ------------------------------------------------------------------ MBI
  dict(page='mbi-epuisement-professionnel', sujet='trois-dimensions', ancre="C'est l'instrument de référence international pour le burnout. Validé scientifiquement. Pour un usage organisationnel, des alternatives gratuites existent (Copenhagen Burnout Inventory).",
   titre='Le MBI : trois dimensions', sous_titre='Maslach Burnout Inventory',
   cartes=[dict(icone='mdiBatteryAlert', titre='Épuisement émotionnel', texte="sentiment d'être vidé"),
           dict(icone='mdiArrowExpandHorizontal', titre='Dépersonnalisation (cynisme)', texte='distance, désengagement'),
           dict(icone='mdiTarget', titre='Accomplissement personnel', texte="sentiment d'efficacité")],
   sections=[
     dict(icone='mdiClipboardText', titre='Interprétation', etiquette='MBI',
          note=dict(titre='Selon la page :', texte='trois sous-scores comparés aux normes par secteur'),
          colonnes=[dict(titre='Sous-scores', items=[dict(icone='mdiFormatListNumbered', texte='Un par dimension'), dict(icone='mdiCancel', texte='Pas de score total')]),
                    dict(titre='Burnout', puce='point', items=['Épuisement élevé', 'Cynisme élevé', 'Accomplissement bas'])])],
   repere=dict(titre='Repère rapide', texte="l'OMS a inscrit le burnout en 2019 dans la CIM-11 comme « phénomène lié au travail »."),
   legende="Les trois dimensions que mesure le MBI, et la lecture qu’en donne la page : un sous-score par dimension, sans total, comparé aux normes par secteur. Aucun énoncé du questionnaire, aucune valeur ni aucun seuil.",
   sources="D’après cette page : L’essentiel, section Définition (tableau des trois dimensions et paragraphe sur la CIM-11), tableau Mesure (ligne « Sous-scores ») et paragraphe Interprétation. Voir aussi la note d’analyse {{lien:w/psychosocial/analyse-inrs-2024.html|INRS (2024)}}. Schéma de principe."),
  dict(page='mbi-epuisement-professionnel', sujet='diagnostic', ancre='Interprétation : trois sous-scores comparés aux normes par secteur. Burnout = épuisement élevé + cynisme élevé + accomplissement bas.',
   titre='Mesure ou diagnostic ?', sous_titre='Maslach Burnout Inventory',
   sections=[
     dict(icone='mdiClipboardText', titre='Mesure', etiquette='MBI',
          note=dict(titre='Limite :', texte='le MBI est un instrument de mesure, pas un diagnostic'),
          colonnes=[dict(titre='Le questionnaire', items=[dict(icone='mdiFormatListNumbered', texte='Trois sous-scores'), dict(icone='mdiFileDocument', texte='Licence commerciale')]),
                    dict(titre='Confidentialité', items=[dict(icone='mdiLock', texte='Renseignement de santé')])]),
     dict(icone='mdiStethoscope', titre='Diagnostic', etiquette='Différentiel',
          note=dict(titre='Selon la page :', texte='un professionnel de santé est requis'),
          colonnes=[dict(titre='Pour distinguer', puce='point', items=['Burnout', 'Dépression', 'Trouble anxieux']),
                    dict(titre='À savoir', puce='point', items=["Le burnout n'est pas un diagnostic médical"])])],
   repere=dict(titre='Repère rapide', texte='pour un usage organisationnel, des alternatives gratuites existent (Copenhagen Burnout Inventory).'),
   legende="Le MBI est un instrument de mesure, pas un diagnostic : pour distinguer burnout, dépression et trouble anxieux, la page dit qu’un professionnel de santé est requis. Le résultat est un renseignement de santé.",
   sources="D’après cette page : encadré Limite et paragraphe Interprétation (section Mesure), tableau Mesure (ligne « Coût »), section Définition (« Le burnout n’est pas un diagnostic médical »), section Cadre légal (« Confidentialité : renseignement de santé ») et L’essentiel. Voir aussi la note d’analyse {{lien:w/psychosocial/analyse-inrs-2024.html|INRS (2024)}}. Schéma de principe : aucun énoncé du questionnaire n’est reproduit."),
  # ------------------------------------------------------------------ Coût des RPS
  dict(page='cout-economique-des-rps-pour-lemployeur', sujet='visibles-caches', ancre='Souvent oubliés dans les évaluations',
   titre='Ce que coûtent les RPS', sous_titre="Coût économique pour l'employeur", legende_couleurs={'alerte': 'un coût'},
   sections=[
     dict(icone='mdiCalculator', titre='Par cas', etiquette='Estimation',
          note=dict(titre='', texte="coût moyen d'une invalidité psychologique prolongée"),
          colonnes=[dict(titre='', puce='alerte', items=['Indemnités', 'Hausse de cotisation CNESST', 'Remplacement (poste critique)']),
                    dict(titre='', puce='alerte', items=['Perte de productivité avant et après', 'Recrutement si départ définitif'])]),
     dict(icone='mdiEyeOff', titre='Coûts cachés', etiquette='',
          note=dict(titre='', texte='souvent oubliés dans les évaluations'),
          colonnes=[dict(titre='', puce='alerte', items=['Présentéisme', "Démotivation d'équipe", 'Perte de mémoire organisationnelle']),
                    dict(titre='', puce='alerte', items=['Climat dégradé', 'Charge sur les collègues', 'Coût en gestion : RH, conseiller SST, supérieurs'])])],
   repere=dict(titre='Repère rapide', texte='les RPS coûtent cher : indemnités CNESST, hausse de cotisation, remplacement, perte de productivité, présentéisme, roulement, recrutement, réputation.'),
   legende="Les éléments de l’estimation par cas et les coûts cachés que la page nomme. Schéma de principe : ni montant ni proportion ; la page donne des montants sans source précise.",
   sources="D’après L’essentiel et les tableaux « Estimation par cas » (sans les montants) et « Coûts cachés » de cette page. Schéma de principe, sans montant ni proportion."),
  dict(page='cout-economique-des-rps-pour-lemployeur', sujet='mine', ancre='Particularités du minier',
   titre='Remplacer en mine', sous_titre='Particularités du minier', legende_couleurs={'alerte': 'un coût'},
   sections=[
     dict(icone='mdiAccountSearch', titre='Recrutement et logistique', etiquette='',
          colonnes=[dict(titre='Particularité', items=[dict(icone='mdiAccountSearch', texte="Pénurie de main-d'œuvre"), dict(icone='mdiAirplane', texte='Cycles FIFO et logistique')]),
                    dict(titre='Impact économique', puce='alerte', items=['Coût de recrutement très élevé', 'Coût de transport, hébergement'])]),
     dict(icone='mdiAccountArrowRight', titre='Remplacer', etiquette='',
          colonnes=[dict(titre='Particularité', items=[dict(icone='mdiPickaxe', texte='Postes critiques pour la production'), dict(icone='mdiWrench', texte='Compétences spécialisées')]),
                    dict(titre='Impact économique', puce='alerte', items=['Coût de remplacement élevé', 'Difficulté à remplacer rapidement'])])],
   repere=dict(titre='Repère rapide', texte='les RPS coûtent cher : remplacement, roulement, recrutement.'),
   legende="Ce qui alourdit, sur un site minier, le coût du recrutement, de la logistique et du remplacement, d’après le tableau des particularités du minier. Schéma de principe : ni montant ni durée.",
   sources="D’après le tableau « Particularités du minier » de la section « Application en mines » et L’essentiel de cette page. Voir aussi {{lien:w/psychosocial/comparatif-des-cycles-fifo-14-14-20-10-21-7.html|Comparatif des cycles FIFO}}. Schéma de principe, sans montant ni durée."),
  # ------------------------------------------------------------------ Confinement
  dict(page='confinement-profondeur-et-charge-mentale', sujet='vigilance', ancre="Cette charge mentale s'ajoute à la charge cognitive de la tâche elle-même.",
   titre='Charge mentale en souterrain', sous_titre='En confinement, à grande profondeur',
   cartes=[dict(icone='mdiLandslide', titre='Effondrement', texte=''),
           dict(icone='mdiWeatherWindy', titre='Gaz, ventilation', texte=''),
           dict(icone='mdiTruck', titre='Équipement', texte='')],
   sections=[
     dict(icone='mdiBrain', titre='Charge mentale', etiquette='Spécifique',
          note=dict(titre='Selon la page :', texte='la vigilance permanente face aux risques consomme des ressources cognitives'),
          colonnes=[dict(titre='Source de charge mentale', puce='alerte', items=['Vigilance environnementale', 'Repérage spatial', 'Anticipation des risques']),
                    dict(titre='Source de charge mentale', puce='alerte', items=['Procédures à suivre', 'Communication contrainte', 'Gestion de la fatigue'])]),
     dict(icone='mdiTimerSand', titre='Adaptation',
          note=dict(titre='', texte='un coût qui s\'accumule sur la rotation, la carrière'),
          colonnes=[dict(titre="Coût de l'adaptation", puce='alerte', items=['Fatigue cognitive en fin de quart', 'Vulnérabilité accrue si la fatigue est déjà installée', "Diminution de la marge en cas d'événement imprévu"])])],
   repere=dict(titre='Repère rapide', texte="cette charge mentale s'ajoute à la charge cognitive de la tâche elle-même."),
   legende="Même quand les tâches sont routinières, le travail en confinement à grande profondeur ajoute une vigilance permanente face aux risques ; l’adaptation a un coût. Schéma de principe : sans durée ni niveau.",
   sources="D’après « L’essentiel » et les sections « Charge mentale spécifique » et « Mécanismes » de cette page. Voir aussi {{lien:w/psychosocial/communication-souterraine-et-isolement-de-lequipe.html|Communication souterraine et isolement de l’équipe}}. Schéma de principe."),
  dict(page='confinement-profondeur-et-charge-mentale', sujet='leviers', ancre='Leviers',
   titre='Charge mentale : les leviers', sous_titre='En confinement, à grande profondeur',
   sections=[
     dict(icone='mdiLightbulbOn', titre='Conception',
          colonnes=[dict(titre='', puce='coche', items=['Pauses régulières dans des zones décompressantes : refuges, salles d\'équipement', 'Éclairage adéquat, repères visuels, signalisation claire'])]),
     dict(icone='mdiFormatListChecks', titre='Procédures et équipe', etiquette='',
          colonnes=[dict(titre='Procédures', puce='coche', items=['Listes de vérification pour décharger la mémoire de travail']),
                    dict(titre='Équipe', puce='coche', items=['Rotation entre tâches à charge cognitive variée'])]),
     dict(icone='mdiAccountHeart', titre='Soutien et surveillance', etiquette='',
          colonnes=[dict(titre='Soutien', puce='coche', items=["Communication régulière pour rompre l'isolement cognitif"]),
                    dict(titre='Surveillance', puce='coche', items=['Détection précoce des signes de surcharge'])])],
   repere=dict(titre='Repère rapide', texte="l'adaptation a un coût ; le reconnaître permet d'agir avant l'épuisement."),
   legende="Les leviers du tableau de la page, avec ses niveaux (conception, procédures, équipe, soutien, surveillance). Des leviers de l’organisation, pas des garanties d’effet.",
   sources="D’après le tableau « Leviers » de la section « Application en mines » et « L’essentiel » de cette page. Voir aussi {{lien:w/psychosocial/premiers-signes-en-mine-ce-que-les-superviseurs-voient.html|Premiers signes en mine, ce que les superviseurs voient}}. Schéma de principe, sans durée, fréquence ni effet."),
]


def construire(filtre=None):
    specs = {}
    for s in SCHEMAS:
        if filtre and filtre not in s['page'] + '-' + s['sujet']:
            continue
        sp = tyl({k: v for k, v in s.items() if k not in ('page', 'sujet', 'ancre', 'legende', 'sources', 'legende_couleurs')})
        if s.get('legende_couleurs'):
            sp['legende_couleurs'] = tyl(s['legende_couleurs'])
        sp['sections'] = [dict(x, etiquette=x.get('etiquette') or None) for x in sp['sections']]
        puces, alt = decrire(sp)
        sp['titre_access'] = sp['titre']
        sp['desc'] = ' '.join(puces)
        svg, H = kit.schema(sp)
        dossier = os.path.join(SORTIE, s['page'])
        os.makedirs(dossier, exist_ok=True)
        fichier = f'wiki-{s["page"]}-{s["sujet"]}-v3.svg'
        open(os.path.join(dossier, fichier), 'w', encoding='utf-8').write(svg)
        spec = specs.setdefault(s['page'], {'page': f'w/psychosocial/{s["page"]}.html', 'note': None, 'schemas': []})
        spec['schemas'].append({'fichier': fichier, 'ancre': s['ancre'], 'remplace': None,
                                'remplaceSchema': [f'wiki-{s["page"]}-{s["sujet"]}-v2.svg', f'wiki-{s["page"]}-{s["sujet"]}-v1.svg'], 'sombre': True,
                                'alt': alt, 'legende': ty(s['legende']), 'puces': puces, 'sources': ty(s['sources'])})
        print(f'{fichier} : {H} de haut, {len(svg.encode()) // 1024} Ko')
    return specs


if __name__ == '__main__':
    specs = construire(sys.argv[1] if len(sys.argv) > 1 else None)
    titres = {'foreur-profil-rps-et-leadership-de-chantier': 'Foreur, profil RPS et leadership de chantier',
              'aide-foreur-profil-rps': 'Aide-foreur, profil RPS',
              'contremaitre-ou-capitaine-profil-rps': 'Contremaître ou capitaine, profil RPS',
              'mbi-epuisement-professionnel': 'MBI, épuisement professionnel',
              'cout-economique-des-rps-pour-lemployeur': "Coût économique des RPS pour l'employeur",
              'confinement-profondeur-et-charge-mentale': 'Confinement, profondeur et charge mentale'}
    for page, spec in specs.items():
        spec['note'] = {'titre': titres[page], 'wiki': 'Wiki SST psychosociale'}
        json.dump(spec, open(os.path.join(SORTIE, page, 'spec.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
