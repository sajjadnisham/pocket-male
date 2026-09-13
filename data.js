/* Pocket Malé — shared data for the app (index.html) and the 3D world (world.html).
   The Dhivehi here has NOT been reviewed by a native speaker. */

/* ---------- situations ---------- */
const SITUATIONS = [
  {
    id:'teashop', dv:'ސައި ހޮޓާ', rom:'sai hotaa', en:'Tea shop', spot:'majeedhee',
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
    id:'market', dv:'މާރުކޭޓް', rom:'maarukeyt', en:'Local Market', spot:'market',
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
    id:'ferry', dv:'ފެރީ', rom:'feri', en:'Ferry', spot:'hulhu-centre',
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
    id:'taxi', dv:'ޓެކްސީ', rom:'teksee', en:'Taxi', spot:'majeedhee',
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
    id:'pharmacy', dv:'ބޭސްފިހާރަ', rom:'beysfihaara', en:'Pharmacy', spot:'sultan-park',
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
    id:'landlord', dv:'ގޭގެ ވެރިޔާ', rom:'geyge veriyaa', en:'Landlord', spot:'male-south',
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
    id:'shop', dv:'ފިހާރަ', rom:'fihaara', en:'Corner shop', spot:'majeedhee',
    note:'Card is widely taken now, but the machine goes down often enough that you should keep a couple of hundred rufiyaa in small notes. If you want something held while you fetch cash, the word that makes it happen is ބަހައްޓާ.',
    turns:[
      {s:'you', dv:'ކާޑުން ދެއްކިދާނެތަ؟', rom:'kaadun dhekkidhaanetha?', en:'Can I pay by card?'},
      {s:'them', dv:'ކާޑު މެޝިން ހަލާކުވެފައި', rom:'kaadu machine halaakuvefai', en:'The card machine is down.'},
      {s:'you', dv:'މީތި ބަހައްޓާލަދީފާނަންތަ؟', rom:'meethi bahattaaladheefaanantha?', en:'Could you hold this for me?'},
      {s:'you', dv:'ފައިސާ ހިފައިގެން އަންނާނަން', rom:'faisaa hifaigen annaanan', en:"I'll come back with cash."}
    ]
  },
  {
    id:'clinic', dv:'ހޮސްޕިޓަލް', rom:'hospital', en:'Clinic', spot:'sultan-park',
    note:'IGMH is the public hospital and ADK the main private one. You take a number and wait, sometimes a long while — going early matters more than anything you can say at the desk.',
    turns:[
      {s:'you', dv:'ޑޮކްޓަރަށް ދައްކަން ބޭނުން', rom:'doctor-ah dhakkan beynun', en:"I'd like to see a doctor."},
      {s:'them', dv:'އާސަންދަ ބޭނުންކުރަނީތަ؟', rom:'aasandha beynunkuraneetha?', en:'Are you using Aasandha?'},
      {s:'them', dv:'އައިޑީ ކާޑު ދެއްވަބަލަ', rom:'ID kaadu dhevvabala', en:'Your ID card, please.'},
      {s:'you', dv:'ނަންބަރު ކޮންއިރަކުން؟', rom:'namburu kon-irakun?', en:"When's my number up?"},
      {s:'you', dv:'ބަނޑުގައި ރިއްސަނީ', rom:'bandugai rissanee', en:'I have a stomach ache.'}
    ]
  }
];

/* ---------- street view spots (verified pano IDs) ---------- */
const SPOTS = {
  'majeedhee':   {island:'male',  name:'Majeedhee Magu',      short:'Majeedhee Magu', dv:'މަޖީދީ މަގު',            rom:'majeedhee magu',
                  desc:"Malé's main east–west street. Tea shops, phone shops and the densest scooter traffic in the country.",
                  pano:'CIHM0ogKEICAgICE2K2-Yw', lat:4.1754959, lng:73.5093474, heading:69},
  'market':      {island:'male',  name:'Local Market waterfront', short:'Local Market', dv:'ލޯކަލް މާރުކޭޓް',    rom:'local maarukeyt',
                  desc:'The north harbour road, with the fish market and the produce market side by side and the dhonis tied up behind.',
                  pano:'CIHM0ogKEICAgIDqvf7-9wE', lat:4.1784198, lng:73.5107529, heading:300},
  'sultan-park': {island:'male',  name:'Sultan Park',          short:'Sultan Park', dv:'ސުލްޠާން ޕާކް',          rom:'sultan park',
                  desc:'Green space beside the Old Friday Mosque, in the government quarter — ministries, the hospital and the pharmacies are all within a few minutes.',
                  pano:'CIHM0ogKEICAgICFpffqXw', lat:4.177195, lng:73.510573, heading:4},
  'male-south':  {island:'male',  name:'Southern Malé',        short:'Southern Malé', dv:'މާލެ ދެކުނު',            rom:'maale dhekunu',
                  desc:'The residential grid south of Majeedhee Magu — narrow lanes, tall blocks, and where most of the rooms for rent actually are.',
                  pano:'CIHM0ogKEICAgIDcx7S5rAE', lat:4.1745498, lng:73.5108431, heading:0},
  'hulhu-centre':{island:'hulhumale', name:'Hulhumalé centre', short:'Hulhumalé centre', dv:'ހުޅުމާލެ',               rom:'hulhumale',
                  desc:'Wide planned streets on reclaimed land, twenty minutes from Malé by bridge or ferry. Everything here was sea in 1997.',
                  pano:'CIHM0ogKEICAgIDa0eeFyQE', lat:4.2114331, lng:73.5399576, heading:238},
  'hulhu-beach': {island:'hulhumale', name:'Hulhumalé beach',  short:'The beach', dv:'ހުޅުމާލެ ބީޗް',          rom:'hulhumale beach',
                  desc:'The east-facing artificial beach. Where Malé goes in the evening when the city gets too hot to sit in.',
                  pano:'CIHM0ogKEICAgIDa0f-0XA', lat:4.216018, lng:73.5454479, heading:175}
};

function panoEmbed(s){
  return 'https://www.google.com/maps/embed?pb=!4v1!6m8!1m7!1s' + s.pano
       + '!2m2!1d' + s.lat + '!2d' + s.lng
       + '!3f' + s.heading + '!4f0!5f0.7820865974627469';
}
function panoLink(s){
  return 'https://www.google.com/maps/@?api=1&map_action=pano&pano=' + s.pano
       + '&heading=' + s.heading + '&pitch=0&fov=90';
}
