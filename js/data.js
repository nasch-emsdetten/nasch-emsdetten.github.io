// ── Mitarbeiterdaten ────────────────────────────────────────
const USERS = {
  '1001': { name: 'Lee Ko',              initials: 'LK', typ: 'VZ', role: 'admin',    label: 'Vollzeit · Filialleiterin', urlaubRest: 12, wunschKont: 3, homeoffice: true },
  '1002': { name: 'Jennifer Haak',       initials: 'JH', typ: 'VZ', role: 'vertretung',label: 'Vollzeit · Vertretung',     urlaubRest: 8,  wunschKont: 3, homeoffice: true },
  '1003': { name: 'Filiz Bektik',        initials: 'FB', typ: 'VZ', role: 'user',     label: 'Vollzeit',                  urlaubRest: 15, wunschKont: 3, homeoffice: false },
  '1004': { name: 'Suba Srikunathan',    initials: 'SS', typ: 'TZ', role: 'user',     label: 'Teilzeit',                  urlaubRest: 10, wunschKont: 2, homeoffice: false },
  '1005': { name: 'Lina Will',           initials: 'LW', typ: 'TZ', role: 'user',     label: 'Teilzeit',                  urlaubRest: 6,  wunschKont: 2, homeoffice: false },
  '1006': { name: 'Aneta Michalska',     initials: 'AM', typ: 'TZ', role: 'user',     label: 'Teilzeit',                  urlaubRest: 9,  wunschKont: 2, homeoffice: false },
  '1007': { name: 'Leon Neubauer',       initials: 'LN', typ: 'TZ', role: 'user',     label: 'Teilzeit',                  urlaubRest: 14, wunschKont: 2, homeoffice: false },
  '1008': { name: 'Liubov Ovcharenko',   initials: 'LO', typ: 'TZ', role: 'user',     label: 'Teilzeit',                  urlaubRest: 11, wunschKont: 2, homeoffice: false },
  '1009': { name: 'Robin Berkenheide',   initials: 'RB', typ: 'AH', role: 'user',     label: 'Aushilfe',                  urlaubRest: 0,  wunschKont: 1, homeoffice: false },
  '1010': { name: 'Zaira Jara',          initials: 'ZJ', typ: 'AH', role: 'user',     label: 'Aushilfe',                  urlaubRest: 0,  wunschKont: 1, homeoffice: false, azubi: false },
  '1011': { name: 'Tissa Rajan',         initials: 'TR', typ: 'AH', role: 'user',     label: 'Aushilfe',                  urlaubRest: 0,  wunschKont: 1, homeoffice: false },
  '1012': { name: 'Assol Ovcharenko',    initials: 'AO', typ: 'AH', role: 'user',     label: 'Aushilfe',                  urlaubRest: 0,  wunschKont: 1, homeoffice: false },
  '1013': { name: 'Carina Botkin',       initials: 'CB', typ: 'AH', role: 'user',     label: 'Aushilfe',                  urlaubRest: 0,  wunschKont: 1, homeoffice: false },
  '1014': { name: 'Luisa Hosch',         initials: 'LH', typ: 'AH', role: 'user',     label: 'Aushilfe',                  urlaubRest: 0,  wunschKont: 1, homeoffice: false },
  '1015': { name: 'Altmas Khan',         initials: 'AK', typ: 'AH', role: 'user',     label: 'Aushilfe',                  urlaubRest: 0,  wunschKont: 1, homeoffice: false },
};

// PINs werden in Produktion aus Firebase geladen
// Hier nur für Demo/Test
const PINS = {
  '1001':'1001','1002':'1002','1003':'1003','1004':'1004','1005':'1005',
  '1006':'1006','1007':'1007','1008':'1008','1009':'1009','1010':'1010',
  '1011':'1011','1012':'1012','1013':'1013','1014':'1014','1015':'1015',
};

// Gesperrte einfache PINs
const BLOCKED_PINS = [
  '1234','0000','1111','2222','3333','4444','5555','6666','7777','8888',
  '9999','1212','0101','1230','2580','1357','9876','6543',
];

// ── App-Zustand ─────────────────────────────────────────────
const AppState = {
  currentUser: null,
  currentPin: null,
  weekOffset: 0,
  currentPage: 'pagePlan',
  pageHistory: [],
};

// ── Wochenplan-Demo-Daten ────────────────────────────────────
// Format: [Mo, Di, Mi, Do, Fr, Sa, So]
// Shift-Typen: F=Früh, S=Spät, TS=Teilschicht, U=Urlaub, K=Krank, KV=KV, BS=Berufsschule,
//              O=Office, T=Tagung, HO=Home-Office, R=Reinigung, -=Frei
const PLAN = {
  '1001': [
    {t:'F',z:'08:00–15:30',r:'Vo/GL'},
    {t:'T',z:'Tagung',r:''},
    {t:'-',z:'',r:''},
    {t:'-',z:'',r:''},
    {t:'F',z:'08:00–15:30',r:'Vo/GL'},
    {t:'F',z:'08:00–15:30',r:'Vo/GL'},
    {t:'-',z:'',r:''},
  ],
  '1002': [
    {t:'U',z:'Urlaub',r:''},
    {t:'U',z:'Urlaub',r:''},
    {t:'U',z:'Urlaub',r:''},
    {t:'U',z:'Urlaub',r:''},
    {t:'U',z:'Urlaub',r:''},
    {t:'-',z:'',r:''},
    {t:'-',z:'',r:''},
  ],
  '1003': [
    {t:'S',z:'15:30–22:00',r:'V/SL'},
    {t:'F',z:'09:30–15:30',r:'V/SL'},
    {t:'S',z:'15:30–22:00',r:'V/SL'},
    {t:'-',z:'',r:''},
    {t:'S',z:'15:30–22:00',r:'V'},
    {t:'F',z:'08:00–18:00',r:'V/SL'},
    {t:'-',z:'',r:''},
  ],
  '1004': [
    {t:'WF',z:'Wunschfrei',r:''},
    {t:'F',z:'08:00–15:30',r:'Vo/GL'},
    {t:'F',z:'08:00–15:30',r:'Vo/GL'},
    {t:'F',z:'08:00–15:30',r:'Vo/GL'},
    {t:'WF',z:'½ Früh',r:''},
    {t:'-',z:'',r:''},
    {t:'-',z:'',r:''},
  ],
  '1005': [
    {t:'BS',z:'Berufsschule',r:''},
    {t:'S',z:'18:00–21:00',r:'TO'},
    {t:'S',z:'18:00–21:00',r:'TO'},
    {t:'WF',z:'Wunschfrei',r:''},
    {t:'S',z:'18:00–21:00',r:'TO'},
    {t:'-',z:'',r:''},
    {t:'-',z:'',r:''},
  ],
  '1006': [
    {t:'-',z:'',r:''},
    {t:'F',z:'09:00–15:30',r:'V'},
    {t:'F',z:'09:00–15:30',r:'V'},
    {t:'-',z:'',r:''},
    {t:'F',z:'09:00–15:30',r:'V'},
    {t:'-',z:'',r:''},
    {t:'-',z:'',r:''},
  ],
  '1007': [
    {t:'S',z:'15:30–22:00',r:'V/SL'},
    {t:'S',z:'15:30–22:00',r:'V/SL'},
    {t:'-',z:'',r:''},
    {t:'-',z:'',r:''},
    {t:'S',z:'15:30–22:00',r:'V'},
    {t:'F',z:'08:00–18:00',r:'V/SL'},
    {t:'-',z:'',r:''},
  ],
  '1008': [
    {t:'S',z:'18:00–22:00',r:'V'},
    {t:'S',z:'18:00–22:00',r:'V'},
    {t:'-',z:'',r:''},
    {t:'S',z:'18:00–22:00',r:'V'},
    {t:'-',z:'',r:''},
    {t:'F',z:'10:00–15:30',r:'V'},
    {t:'-',z:'',r:''},
  ],
  '1009': [
    {t:'-',z:'',r:''},
    {t:'KV',z:'KV',r:''},
    {t:'KV',z:'KV',r:''},
    {t:'S',z:'18:00–22:00',r:'V'},
    {t:'-',z:'',r:''},
    {t:'F',z:'10:00–15:30',r:'V'},
    {t:'-',z:'',r:''},
  ],
  '1010': [
    {t:'WF',z:'Wunschfrei',r:''},
    {t:'F',z:'12:00–14:00',r:'TO'},
    {t:'F',z:'12:00–14:00',r:'TO'},
    {t:'S',z:'15:30–22:00',r:'GL/SL'},
    {t:'-',z:'',r:''},
    {t:'S',z:'15:30–22:00',r:'GL/SL'},
    {t:'-',z:'',r:''},
  ],
  '1011': [
    {t:'R',z:'Reinigung',r:''},
    {t:'S',z:'18:00–21:00',r:'TO'},
    {t:'R',z:'Reinigung',r:''},
    {t:'S',z:'18:00–21:00',r:'TO'},
    {t:'R',z:'Reinigung',r:''},
    {t:'S',z:'18:30–22:00',r:'TO'},
    {t:'S',z:'15:30–21:00',r:'TO'},
  ],
  '1012': [{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'}],
  '1013': [{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'}],
  '1014': [{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'}],
  '1015': [{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'},{t:'-'}],
};
