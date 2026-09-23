import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;

import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Collections;

/**
 * Signe un APK (schéma v2) avec la clé d'un magasin PKCS12, puis vérifie la signature.
 * Le schéma v1 (JAR) n'est pas posé : l'application exige Android 7 (API 24), qui vérifie le v2,
 * et le v1 d'apksig 2.3.0 dépend d'une méthode interne retirée des JDK récents.
 * Usage : java -cp apksig.jar:. Signataire entree.apk sortie.apk magasin.p12 alias
 * Le mot de passe du magasin est lu dans la variable d'environnement WIKI_APK_MDP.
 */
public class Signataire {
    public static void main(String[] args) throws Exception {
        File entree = new File(args[0]), sortie = new File(args[1]);
        char[] mdp = System.getenv("WIKI_APK_MDP").toCharArray();
        KeyStore magasin = KeyStore.getInstance("PKCS12");
        try (FileInputStream f = new FileInputStream(args[2])) { magasin.load(f, mdp); }
        PrivateKey cle = (PrivateKey) magasin.getKey(args[3], mdp);
        X509Certificate certificat = (X509Certificate) magasin.getCertificate(args[3]);
        ApkSigner.SignerConfig signataire = new ApkSigner.SignerConfig.Builder(
                "WIKISST", cle, Collections.singletonList(certificat)).build();
        new ApkSigner.Builder(Collections.singletonList(signataire))
                .setInputApk(entree).setOutputApk(sortie).setMinSdkVersion(24)
                .setV1SigningEnabled(false).setV2SigningEnabled(true)
                .setCreatedBy("WIKI SST Mines").build().sign();
        ApkVerifier.Result r = new ApkVerifier.Builder(sortie).build().verify();
        System.out.println("verifie=" + r.isVerified() + " v1=" + r.isVerifiedUsingV1Scheme() + " v2=" + r.isVerifiedUsingV2Scheme());
        for (Object e : r.getErrors()) System.out.println("ERREUR " + e);
        for (Object w : r.getWarnings()) System.out.println("AVERTISSEMENT " + w);
        if (!r.isVerified() || !r.isVerifiedUsingV2Scheme()) System.exit(1);
    }
}
