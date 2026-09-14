/* Pocket Malé — deployment settings. Fill these in after following server/README.md.
   Nothing here is secret: the OpenAI key lives only in the Cloudflare Worker. */
window.POCKET_CONFIG = {
  aiEndpoint: '',   // your worker URL, e.g. 'https://pocket-male-ai.yourname.workers.dev'
  upgradeUrl: '',   // checkout link for Pocket Malé Plus (Gumroad or Lemon Squeezy)
  plusPrice: '',    // shown on the upgrade card, e.g. '$4.99'
  androidApk: 'https://github.com/sajjadnisham/pocket-male/releases/download/android-latest/pocket-male.apk'
};
