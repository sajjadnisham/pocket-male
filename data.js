/* Pocket Malé — shared data for the app (index.html) and the 3D city (city.html).
   The Dhivehi here has NOT been reviewed by a native speaker. */

/* ---------- situations ---------- */
const SITUATIONS = [
  {
    id:'teashop', dv:'ސައި ހޮޓާ', rom:'sai hotaa', en:'Tea shop',
    note:'Short eats (ހެދިކާ) are priced per piece, usually MVR 3–8, and you help yourself from the tray with tongs, then tell them what you took. "Sai" on its own means black tea. Most shops pull the shutter halfway for about fifteen minutes at each prayer time.',
    turns:[
      {s:'you', dv:'ހެދިކާ ހުރިތަ؟', rom:'hedhikaa hurritha?', en:"Have you got any short eats?"},
      {s:'them', dv:'ގުޅަ، ބަޖިޔާ، ބިސް ކީމިޔާ ހުރި', rom:'gulha, bajiyaa, bis keemiyaa huri', en:'Gulha, bajiya, egg keemiya.'},
      {s:'you', dv:'ދެ ގުޅަ އަދި ކަޅު ސައި', rom:'dhe gulha adhi kalhu sai', en:'Two gulha and a black tea.'},
      {s:'them', dv:'ގެންދަނީތަ؟', rom:'gendhaneetha?', en:'Taking it away?'},
      {s:'you', dv:'ނޫން، މިތާ ކާނީ', rom:'noon, mithaa kaanee', en:"No, I'll eat here."},
      {s:'you', dv:'ބިލް ދެއްވަބަލަ', rom:'bill dhevvabala', en:'The bill, please.'}
    ]
  },
  {
    id:'market', dv:'މާރުކޭޓް', rom:'maarukeyt', en:'Local Market',
    note:'Fish is sold by the kilo at the fish market; fruit and veg next door go by the pile, not by weight. Cash only, and the price softens a little if you buy more than one. Ask them to cut and clean it for you — they will, at no extra charge.',
    turns:[
      {s:'you', dv:'މީގެ އަގަކީ ކޮބާ؟', rom:'meege agakee kobaa?', en:"What's the price of this?"},
      {s:'them', dv:'ކިލޯއެއް ފަންސާސް ރުފިޔާ', rom:'kiloeh fansaas rufiyaa', en:'Fifty rufiyaa a kilo.'},
      {s:'you', dv:'އަގުހެޔޮ ކޮށްދީބަލަ', rom:'aguheyo kohdheebala', en:'Make it a bit cheaper for me.'},
      {s:'them', dv:'ކިހާ ވަރެއް ބޭނުމީ؟', rom:'kihaa vareh beynumee?', en:'How much do you want?'},
      {s:'you', dv:'ދެ ކިލޯ', rom:'dhe kilo', en:'Two kilos.'},
      {s:'you', dv:'ކުދިކޮށް ކޮށާލަދީބަލަ', rom:'kudhikoh koshaaladheebala', en:'Cut it small for me.'}
    ]
  },
  {
    id:'ferry', dv:'ފެރީ', rom:'feri', en:'Ferry',
    note:'MTCC ferries run Malé–Hulhumalé and Malé–Villimalé every ten to fifteen minutes, and cost a few rufiyaa. Since the bridge opened, buses are faster to Hulhumalé, but the ferry still wins for Villimalé. Tap your card at the gate — most people use the RaajjeTransport card.',
    turns:[
      {s:'you', dv:'ހުޅުމާލެއަށް ފެރީ ކޮންއިރަކު؟', rom:'hulhumaleah feri kon-iraku?', en:"When's the ferry to Hulhumalé?"},
      {s:'them', dv:'ފަނަރަ މިނެޓު ތެރޭ', rom:'fanara minetu therey', en:'In fifteen minutes.'},
      {s:'you', dv:'ޓިކެޓް ކޮންތާކުން؟', rom:'ticket konthaakun?', en:'Where do I get a ticket?'},
      {s:'them', dv:'ކާޑު ޖައްސަވާ', rom:'kaadu jassavaa', en:'Just tap your card.'},
      {s:'you', dv:'މިއީ ވިލިމާލެ ފެރީތަ؟', rom:'mee villimale feritha?', en:'Is this the Villimalé ferry?'}
    ]
  },
  {
    id:'taxi', dv:'ޓެކްސީ', rom:'teksee', en:'Taxi',
    note:'Fares inside Malé are flat, not metered — around MVR 30, more if you cross the bridge to Hulhumalé or the airport. Plenty of drivers still take cash only, and you phone a taxi centre or use an app rather than hailing one on the street.',
    turns:[
      {s:'you', dv:'މަޖީދީ މަގަށް ދެވިދާނެތަ؟', rom:'majeedhee magah dhevidhaanetha?', en:'Can you take me to Majeedhee Magu?'},
      {s:'them', dv:'ކޮން ހިސާބަކަށް؟', rom:'kon hisaabakah?', en:'Whereabouts?'},
      {s:'you', dv:'ޗާންދަނީ މަގު ކަންމަތި', rom:'chaandhanee magu kanmathi', en:'The Chaandhanee Magu corner.'},
      {s:'them', dv:'ކާޑެއް ނުހިނގާނެ', rom:'kaadeh nuhingaane', en:"Card won't work — cash."},
      {s:'you', dv:'މަޑުކޮށްލަދީބަލަ', rom:'madhukohladheebala', en:'Wait for me a moment.'}
    ]
  },
  {
    id:'pharmacy', dv:'ބޭސްފިހާރަ', rom:'beysfihaara', en:'Pharmacy',
    note:'Aasandha is the national health insurance scheme — say whether you are using it, and have your ID card out. STO pharmacies keep the longest hours and there is usually one open near IGMH through the night.',
    turns:[
      {s:'you', dv:'މި ބޭސް ސިޓީ', rom:'mi beys sitee', en:'This prescription, please.'},
      {s:'them', dv:'އާސަންދަ ބޭނުންކުރަނީތަ؟', rom:'aasandha beynunkuraneetha?', en:'Are you using Aasandha?'},
      {s:'you', dv:'ނޫން، އަމިއްލައަށް ދައްކާނީ', rom:'noon, amillaah dhakkaanee', en:"No, I'll pay myself."},
      {s:'you', dv:'ބޮލުގައި ރިއްސަނީ', rom:'bolugai rissanee', en:'I have a headache.'},
      {s:'them', dv:'ދުވާލަކު ތިން ފަހަރު', rom:'dhuvaalaku thin faharu', en:'Three times a day.'}
    ]
  },
  {
    id:'landlord', dv:'ގޭގެ ވެރިޔާ', rom:'geyge veriyaa', en:'Landlord',
    note:'Rent is quoted per month, and the deposit is usually one or two months on top, plus an agent fee. Water and electricity are almost never included — ask, because Malé bills can be a real surprise in the hot months.',
    turns:[
      {s:'you', dv:'ކުލި ކިހާ ވަރެއް؟', rom:'kuli kihaa vareh?', en:'How much is the rent?'},
      {s:'them', dv:'ބާރަ ހާސް، ޑިޕޮސިޓް ދެ މަސް', rom:'baara haas, deposit dhe mas', en:'Twelve thousand, two months deposit.'},
      {s:'you', dv:'ފެނާއި ކަރަންޓް ހިމެނޭތަ؟', rom:'fenaai karantu himeneytha?', en:'Are water and electricity included?'},
      {s:'them', dv:'ވަކިން ދައްކަވަންޖެހޭނެ', rom:'vakin dhakkavaanjeheyne', en:'You pay those separately.'},
      {s:'you', dv:'ކޮޓަރި ބަލާލެވިދާނެތަ؟', rom:'kotari balaalevidhaanetha?', en:'Can I see the room?'}
    ]
  },
  {
    id:'shop', dv:'ފިހާރަ', rom:'fihaara', en:'Corner shop',
    note:'Card is widely taken now, but the machine goes down often enough that you should keep a couple of hundred rufiyaa in small notes. If you want something held while you fetch cash, the word that makes it happen is ބަހައްޓާ.',
    turns:[
      {s:'you', dv:'ކާޑުން ދެއްކިދާނެތަ؟', rom:'kaadun dhekkidhaanetha?', en:'Can I pay by card?'},
      {s:'them', dv:'ކާޑު މެޝިން ހަލާކުވެފައި', rom:'kaadu machine halaakuvefai', en:'The card machine is down.'},
      {s:'you', dv:'މީތި ބަހައްޓާލަދީފާނަންތަ؟', rom:'meethi bahattaaladheefaanantha?', en:'Could you hold this for me?'},
      {s:'you', dv:'ފައިސާ ހިފައިގެން އަންނާނަން', rom:'faisaa hifaigen annaanan', en:"I'll come back with cash."}
    ]
  },
  {
    id:'clinic', dv:'ހޮސްޕިޓަލް', rom:'hospital', en:'Clinic',
    note:'IGMH is the public hospital and ADK the main private one. You take a number and wait, sometimes a long while — going early matters more than anything you can say at the desk.',
    turns:[
      {s:'you', dv:'ޑޮކްޓަރަށް ދައްކަން ބޭނުން', rom:'doctor-ah dhakkan beynun', en:"I'd like to see a doctor."},
      {s:'them', dv:'އާސަންދަ ބޭނުންކުރަނީތަ؟', rom:'aasandha beynunkuraneetha?', en:'Are you using Aasandha?'},
      {s:'them', dv:'އައިޑީ ކާޑު ދެއްވަބަލަ', rom:'ID kaadu dhevvabala', en:'Your ID card, please.'},
      {s:'you', dv:'ނަންބަރު ކޮންއިރަކުން؟', rom:'namburu kon-irakun?', en:"When's my number up?"},
      {s:'you', dv:'ބަނޑުގައި ރިއްސަނީ', rom:'bandugai rissanee', en:'I have a stomach ache.'}
    ]
  },
  {
    id:'kurumba', dv:'ކުރުނބާ', rom:'kurumba', en:'Coconut cart',
    note:'Young coconuts (kurumba) are sold chilled from carts and small stalls near the harbour. The seller opens the top for you; when you have finished drinking, hand it back and ask them to split it so you can eat the soft flesh inside.',
    turns:[
      {s:'you', dv:'ކުރުނބާ ހުރިތަ؟', rom:'kurumba hurritha?', en:'Do you have young coconuts?'},
      {s:'them', dv:'އާނ، ފިނިކުރި ކުރުނބާ ހުރި', rom:'aan, finikuri kurumba huri', en:'Yes, chilled ones.'},
      {s:'you', dv:'ދެ ކުރުނބާ ދީބަލަ', rom:'dhe kurumba dheebala', en:'Two coconuts, please.'},
      {s:'them', dv:'ހުޅުވާލަދެންތަ؟', rom:'hulhuvaaladhentha?', en:'Shall I open them for you?'},
      {s:'you', dv:'އާނ، ސްޓްރޯއެއް ވެސް', rom:'aan, straw-eh ves', en:'Yes, and a straw too.'}
    ]
  },
  {
    id:'restaurant', dv:'ރެސްޓޯރަންޓް', rom:'restoarant', en:'Restaurant',
    note:'Mas huni — tuna, grated coconut, onion and chilli — eaten with roshi and black tea is the classic Malé breakfast. At busy times you share a table; nobody minds.',
    turns:[
      {s:'you', dv:'މަސްހުނި ހުރިތަ؟', rom:'mashuni hurritha?', en:'Do you have mas huni?'},
      {s:'them', dv:'އާނ، ރޮށިއާއެކު', rom:'aan, roshiaa eku', en:'Yes, with roshi.'},
      {s:'you', dv:'ފޮނިކަން ކުޑަކޮށް ސައި', rom:'fonikan kudakoh sai', en:'Tea with less sugar.'},
      {s:'them', dv:'އިތުރު އެއްޗެއް؟', rom:'ithuru ehcheh?', en:'Anything else?'},
      {s:'you', dv:'ފެން ފުޅިއެއް ދީބަލަ', rom:'fen fulhi-eh dheebala', en:'A bottle of water, please.'}
    ]
  },
  {
    id:'phone', dv:'ފޯނު ފިހާރަ', rom:'foanu fihaara', en:'Phone & SIM',
    note:'Both mobile networks have shops along Majeedhee Magu. Visitors need a passport to register a SIM, residents an ID card or work-permit card. Top-ups are sold in almost every corner shop.',
    turns:[
      {s:'you', dv:'ސިމް ކާޑެއް ބޭނުން', rom:'sim kaadeh beynun', en:'I need a SIM card.'},
      {s:'them', dv:'ޕާސްޕޯޓް ނުވަތަ އައިޑީ ކާޑު ދެއްވަބަލަ', rom:'passport nuvatha ID kaadu dhevvabala', en:'Your passport or ID card, please.'},
      {s:'you', dv:'ޑޭޓާ ޕެކޭޖް ކިހާ ވަރެއް؟', rom:'data package kihaa vareh?', en:'How much is a data package?'},
      {s:'them', dv:'ކިހާ ދުވަހަކަށް؟', rom:'kihaa dhuvahakah?', en:'For how many days?'},
      {s:'you', dv:'އެއް މަހަށް', rom:'eh mahah', en:'For one month.'}
    ]
  },
  {
    id:'barber', dv:'ބާބަރ', rom:'baabar', en:'Barber',
    note:'Most barbers are walk-in: sit on the bench and wait your turn. Like other shops they close for about fifteen minutes at each prayer time, so check the clock before you sit down.',
    turns:[
      {s:'you', dv:'ބޮލު ކޮށާލަން ބޭނުން', rom:'bolu koshaalan beynun', en:"I'd like a haircut."},
      {s:'them', dv:'ކިހިނެއް ކޮށާނީ؟', rom:'kihineh koshaanee?', en:'How shall I cut it?'},
      {s:'you', dv:'ތަންކޮޅެއް ކުރުކޮށް', rom:'thankolheh kurukoh', en:'A little shorter.'},
      {s:'them', dv:'ނިމުނީ، ބަލާލާ', rom:'nimunee, balaalaa', en:'Done — have a look.'},
      {s:'you', dv:'ރަނގަޅު، ޝުކުރިއްޔާ', rom:'rangalhu, shukuriyyaa', en:'Good, thank you.'}
    ]
  },
  {
    id:'bank', dv:'ބޭންކް', rom:'baenk', en:'Bank',
    note:'Queues at the main banks run on ticket numbers, so take one as soon as you walk in. Bring your passport or ID for anything beyond a cash withdrawal. US dollars are widely accepted in Malé, but change usually comes back in rufiyaa.',
    turns:[
      {s:'you', dv:'ފައިސާ ބަދަލުކުރަން ބޭނުން', rom:'faisaa badhalukuran beynun', en:"I'd like to change money."},
      {s:'them', dv:'ނަންބަރެއް ނަގާ', rom:'nambareh nagaa', en:'Take a number.'},
      {s:'you', dv:'ޑޮލަރުގެ ރޭޓަކީ ކޮބާ؟', rom:'dolaruge reytakee kobaa?', en:"What's the dollar rate?"},
      {s:'them', dv:'ޕާސްޕޯޓް ދެއްވަބަލަ', rom:'passport dhevvabala', en:'Your passport, please.'},
      {s:'you', dv:'އޭޓީއެމް ކޮބާ؟', rom:'ATM kobaa?', en:"Where's the ATM?"}
    ]
  },
  {
    id:'bus', dv:'ބަސް', rom:'bas', en:'Bus stop',
    note:'Buses cross the bridge between Malé, the airport and Hulhumalé every few minutes, and most riders tap a transport card. The route numbers in these lines are illustrative — check the sign on the front of the bus.',
    turns:[
      {s:'you', dv:'ހުޅުމާލެއަށް ދާ ބަސް ކޮބާ؟', rom:'hulhumaleah dhaa bas kobaa?', en:"Where's the bus to Hulhumalé?"},
      {s:'them', dv:'އެ ހުރީ، އެއް ނަންބަރު', rom:'e huree, eh namburu', en:'That one — number one.'},
      {s:'you', dv:'އެއާޕޯޓަށް ދާނެތަ؟', rom:'eyaarpoatah dhaanetha?', en:'Does it go to the airport?'},
      {s:'them', dv:'ނޫން، އެތަނަށް ދަނީ ދެ ނަންބަރު', rom:'noon, ethanah dhanee dhe namburu', en:'No — number two goes there.'},
      {s:'you', dv:'ކާޑުން ދެއްކިދާނެތަ؟', rom:'kaadun dhekkidhaanetha?', en:'Can I pay by card?'}
    ]
  },
  {
    id:'mosque', dv:'މިސްކިތް', rom:'miskiy', en:'Mosque',
    note:'Malé has a mosque every few streets and shops close for about fifteen minutes at each of the five prayers. Visitors are welcome outside prayer times: cover shoulders and knees, take your shoes off at the door, and ask before visiting the Old Friday Mosque, which needs permission.',
    turns:[
      {s:'you', dv:'ނަމާދު ވަގުތަކީ ކޮން އިރެއް؟', rom:'namaadhu vaguthakee kon ireh?', en:'When is prayer time?'},
      {s:'them', dv:'ފަނަރަ މިނެޓު ފަހުން', rom:'fanara minetu fahun', en:'In fifteen minutes.'},
      {s:'you', dv:'ފައިވާން ބަހައްޓާނީ ކޮން ތާކު؟', rom:'faivaan bahattaanee kon thaaku?', en:'Where do I leave my shoes?'},
      {s:'them', dv:'ދޮރުމަތީގައި ބަހައްޓަވާ', rom:'dhorumatheegai bahattavaa', en:'Leave them by the door.'},
      {s:'you', dv:'އަންހެނުންގެ ބައި ކޮބާ؟', rom:'anhenunge bai kobaa?', en:"Where is the women's section?"},
      {s:'them', dv:'މަތީ ބުރިއަށް', rom:'mathee buriah', en:'Upstairs.'}
    ]
  },
  {
    id:'office', dv:'އޮފީސް', rom:'ofees', en:'Office',
    note:'The working week in the Maldives runs Sunday to Thursday; Friday and Saturday are the weekend. Government counters in Malé use token numbers and ask for your ID card, and many services have moved online to eFaas — worth checking before you queue.',
    turns:[
      {s:'you', dv:'ބައްދަލުވުމަކަށް އައީ', rom:'baddaluvumakah aee', en:"I've come for a meeting."},
      {s:'them', dv:'ކާކާ ބައްދަލުކުރަން؟', rom:'kaakaa baddalukuran?', en:'Who are you meeting?'},
      {s:'you', dv:'މެނޭޖަރާ', rom:'manejaraa', en:'The manager.'},
      {s:'them', dv:'ގޮނޑިއެއްގައި އިށީނދެލައްވާ', rom:'gondi-ehgai isheendhelavvaa', en:'Please take a seat.'},
      {s:'you', dv:'ފޯމު ކޮބާ؟', rom:'foamu kobaa?', en:"Where's the form?"}
    ]
  },
  {
    id:'bakery', dv:'ބޭކަރީ', rom:'beykaree', en:'Bakery',
    note:'Roshi, the thin flatbread eaten with mas huni, is bought by the bundle first thing in the morning, and the early batch sells out. Bakeries also sell loaves, buns and sweet short eats.',
    turns:[
      {s:'you', dv:'ރޮށި ހުރިތަ؟', rom:'roshi hurritha?', en:'Do you have roshi?'},
      {s:'them', dv:'އާނ، ހޫނު ރޮށި', rom:'aan, hoonu roshi', en:'Yes, warm roshi.'},
      {s:'you', dv:'ދިހަ ރޮށި ދީބަލަ', rom:'dhiha roshi dheebala', en:'Ten roshi, please.'},
      {s:'them', dv:'ކޭކު ވެސް ބޭނުންތަ؟', rom:'keyku ves beynuntha?', en:'Would you like cake too?'},
      {s:'you', dv:'ނޫން، ޝުކުރިއްޔާ', rom:'noon, shukuriyyaa', en:'No, thank you.'}
    ]
  },
  {
    id:'tailor', dv:'ޓެއިލަރ', rom:'teilar', en:'Tailor',
    note:'Small tailors along Majeedhee Magu and Chaandhanee Magu alter clothes and sew school uniforms. Alterations usually take a day or two and you pay when you collect.',
    turns:[
      {s:'you', dv:'މި ހެދުން ކުރުކޮށްދެވޭނެތަ؟', rom:'mi hedhun kurukohdheveynetha?', en:'Can you shorten this?'},
      {s:'them', dv:'ކިހާ ވަރަކަށް؟', rom:'kihaa varakah?', en:'By how much?'},
      {s:'you', dv:'ތަންކޮޅެއް', rom:'thankolheh', en:'A little.'},
      {s:'them', dv:'މާދަމާ ނިމޭނެ', rom:'maadhamaa nimeyne', en:"It'll be ready tomorrow."},
      {s:'you', dv:'ކިހާ ވަރެއް؟', rom:'kihaa vareh?', en:'How much?'}
    ]
  },
  {
    id:'laundry', dv:'ލޯންޑްރީ', rom:'loandree', en:'Laundry',
    note:'Rooms in Malé are small and many have nowhere for a washing machine, so laundries are on almost every street. Prices are per piece or per kilo; ironing costs extra.',
    turns:[
      {s:'you', dv:'މި ހެދުން ދޮވެދެވޭނެތަ؟', rom:'mi hedhun dhovedheveynetha?', en:'Can you wash these clothes?'},
      {s:'them', dv:'އިސްތިރި ވެސް ކުރަންތަ؟', rom:'isthiri ves kurantha?', en:'Iron them too?'},
      {s:'you', dv:'އާނ، އިސްތިރި ވެސް', rom:'aan, isthiri ves', en:'Yes, ironed too.'},
      {s:'them', dv:'ހަވީރު ނިމޭނެ', rom:'haveeru nimeyne', en:'Ready this afternoon.'},
      {s:'you', dv:'ކިހާ ވަރެއް؟', rom:'kihaa vareh?', en:'How much?'}
    ]
  },
  {
    id:'garage', dv:'ސައިކަލް ގަރާޖު', rom:'saikal garaaju', en:'Bike garage',
    note:'Malé runs on scooters, so there is a small repair garage on nearly every street. Punctures and batteries are quick, cheap fixes; bigger jobs can take a day.',
    turns:[
      {s:'you', dv:'ސައިކަލު ސްޓާޓް ނުވަނީ', rom:'saikalu staat nuvanee', en:"My bike won't start."},
      {s:'them', dv:'ބެޓެރީ ބަލާލާނަން', rom:'beteree balaalaanan', en:"I'll check the battery."},
      {s:'you', dv:'ކިހާއިރެއް ނަގާނީ؟', rom:'kihaaireh nagaanee?', en:'How long will it take?'},
      {s:'them', dv:'އެއް ގަޑިއިރު', rom:'eh gadiiru', en:'One hour.'},
      {s:'you', dv:'ޓަޔަރުގައި ވައި ލާދީބަލަ', rom:'tayarugai vai laadheebala', en:'Please put air in the tyre.'}
    ]
  },
  {
    id:'guesthouse', dv:'ގެސްޓްހައުސް', rom:'gesthaus', en:'Guesthouse',
    note:'Hulhumalé is full of guesthouses near the beach, a short ride from the airport. Foreign guests show a passport at check-in, and breakfast is often included.',
    turns:[
      {s:'you', dv:'ކޮޓަރިއެއް ހުސްތަ؟', rom:'kotari-eh husttha?', en:'Is a room free?'},
      {s:'them', dv:'ކިހާ ރޭއަކަށް؟', rom:'kihaa reyakah?', en:'For how many nights?'},
      {s:'you', dv:'ދެ ރޭއަކަށް', rom:'dhe reyakah', en:'For two nights.'},
      {s:'them', dv:'ނާސްތާ ހިމެނޭ', rom:'naasthaa himeney', en:'Breakfast is included.'},
      {s:'you', dv:'ވައިފައި ޕާސްވޯޑަކީ ކޮބާ؟', rom:'waifai paasvoadakee kobaa?', en:"What's the Wi-Fi password?"}
    ]
  }
];

/* ---------- Dhivehi audio ----------
   Pre-generated with OmniVoice (k2-fsa/OmniVoice, language "dv") by
   tools/generate-audio.py. audio/manifest.json maps each Thaana line to its
   file. Model weights are CC-BY-NC: fine for this free, non-commercial site;
   replace the audio before charging for anything.
   Playback starts synchronously inside the tap handler once the manifest is
   loaded, because mobile Safari refuses audio started after an await. */
const DhivehiAudio = (() => {
  const MUTE_KEY = 'pocketmale.mute';
  let lines = null, loading = null, current = null, token = 0;
  let muted = false; try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}
  const key = t => String(t || '').trim();
  function load(){
    return loading || (loading = fetch('./audio/manifest.json')
      .then(r => r.ok ? r.json() : {})
      .then(j => (lines = j.lines || {}))
      .catch(() => (lines = {})));
  }
  function stop(){ token++; if (current){ current.pause(); current = null; } }
  function playOne(text, my){
    const f = lines && lines[key(text)];
    if (!f || muted || my !== token) return Promise.resolve(false);
    const a = new Audio('./audio/' + f.file);
    current = a;
    const done = new Promise(res => { a.onended = () => res(true); a.onerror = () => res(false); });
    return a.play().then(() => done, () => false);
  }
  function play(text){
    if (!lines) return load().then(() => play(text));
    stop(); return playOne(text, token);
  }
  function playSequence(texts, gapMs){
    if (!lines) return load().then(() => playSequence(texts, gapMs));
    stop(); const my = token;
    let chain = Promise.resolve(false);
    texts.forEach((t, i) => {
      chain = i === 0 ? playOne(t, my)
        : chain.then(ok => new Promise(r => setTimeout(r, gapMs || 0)).then(() => playOne(t, my)).then(ok2 => ok || ok2));
    });
    return chain;
  }
  function setMuted(v){ muted = !!v; if (muted) stop(); try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {} }
  const has = t => !!(lines && lines[key(t)]);
  load();
  return {load, play, playSequence, stop, has, setMuted, isMuted: () => muted};
})();
