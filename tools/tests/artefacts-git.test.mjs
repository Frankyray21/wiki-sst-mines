import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
for (const [chemin, contenu] of [
  ['docs/assets/exemple.css', Buffer.from('a { color: blue; }\r\n/* fin */\r\n')],
  ['docs/w/exemple.html', Buffer.from('<p>Référence</p>\n<p>Suite</p>\r\n')],
  ['docs/files/exemple.png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 255, 0])],
]) {
  test('Git préserve les octets du site même sous Windows : ' + chemin, () => {
    const attendu = createHash('sha1').update(Buffer.from('blob ' + contenu.length + '\0')).update(contenu).digest('hex');
    // Sans -w : ne crée aucun objet Git ni fichier d'exemple.
    const actual = execFileSync('git', ['-c', 'core.autocrlf=true', 'hash-object', '--path=' + chemin, '--stdin'], { cwd: repo, input: contenu }).toString().trim();
    assert.equal(actual, attendu);
  });
}
