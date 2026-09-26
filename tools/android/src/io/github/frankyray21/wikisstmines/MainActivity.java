package io.github.frankyray21.wikisstmines;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.KeyEvent;
import android.view.Window;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * Application Android du WIKI SST — Mines : une fenêtre sur le site publié, sans barre d'adresse.
 *
 * Le contenu n'est pas embarqué : il vient du site, et le service worker du site le garde pour la
 * consultation sans réseau (« Télécharger hors ligne »). L'application n'a donc pas à être
 * republiée quand le wiki change. Les liens vers d'autres sites, les PDF et les téléchargements
 * s'ouvrent dans le navigateur de l'appareil ; le bouton Retour remonte l'historique du wiki.
 * Le bouton « PDF » des articles passe par le service d'impression d'Android (« Enregistrer au
 * format PDF »), sans réseau : la page l'appelle par window.WikiSSTMinesApp.imprimer(titre).
 */
public class MainActivity extends Activity {
    static final String ACCUEIL = "https://frankyray21.github.io/wiki-sst-mines/";
    static final String HORS_LIGNE = "file:///android_asset/hors-ligne.html";
    static final int FOND = 0xFF16181D;   // fond du thème sombre du wiki : pas d'éclair blanc au démarrage

    private WebView vue;

    @Override
    protected void onCreate(Bundle etat) {
        super.onCreate(etat);
        Window fenetre = getWindow();
        fenetre.setStatusBarColor(FOND);
        fenetre.setNavigationBarColor(FOND);

        vue = new WebView(this);
        vue.setBackgroundColor(FOND);
        WebSettings reglages = vue.getSettings();
        reglages.setJavaScriptEnabled(true);       // recherche, thème, avis, synchronisation
        reglages.setDomStorageEnabled(true);       // favoris, thème, file d'attente des avis
        reglages.setAllowFileAccess(false);        // seule la page locale « hors ligne » est lue
        reglages.setUserAgentString(reglages.getUserAgentString() + " WikiSSTMinesApp/" + BuildConfig.VERSION);
        vue.addJavascriptInterface(new Pont(), "WikiSSTMinesApp");
        vue.setWebViewClient(new Client());
        vue.setWebChromeClient(new WebChromeClient());
        vue.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String agent, String disposition, String type, long taille) {
                ouvrirAilleurs(url);
            }
        });
        setContentView(vue);

        if (etat == null || vue.restoreState(etat) == null) vue.loadUrl(ACCUEIL);
    }

    /** Une page du wiki, qui s'affiche dans l'application ; tout le reste part au navigateur. */
    static boolean interne(String url) {
        if (url == null || !url.startsWith(ACCUEIL)) return false;
        String chemin = url.split("[?#]", 2)[0].toLowerCase();
        return !chemin.endsWith(".pdf") && !chemin.endsWith(".apk");
    }

    void ouvrirAilleurs(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Aucune application pour ouvrir ce lien.", Toast.LENGTH_LONG).show();
        }
    }

    /** Ce que la page peut demander à l'application : seulement imprimer la page affichée. */
    private class Pont {
        @JavascriptInterface
        public void imprimer(final String titre) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    String nom = titre == null || titre.trim().isEmpty() ? "Wiki SST" : titre.trim();
                    PrintManager impression = (PrintManager) getSystemService(PRINT_SERVICE);
                    if (impression == null) {
                        Toast.makeText(MainActivity.this, "Impression indisponible sur cet appareil.", Toast.LENGTH_LONG).show();
                        return;
                    }
                    impression.print(nom, vue.createPrintDocumentAdapter(nom), new PrintAttributes.Builder().build());
                }
            });
        }
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView v, String url) {
            if (url.startsWith(HORS_LIGNE) || interne(url)) return false;
            ouvrirAilleurs(url);
            return true;
        }

        @Override
        public void onReceivedError(WebView v, int code, String description, String url) {
            // Page du wiki injoignable et absente du cache (première ouverture sans réseau) :
            // la page locale l'explique au lieu de la page d'erreur du système.
            if (url != null && url.startsWith(ACCUEIL)) v.loadUrl(HORS_LIGNE);
        }
    }

    @Override
    public boolean onKeyDown(int touche, KeyEvent evenement) {
        if (touche == KeyEvent.KEYCODE_BACK && vue.canGoBack()) {
            vue.goBack();
            return true;
        }
        return super.onKeyDown(touche, evenement);
    }

    @Override
    protected void onSaveInstanceState(Bundle etat) {
        super.onSaveInstanceState(etat);
        vue.saveState(etat);
    }

    @Override
    protected void onPause() { vue.onPause(); super.onPause(); }

    @Override
    protected void onResume() { super.onResume(); vue.onResume(); }

    @Override
    protected void onDestroy() { vue.destroy(); super.onDestroy(); }
}
