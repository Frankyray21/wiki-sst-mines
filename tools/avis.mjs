// Bloc « Cette page vous a-t-elle été utile ? » : un pouce en haut, un pouce en bas, un
// commentaire facultatif. Frank, 15 septembre 2026 — même convention que les sites de formation
// (procédures, TMS, RodBot) : le pouce crée la ligne dans Airtable, le commentaire met à jour la
// même ligne.
//
// Le bloc est rendu MASQUÉ. app.js ne l'affiche que si un relais est configuré dans
// `assets/avis.json` : tant qu'il n'y en a pas, aucune page ne montre un formulaire qui
// n'enverrait nulle part, et changer de relais ne demande pas de reconstruire les 4 000 pages.
//
// L'envoi passe par un relais (Worker Cloudflare), jamais directement par l'API d'Airtable :
// un jeton posé dans une page publique serait lisible — et utilisable — par n'importe qui.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const CONF_AVIS = 'assets/avis.json';

// Configuration du relais, écrite à la main dans docs/assets/avis.json après le déploiement du
// Worker — la seule étape qui reste sur le poste de Frank. Le générateur vide docs/ à chaque
// construction : il relit ce fichier AVANT le nettoyage et le réécrit AUSSITÔT après, pour que
// la fenêtre de perte soit nulle même si la construction s'arrête en route. Toutes les clés sont
// conservées (base, table, et ce qu'on y ajouterait) ; seule l'adresse est contrôlée.
export const CONF_DEFAUT = { url: '', base: 'Formations', table: 'Avis wiki SST (web)' };
export const urlRelaisValide = (u) => { try { return typeof u === 'string' && new URL(u).protocol === 'https:'; } catch { return false; } };

export function lireConfAvis(fs, OUT, path) {
  const chemin = path.join(OUT, CONF_AVIS);
  if (!fs.existsSync(chemin)) return { conf: { ...CONF_DEFAUT }, avertissement: 'assets/avis.json absent au démarrage : relais non configuré. Si un relais existait, réécrire son adresse dans docs/assets/avis.json.' };
  let lu;
  try { lu = JSON.parse(fs.readFileSync(chemin, 'utf8').replace(/^\uFEFF/, '')); }
  catch (e) { return { conf: { ...CONF_DEFAUT }, avertissement: 'assets/avis.json illisible (' + String(e.message).split('\n')[0] + ') : relais non configuré, fichier réinitialisé.' }; }
  if (!lu || typeof lu !== 'object' || Array.isArray(lu)) return { conf: { ...CONF_DEFAUT }, avertissement: 'assets/avis.json n’est pas un objet : relais non configuré, fichier réinitialisé.' };
  const conf = { ...CONF_DEFAUT, ...lu };
  if (conf.url === '' || conf.url == null) { conf.url = ''; return { conf, avertissement: '' }; }
  if (!urlRelaisValide(conf.url)) {
    // on ne détruit pas ce que Frank a écrit, mais le bloc restera masqué : app.js n'accepte que https
    return { conf, avertissement: `adresse de relais refusée (https attendu) : « ${String(conf.url).slice(0, 80)} » — le bloc d’avis reste masqué.` };
  }
  return { conf, avertissement: '' };
}

export function ecrireConfAvis(fs, OUT, path, conf) {
  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(OUT, CONF_AVIS), JSON.stringify(conf, null, 1) + '\n');
}

export function blocAvis({ adresse, titre, wiki }) {
  return `<section class="avis" hidden data-avis-adresse="${esc(adresse)}" data-avis-titre="${esc(titre)}" data-avis-wiki="${esc(wiki)}" aria-labelledby="avis-titre">
<h2 class="avis-titre" id="avis-titre">Cette page vous a-t-elle été utile ?</h2>
<div class="avis-pouces">
<button type="button" class="avis-pouce" data-avis="haut" aria-pressed="false"><span class="avis-emoji" aria-hidden="true">👍</span> Oui</button>
<button type="button" class="avis-pouce" data-avis="bas" aria-pressed="false"><span class="avis-emoji" aria-hidden="true">👎</span> À revoir</button>
</div>
<form class="avis-mot" hidden>
<label for="avis-commentaire">Un mot pour expliquer ? <span class="avis-facultatif">facultatif</span></label>
<textarea id="avis-commentaire" name="commentaire" rows="3" maxlength="1500" placeholder="Ce qui manque, ce qui est faux, ce qui aiderait…"></textarea>
<label for="avis-nom">Votre nom, si vous voulez une suite <span class="avis-facultatif">facultatif</span></label>
<input id="avis-nom" name="nom" type="text" maxlength="80" autocomplete="name">
<button type="submit" class="avis-envoyer">Envoyer</button>
</form>
<p class="avis-etat" role="status"></p>
</section>`;
}
