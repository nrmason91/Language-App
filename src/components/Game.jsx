"use client";
import React from "react";
import * as Papa from "papaparse";



// ==================== UTILITY FUNCTIONS ====================
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c').replace(/ã/g, 'a').replace(/õ/g, 'o')
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
    .replace(/â/g, 'a').replace(/ê/g, 'e').replace(/ô/g, 'o').replace(/à/g, 'a').replace(/ü/g, 'u')
    .replace(/[.,!?;:'"()]/g, '')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i-1] === b[j-1] ? d[i-1][j-1] : 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1]);
    }
  }
  return d[m][n];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return ((maxLen - levenshtein(a, b)) / maxLen) * 100;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function spellHint(word) {
  return word.split(' ').map(w => w[0] + ' ' + Array(w.length - 1).fill('_').join(' ')).join('   ');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== PRESET LESSONS ====================
const PRESET_PREPOSITIONS = {
  id: 'preset-prepositions-de',
  name: '📚 Prepositions (DE +)',
  isPreset: true,
  type: 'prepositions',
  rules: [
    {p:'de + o',e:'do',ex:'O livro do menino.',ee:'The boy\'s book.'},
    {p:'de + a',e:'da',ex:'A casa da Maria.',ee:'Maria\'s house.'},
    {p:'de + aquele',e:'daquele',ex:'Gosto daquele carro.',ee:'I like that car.'},
    {p:'de + aquela',e:'daquela',ex:'Perto daquela loja.',ee:'Near that store.'},
    {p:'de + ele',e:'dele',ex:'O carro dele é novo.',ee:'His car is new.'},
    {p:'de + ela',e:'dela',ex:'A mãe dela chegou.',ee:'Her mother arrived.'},
    {p:'de + esse',e:'desse',ex:'Preciso desse livro.',ee:'I need this book.'},
    {p:'de + essa',e:'dessa',ex:'Gosto dessa música.',ee:'I like this song.'},
    {p:'de + isso',e:'disso',ex:'Não gosto disso.',ee:'I don\'t like this.'},
  ],
  tests: [
    // DO (3 questions)
    {en:'The car of the man.',pt:'O carro do homem.',rule:'de + o = do'},
    {en:'The door of the house.',pt:'A porta da casa.',rule:'de + a = da'},
    {en:'The end of the movie.',pt:'O fim do filme.',rule:'de + o = do'},
    // DA (3 questions)
    {en:'The color of the shirt.',pt:'A cor da camisa.',rule:'de + a = da'},
    {en:'The name of the street.',pt:'O nome da rua.',rule:'de + a = da'},
    {en:'The taste of the food.',pt:'O sabor da comida.',rule:'de + a = da'},
    // DAQUELE (3 questions)
    {en:'I came from that place.',pt:'Eu vim daquele lugar.',rule:'de + aquele = daquele'},
    {en:'The owner of that store.',pt:'O dono daquela loja.',rule:'de + aquela = daquela'},
    {en:'I\'m tired of that noise.',pt:'Estou cansado daquele barulho.',rule:'de + aquele = daquele'},
    // DAQUELA (3 questions)
    {en:'Far from that city.',pt:'Longe daquela cidade.',rule:'de + aquela = daquela'},
    {en:'I remember that party.',pt:'Eu lembro daquela festa.',rule:'de + aquela = daquela'},
    {en:'The owner of that house.',pt:'O dono daquela casa.',rule:'de + aquela = daquela'},
    // DELE (3 questions)
    {en:'His house is big.',pt:'A casa dele é grande.',rule:'de + ele = dele'},
    {en:'I like his dog.',pt:'Eu gosto do cachorro dele.',rule:'de + ele = dele'},
    {en:'His mother is nice.',pt:'A mãe dele é legal.',rule:'de + ele = dele'},
    // DELA (3 questions)
    {en:'Her father is tall.',pt:'O pai dela é alto.',rule:'de + ela = dela'},
    {en:'I know her brother.',pt:'Eu conheço o irmão dela.',rule:'de + ela = dela'},
    {en:'Her car is red.',pt:'O carro dela é vermelho.',rule:'de + ela = dela'},
    // DESSE (3 questions)
    {en:'I\'m afraid of this dog.',pt:'Tenho medo desse cachorro.',rule:'de + esse = desse'},
    {en:'The price of this car.',pt:'O preço desse carro.',rule:'de + esse = desse'},
    {en:'I\'m tired of this job.',pt:'Estou cansado desse trabalho.',rule:'de + esse = desse'},
    // DESSA (3 questions)
    {en:'The author of this book.',pt:'O autor desse livro.',rule:'de + esse = desse'},
    {en:'I\'m tired of this conversation.',pt:'Estou cansado dessa conversa.',rule:'de + essa = dessa'},
    {en:'The end of this story.',pt:'O fim dessa história.',rule:'de + essa = dessa'},
    // DISSO (3 questions)
    {en:'I\'m sure of this.',pt:'Tenho certeza disso.',rule:'de + isso = disso'},
    {en:'I\'m tired of this.',pt:'Estou cansado disso.',rule:'de + isso = disso'},
    {en:'Don\'t speak of this.',pt:'Não fale disso.',rule:'de + isso = disso'},
  ],
  words: [
    {pt:'de + o',en:'do',sp:'O livro do menino.',se:'The boy\'s book.'},
    {pt:'de + a',en:'da',sp:'A casa da Maria.',se:'Maria\'s house.'},
    {pt:'de + aquele',en:'daquele',sp:'Gosto daquele carro.',se:'I like that car.'},
    {pt:'de + aquela',en:'daquela',sp:'Perto daquela loja.',se:'Near that store.'},
    {pt:'de + ele',en:'dele',sp:'O carro dele é novo.',se:'His car is new.'},
    {pt:'de + ela',en:'dela',sp:'A mãe dela chegou.',se:'Her mother arrived.'},
    {pt:'de + esse',en:'desse',sp:'Preciso desse livro.',se:'I need this book.'},
    {pt:'de + essa',en:'dessa',sp:'Gosto dessa música.',se:'I like this song.'},
    {pt:'de + isso',en:'disso',sp:'Não gosto disso.',se:'I don\'t like this.'},
  ]
};

const PRESET_VERBS_DE = {
  id: 'preset-verbs-de',
  name: '📚 Verbs with DE',
  isPreset: true,
  type: 'verbs-de',
  verbs: [
    {verb:'gostar de',meaning:'to like',ex:'Eu gosto de música.',ee:'I like music.'},
    {verb:'precisar de',meaning:'to need',ex:'Eu preciso de ajuda.',ee:'I need help.'},
    {verb:'lembrar de',meaning:'to remember',ex:'Eu lembro de você.',ee:'I remember you.'},
    {verb:'cuidar de',meaning:'to take care of',ex:'Eu cuido dela.',ee:'I take care of her.'},
    {verb:'antes de',meaning:'before',ex:'Antes de sair.',ee:'Before leaving.'},
    {verb:'depois de',meaning:'after',ex:'Depois de comer.',ee:'After eating.'},
    {verb:'na frente de',meaning:'in front of',ex:'Na frente da casa.',ee:'In front of the house.'},
    {verb:'atrás de',meaning:'behind',ex:'Atrás da porta.',ee:'Behind the door.'},
    {verb:'em cima de',meaning:'on top of',ex:'Em cima da mesa.',ee:'On top of the table.'},
    {verb:'embaixo de',meaning:'under',ex:'Embaixo da mesa.',ee:'Under the table.'},
    {verb:'do lado de',meaning:'beside / next to',ex:'Do lado da janela.',ee:'Next to the window.'},
  ],
  tests: [
    {en:'I like it (that)',pt:'Eu gosto disso',rule:'gostar de + isso = disso'},
    {en:'I like him',pt:'Eu gosto dele',rule:'gostar de + ele = dele'},
    {en:'I like her',pt:'Eu gosto dela',rule:'gostar de + ela = dela'},
    {en:'I like them',pt:'Eu gosto deles',rule:'gostar de + eles = deles'},
    {en:'I like staying here',pt:'Eu gosto de ficar aqui',rule:'gostar de + infinitive'},
    {en:'I like living here',pt:'Eu gosto de morar aqui',rule:'gostar de + infinitive'},
    {en:'She likes me',pt:'Ela gosta de mim',rule:'gostar de + mim'},
    {en:'She needs me',pt:'Ela precisa de mim',rule:'precisar de + mim'},
    {en:'I need this job',pt:'Eu preciso desse emprego',rule:'precisar de + esse = desse'},
    {en:'I need that book',pt:'Eu preciso daquele livro',rule:'precisar de + aquele = daquele'},
    {en:'I remember her',pt:'Eu lembro dela',rule:'lembrar de + ela = dela'},
    {en:'Do you remember this?',pt:'Você lembra disso?',rule:'lembrar de + isso = disso'},
    {en:'She remembers me',pt:'Ela lembra de mim',rule:'lembrar de + mim'},
    {en:'I take care of her',pt:'Eu cuido dela',rule:'cuidar de + ela = dela'},
    {en:'The book is on the table',pt:'O livro está em cima da mesa',rule:'em cima de + a = da'},
    {en:'The shoe is under the table',pt:'O sapato está embaixo da mesa',rule:'embaixo de + a = da'},
    {en:'The boy is behind the door',pt:'O menino está atrás da porta',rule:'atrás de + a = da'},
    {en:'The girl is in front of the house',pt:'A menina está na frente da casa',rule:'na frente de + a = da'},
    {en:'Before leaving home',pt:'Antes de sair de casa',rule:'antes de + infinitive'},
    {en:'After leaving home',pt:'Depois de sair de casa',rule:'depois de + infinitive'},
    {en:'Before eating',pt:'Antes de comer',rule:'antes de + infinitive'},
    {en:'After eating',pt:'Depois de comer',rule:'depois de + infinitive'},
    {en:'Before sleeping',pt:'Antes de dormir',rule:'antes de + infinitive'},
    {en:'After sleeping',pt:'Depois de dormir',rule:'depois de + infinitive'},
  ],
  words: [
    {pt:'gostar de',en:'to like',sp:'Eu gosto de música.',se:'I like music.'},
    {pt:'precisar de',en:'to need',sp:'Eu preciso de ajuda.',se:'I need help.'},
    {pt:'lembrar de',en:'to remember',sp:'Eu lembro de você.',se:'I remember you.'},
    {pt:'cuidar de',en:'to take care of',sp:'Eu cuido dela.',se:'I take care of her.'},
    {pt:'antes de',en:'before',sp:'Antes de sair.',se:'Before leaving.'},
    {pt:'depois de',en:'after',sp:'Depois de comer.',se:'After eating.'},
    {pt:'na frente de',en:'in front of',sp:'Na frente da casa.',se:'In front of the house.'},
    {pt:'atrás de',en:'behind',sp:'Atrás da porta.',se:'Behind the door.'},
    {pt:'em cima de',en:'on top of',sp:'Em cima da mesa.',se:'On top of the table.'},
    {pt:'embaixo de',en:'under',sp:'Embaixo da mesa.',se:'Under the table.'},
    {pt:'do lado de',en:'beside / next to',sp:'Do lado da janela.',se:'Next to the window.'},
  ]
};

const PRESET_NUMBERS = {
  id: 'preset-numbers',
  name: '📚 Numbers (Números)',
  isPreset: true,
  type: 'numbers',
  numbers: [
    {num:1,pt:'um',ptf:'uma',en:'one'},
    {num:2,pt:'dois',ptf:'duas',en:'two'},
    {num:3,pt:'três',en:'three'},
    {num:4,pt:'quatro',en:'four'},
    {num:5,pt:'cinco',en:'five'},
    {num:6,pt:'seis',en:'six'},
    {num:7,pt:'sete',en:'seven'},
    {num:8,pt:'oito',en:'eight'},
    {num:9,pt:'nove',en:'nine'},
    {num:10,pt:'dez',en:'ten'},
    {num:11,pt:'onze',en:'eleven'},
    {num:12,pt:'doze',en:'twelve'},
    {num:13,pt:'treze',en:'thirteen'},
    {num:14,pt:'quatorze',en:'fourteen'},
    {num:15,pt:'quinze',en:'fifteen'},
    {num:16,pt:'dezesseis',en:'sixteen'},
    {num:17,pt:'dezessete',en:'seventeen'},
    {num:18,pt:'dezoito',en:'eighteen'},
    {num:19,pt:'dezenove',en:'nineteen'},
    {num:20,pt:'vinte',en:'twenty'},
    {num:30,pt:'trinta',en:'thirty'},
    {num:40,pt:'quarenta',en:'forty'},
    {num:50,pt:'cinquenta',en:'fifty'},
    {num:60,pt:'sessenta',en:'sixty'},
    {num:70,pt:'setenta',en:'seventy'},
    {num:80,pt:'oitenta',en:'eighty'},
    {num:90,pt:'noventa',en:'ninety'},
    {num:100,pt:'cem',en:'one hundred'},
    {num:101,pt:'cento e um',en:'one hundred and one'},
    {num:200,pt:'duzentos',en:'two hundred'},
  ],
  tests: [
    {en:'1',pt:'um'},{en:'2',pt:'dois'},{en:'3',pt:'três'},{en:'4',pt:'quatro'},{en:'5',pt:'cinco'},
    {en:'6',pt:'seis'},{en:'7',pt:'sete'},{en:'8',pt:'oito'},{en:'9',pt:'nove'},{en:'10',pt:'dez'},
    {en:'11',pt:'onze'},{en:'12',pt:'doze'},{en:'13',pt:'treze'},{en:'14',pt:'quatorze'},{en:'15',pt:'quinze'},
    {en:'16',pt:'dezesseis'},{en:'17',pt:'dezessete'},{en:'18',pt:'dezoito'},{en:'19',pt:'dezenove'},{en:'20',pt:'vinte'},
    {en:'30',pt:'trinta'},{en:'40',pt:'quarenta'},{en:'50',pt:'cinquenta'},{en:'60',pt:'sessenta'},
    {en:'70',pt:'setenta'},{en:'80',pt:'oitenta'},{en:'90',pt:'noventa'},
    {en:'100',pt:'cem'},{en:'101',pt:'cento e um'},{en:'200',pt:'duzentos'},
  ],
  words: [
    {pt:'um',en:'one',sp:'Eu tenho um carro.',se:'I have one car.'},
    {pt:'dois',en:'two',sp:'Tenho dois irmãos.',se:'I have two brothers.'},
    {pt:'três',en:'three',sp:'Três pessoas.',se:'Three people.'},
    {pt:'quatro',en:'four',sp:'Quatro horas.',se:'Four hours.'},
    {pt:'cinco',en:'five',sp:'Cinco dedos.',se:'Five fingers.'},
    {pt:'dez',en:'ten',sp:'Dez reais.',se:'Ten reais.'},
    {pt:'vinte',en:'twenty',sp:'Vinte anos.',se:'Twenty years.'},
    {pt:'cem',en:'one hundred',sp:'Cem pessoas.',se:'One hundred people.'},
  ]
};

const ALL_PRESETS = [PRESET_PREPOSITIONS, PRESET_VERBS_DE, PRESET_NUMBERS];

// ==================== STORAGE HELPERS ====================
async function getData(key, shared = false) {
  try {
    const result = await window.storage.get(key, shared);
    return result ? JSON.parse(result.value) : null;
  } catch { return null; }
}

async function setData(key, value, shared = false) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
    return true;
  } catch { return false; }
}

// ==================== STYLES ====================
const colors = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#6366f1',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  purple: '#a78bfa',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155'
};

const btnStyle = (bg, color = '#fff') => ({
  padding: '14px 24px',
  background: bg,
  color: color,
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s'
});

// ==================== MAIN APP ====================
export default function App() {
  const [appMode, setAppMode] = React.useState('login'); // login, teacher, student
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Check for existing session
  React.useEffect(() => {
    async function checkSession() {
      const session = await getData('current-session');
      if (session) {
        setCurrentUser(session);
        setAppMode(session.role);
      }
      setLoading(false);
    }
    checkSession();
  }, []);

  const handleLogout = async () => {
    await setData('current-session', null);
    setCurrentUser(null);
    setAppMode('login');
  };

  if (loading) {
    return (
      <div style={{minHeight:'100vh',background:colors.bg,display:'flex',alignItems:'center',justifyContent:'center',color:colors.text,fontFamily:'system-ui'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:24,marginBottom:8}}>Loading...</div>
        </div>
      </div>
    );
  }

  if (appMode === 'login') {
    return <LoginScreen setAppMode={setAppMode} setCurrentUser={setCurrentUser} />;
  }

  if (appMode === 'teacher') {
    return <TeacherDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (appMode === 'student') {
    return <StudentGame user={currentUser} onLogout={handleLogout} />;
  }

  return null;
}

// ==================== LOGIN SCREEN ====================
function LoginScreen({ setAppMode, setCurrentUser }) {
  const [mode, setMode] = React.useState('select'); // select, teacher-login, teacher-register, student-login
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleTeacherLogin = async () => {
    if (!username || !password) { setError('Please fill all fields'); return; }
    const teachers = await getData('teachers', true) || {};
    const teacher = Object.values(teachers).find(t => t.username === username && t.password === password);
    if (teacher) {
      const session = { id: teacher.id, username: teacher.username, name: teacher.name, role: 'teacher' };
      await setData('current-session', session);
      setCurrentUser(session);
      setAppMode('teacher');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleTeacherRegister = async () => {
    if (!username || !password) { setError('Please fill all fields'); return; }
    const teachers = await getData('teachers', true) || {};
    if (Object.values(teachers).find(t => t.username === username)) {
      setError('Username already exists');
      return;
    }
    const id = generateId();
    const newTeacher = { id, username, password, name: username, createdAt: Date.now() };
    teachers[id] = newTeacher;
    await setData('teachers', teachers, true);
    const session = { id, username, name: username, role: 'teacher' };
    await setData('current-session', session);
    setCurrentUser(session);
    setAppMode('teacher');
  };

  const handleStudentLogin = async () => {
    if (!username) { setError('Please enter your code'); return; }
    const students = await getData('students', true) || {};
    // Search by code or username (for backwards compatibility)
    const student = Object.values(students).find(s => 
      (s.code && s.code.toUpperCase() === username.toUpperCase()) ||
      s.username.toLowerCase() === username.toLowerCase()
    );
    if (student) {
      const session = { id: student.id, username: student.username, name: student.name, teacherId: student.teacherId, role: 'student' };
      await setData('current-session', session);
      setCurrentUser(session);
      setAppMode('student');
    } else {
      setError('Invalid code. Please check with your teacher.');
    }
  };

  // Select Screen
  if (mode === 'select') {
    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:40,fontFamily:'system-ui',color:colors.text,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{maxWidth:450,width:'100%',textAlign:'center'}}>
          <div style={{marginBottom:40}}>
            <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:20}}>
              <div style={{width:50,height:35,background:'#009c3b',borderRadius:4,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:0,height:0,borderLeft:'25px solid transparent',borderRight:'25px solid transparent',borderTop:'17px solid #ffdf00',borderBottom:'17px solid #ffdf00'}}></div>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:18,height:18,background:'#002776',borderRadius:'50%'}}></div>
              </div>
              <span style={{fontSize:24,color:colors.accent}}>⟷</span>
              <div style={{width:50,height:35,background:'#fff',borderRadius:4,display:'flex',overflow:'hidden'}}>
                <div style={{width:12,background:'#ff0000'}}></div>
                <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#ff0000',fontSize:16}}>🍁</span></div>
                <div style={{width:12,background:'#ff0000'}}></div>
              </div>
            </div>
            <h1 style={{fontSize:32,fontWeight:700,margin:0,background:`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Português ↔ English
            </h1>
            <p style={{color:colors.muted,marginTop:8}}>Vocabulary Learning Platform</p>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <button
              onClick={() => setMode('student-login')}
              style={{...btnStyle(`linear-gradient(135deg, ${colors.green}, #059669)`),padding:20,fontSize:18}}
            >
              🎓 I'm a Student
            </button>
            <button
              onClick={() => setMode('teacher-login')}
              style={{...btnStyle('transparent'),border:`2px solid ${colors.accent}`,color:colors.text,padding:20,fontSize:18}}
            >
              👨‍🏫 I'm a Teacher
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Teacher Login/Register
  if (mode === 'teacher-login' || mode === 'teacher-register') {
    const isRegister = mode === 'teacher-register';
    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:40,fontFamily:'system-ui',color:colors.text,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{maxWidth:400,width:'100%'}}>
          <button onClick={() => { setMode('select'); setError(''); }} style={{background:'none',border:'none',color:colors.muted,cursor:'pointer',marginBottom:20}}>← Back</button>
          
          <div style={{background:colors.card,borderRadius:20,padding:32,border:`1px solid ${colors.border}`}}>
            <h2 style={{margin:'0 0 24px',textAlign:'center'}}>{isRegister ? 'Create Teacher Account' : 'Teacher Login'}</h2>
            
            {error && <div style={{background:'rgba(239,68,68,0.1)',border:`1px solid ${colors.red}`,borderRadius:8,padding:12,marginBottom:16,color:colors.red,fontSize:14}}>{error}</div>}
            
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{width:'100%',padding:14,background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:10,color:colors.text,fontSize:16,marginBottom:12,boxSizing:'border-box'}}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{width:'100%',padding:14,background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:10,color:colors.text,fontSize:16,marginBottom:20,boxSizing:'border-box'}}
            />
            
            <button
              onClick={isRegister ? handleTeacherRegister : handleTeacherLogin}
              style={{...btnStyle(`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`),width:'100%',marginBottom:16}}
            >
              {isRegister ? 'Create Account' : 'Login'}
            </button>
            
            <div style={{textAlign:'center'}}>
              <button
                onClick={() => { setMode(isRegister ? 'teacher-login' : 'teacher-register'); setError(''); }}
                style={{background:'none',border:'none',color:colors.accent,cursor:'pointer',fontSize:14}}
              >
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Login
  if (mode === 'student-login') {
    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:40,fontFamily:'system-ui',color:colors.text,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{maxWidth:400,width:'100%'}}>
          <button onClick={() => { setMode('select'); setError(''); }} style={{background:'none',border:'none',color:colors.muted,cursor:'pointer',marginBottom:20}}>← Back</button>
          
          <div style={{background:colors.card,borderRadius:20,padding:32,border:`1px solid ${colors.border}`}}>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:48,marginBottom:12}}>🎓</div>
              <h2 style={{margin:'0 0 8px'}}>Student Login</h2>
              <p style={{color:colors.muted,margin:0,fontSize:14}}>Enter the code your teacher gave you</p>
            </div>
            
            {error && <div style={{background:'rgba(239,68,68,0.1)',border:`1px solid ${colors.red}`,borderRadius:8,padding:12,marginBottom:16,color:colors.red,fontSize:14,textAlign:'center'}}>{error}</div>}
            
            <input
              type="text"
              placeholder="Enter your code"
              value={username}
              onChange={e => setUsername(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleStudentLogin()}
              maxLength={6}
              style={{width:'100%',padding:18,background:colors.bg,border:`2px solid ${colors.green}40`,borderRadius:12,color:colors.text,fontSize:24,marginBottom:20,boxSizing:'border-box',textAlign:'center',letterSpacing:8,fontFamily:'monospace',fontWeight:600}}
            />
            
            <button
              onClick={handleStudentLogin}
              style={{...btnStyle(`linear-gradient(135deg, ${colors.green}, #059669)`),width:'100%',padding:16,fontSize:17}}
            >
              Start Learning →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ==================== TEACHER DASHBOARD ====================
function TeacherDashboard({ user, onLogout }) {
  const [screen, setScreen] = React.useState('lessons'); // lessons, students, student-detail
  const [lessons, setLessons] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const fileRef = React.useRef(null);
  
  // Custom preset overrides (teacher's edits to built-in lessons)
  const [customPresets, setCustomPresets] = React.useState({});
  
  // Edit modal state
  const [editingPreset, setEditingPreset] = React.useState(null);
  const [editData, setEditData] = React.useState(null);

  // Load data
  React.useEffect(() => {
    async function loadData() {
      const allLessons = await getData('lessons', true) || {};
      const myLessons = Object.values(allLessons).filter(l => l.teacherId === user.id);
      setLessons(myLessons);

      const allStudents = await getData('students', true) || {};
      const myStudents = Object.values(allStudents).filter(s => s.teacherId === user.id);
      setStudents(myStudents);
      
      // Load custom preset overrides
      const savedPresets = await getData(`presets-${user.id}`, true) || {};
      setCustomPresets(savedPresets);

      setLoading(false);
    }
    loadData();
  }, [user.id]);

  // Get preset with custom overrides applied
  function getPresetData(preset) {
    if (customPresets[preset.id]) {
      return { ...preset, ...customPresets[preset.id] };
    }
    return preset;
  }

  // Start editing a preset
  function startEditPreset(preset) {
    const data = getPresetData(preset);
    setEditingPreset(preset);
    setEditData(JSON.parse(JSON.stringify(data))); // Deep copy
  }

  // Save preset edits
  async function savePresetEdits() {
    if (!editingPreset || !editData) return;
    
    const newCustomPresets = { ...customPresets };
    newCustomPresets[editingPreset.id] = {
      rules: editData.rules,
      verbs: editData.verbs,
      numbers: editData.numbers,
      tests: editData.tests,
      words: editData.words
    };
    
    await setData(`presets-${user.id}`, newCustomPresets, true);
    setCustomPresets(newCustomPresets);
    setEditingPreset(null);
    setEditData(null);
  }

  // Reset preset to defaults
  async function resetPreset(presetId) {
    if (!confirm('Reset this lesson to default? All your edits will be lost.')) return;
    const newCustomPresets = { ...customPresets };
    delete newCustomPresets[presetId];
    await setData(`presets-${user.id}`, newCustomPresets, true);
    setCustomPresets(newCustomPresets);
  }

  // Upload lesson from CSV/Excel
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Get lesson name from filename (clean it up)
    const defaultName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/_/g, ' ')       // Replace underscores with spaces
      .replace(/-/g, ' - ')     // Add spaces around dashes
      .trim();
    
    const lessonName = prompt('Enter lesson name:', defaultName);
    if (!lessonName) return;

    Papa.parse(file, {
      header: false,
      complete: async (result) => {
        // Skip header row if it looks like a header
        let dataRows = result.data;
        if (dataRows.length > 0 && dataRows[0][0] && 
            (dataRows[0][0].toLowerCase().includes('portuguese') || 
             dataRows[0][0].toLowerCase().includes('word') ||
             dataRows[0][0].toLowerCase() === 'pt')) {
          dataRows = dataRows.slice(1);
        }

        const words = dataRows
          .filter(row => row.length >= 2 && row[0] && row[1])
          .map(row => ({
            pt: String(row[0]).trim(),
            en: String(row[1]).trim(),
            sp: row[2] ? String(row[2]).trim() : '',
            se: row[3] ? String(row[3]).trim() : ''
          }))
          .filter(w => w.pt && w.en);

        if (words.length === 0) {
          alert('No valid words found. Format: Column A = Portuguese, Column B = English');
          return;
        }

        const lessonId = generateId();
        const newLesson = {
          id: lessonId,
          name: lessonName,
          teacherId: user.id,
          words: words,
          createdAt: Date.now()
        };

        const allLessons = await getData('lessons', true) || {};
        allLessons[lessonId] = newLesson;
        await setData('lessons', allLessons, true);

        setLessons(prev => [...prev, newLesson]);
        // Show the newly created lesson
        setViewingLesson(newLesson);
      }
    });
    e.target.value = '';
  };

  // Delete lesson
  const handleDeleteLesson = async (lessonId, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Delete this lesson?')) return;
    const allLessons = await getData('lessons', true) || {};
    delete allLessons[lessonId];
    await setData('lessons', allLessons, true);
    setLessons(prev => prev.filter(l => l.id !== lessonId));
    if (viewingLesson?.id === lessonId) setViewingLesson(null);
  };

  // Lesson view modal state
  const [viewingLesson, setViewingLesson] = React.useState(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newStudentName, setNewStudentName] = React.useState('');
  const [newStudentCode, setNewStudentCode] = React.useState('');
  const [createdStudent, setCreatedStudent] = React.useState(null);

  // Generate a simple 6-character code
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create student with code
  const handleCreateStudent = async () => {
    if (!newStudentName.trim()) return;
    
    const allStudents = await getData('students', true) || {};
    
    // Generate unique code
    let code = generateCode();
    while (Object.values(allStudents).find(s => s.code === code)) {
      code = generateCode();
    }

    const studentId = generateId();
    const newStudent = {
      id: studentId,
      name: newStudentName.trim(),
      code: code,
      username: code, // Use code as username for login
      teacherId: user.id,
      assignedLessons: [],
      progress: {},
      createdAt: Date.now()
    };

    allStudents[studentId] = newStudent;
    await setData('students', allStudents, true);
    setStudents(prev => [...prev, newStudent]);
    
    setCreatedStudent(newStudent);
    setNewStudentCode(code);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewStudentName('');
    setNewStudentCode('');
    setCreatedStudent(null);
  };

  // Delete student
  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Delete this student?')) return;
    const allStudents = await getData('students', true) || {};
    delete allStudents[studentId];
    await setData('students', allStudents, true);
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  // Toggle lesson assignment
  const handleToggleLesson = async (studentId, lessonId) => {
    const allStudents = await getData('students', true) || {};
    const student = allStudents[studentId];
    if (!student) return;

    if (student.assignedLessons.includes(lessonId)) {
      student.assignedLessons = student.assignedLessons.filter(id => id !== lessonId);
    } else {
      student.assignedLessons.push(lessonId);
    }

    allStudents[studentId] = student;
    await setData('students', allStudents, true);
    setStudents(prev => prev.map(s => s.id === studentId ? student : s));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(student);
    }
  };

  if (loading) {
    return <div style={{minHeight:'100vh',background:colors.bg,display:'flex',alignItems:'center',justifyContent:'center',color:colors.text}}>Loading...</div>;
  }

  // Student Detail View
  if (screen === 'student-detail' && selectedStudent) {
    const studentProgress = selectedStudent.progress || {};
    return (
      <div style={{minHeight:'100vh',background:colors.bg,fontFamily:'system-ui',color:colors.text}}>
        <div style={{background:colors.card,padding:'16px 24px',borderBottom:`1px solid ${colors.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button onClick={() => { setScreen('students'); setSelectedStudent(null); }} style={{background:'none',border:'none',color:colors.muted,cursor:'pointer',fontSize:16}}>← Back to Students</button>
          <span style={{color:colors.muted}}>Teacher: {user.name}</span>
        </div>

        <div style={{maxWidth:800,margin:'0 auto',padding:24}}>
          <div style={{background:colors.card,borderRadius:16,padding:24,marginBottom:24,border:`1px solid ${colors.border}`}}>
            <h2 style={{margin:'0 0 8px'}}>{selectedStudent.name}</h2>
            <p style={{color:colors.muted,margin:0}}>Username: {selectedStudent.username}</p>
          </div>

          {/* Progress Stats */}
          <div style={{background:colors.card,borderRadius:16,padding:24,marginBottom:24,border:`1px solid ${colors.border}`}}>
            <h3 style={{margin:'0 0 16px',color:colors.green}}>📊 Progress</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
              <div style={{background:colors.bg,borderRadius:12,padding:16,textAlign:'center'}}>
                <div style={{fontSize:32,color:colors.green,fontWeight:600}}>{studentProgress.totalCorrect || 0}</div>
                <div style={{color:colors.muted,fontSize:13}}>Correct Answers</div>
              </div>
              <div style={{background:colors.bg,borderRadius:12,padding:16,textAlign:'center'}}>
                <div style={{fontSize:32,color:colors.yellow,fontWeight:600}}>{studentProgress.totalClose || 0}</div>
                <div style={{color:colors.muted,fontSize:13}}>Close Answers</div>
              </div>
              <div style={{background:colors.bg,borderRadius:12,padding:16,textAlign:'center'}}>
                <div style={{fontSize:32,color:colors.red,fontWeight:600}}>{studentProgress.totalWrong || 0}</div>
                <div style={{color:colors.muted,fontSize:13}}>Wrong Answers</div>
              </div>
            </div>
            <div style={{marginTop:16,padding:12,background:colors.bg,borderRadius:8}}>
              <span style={{color:colors.muted}}>Last active: </span>
              <span>{studentProgress.lastActive ? new Date(studentProgress.lastActive).toLocaleString() : 'Never'}</span>
            </div>
          </div>

          {/* Assign Lessons */}
          <div style={{background:colors.card,borderRadius:16,padding:24,border:`1px solid ${colors.border}`}}>
            <h3 style={{margin:'0 0 16px',color:colors.accent}}>📚 Assigned Lessons</h3>
            
            {/* Preset Lessons */}
            <div style={{marginBottom:16}}>
              <div style={{color:colors.muted,fontSize:12,marginBottom:8}}>GRAMMAR LESSONS (Built-in)</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {ALL_PRESETS.map(preset => {
                  const accentColor = preset.type === 'prepositions' ? colors.yellow : preset.type === 'verbs-de' ? colors.purple : colors.green;
                  return (
                    <label key={preset.id} style={{display:'flex',alignItems:'center',gap:12,padding:12,background:colors.bg,borderRadius:8,cursor:'pointer',border:`1px solid ${accentColor}30`}}>
                      <input
                        type="checkbox"
                        checked={selectedStudent.assignedLessons.includes(preset.id)}
                        onChange={() => handleToggleLesson(selectedStudent.id, preset.id)}
                        style={{width:20,height:20,accentColor:accentColor}}
                      />
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500,color:accentColor}}>{preset.name}</div>
                        <div style={{color:colors.muted,fontSize:13}}>{preset.tests.length} test questions • Study + Test</div>
                      </div>
                      {selectedStudent.assignedLessons.includes(preset.id) && (
                        <span style={{background:`${accentColor}20`,color:accentColor,padding:'4px 10px',borderRadius:6,fontSize:12}}>Assigned</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Lessons */}
            {lessons.length > 0 && (
              <div>
                <div style={{color:colors.muted,fontSize:12,marginBottom:8}}>YOUR CUSTOM LESSONS</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {lessons.map(lesson => (
                    <label key={lesson.id} style={{display:'flex',alignItems:'center',gap:12,padding:12,background:colors.bg,borderRadius:8,cursor:'pointer'}}>
                      <input
                        type="checkbox"
                        checked={selectedStudent.assignedLessons.includes(lesson.id)}
                        onChange={() => handleToggleLesson(selectedStudent.id, lesson.id)}
                        style={{width:20,height:20,accentColor:colors.green}}
                      />
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500}}>{lesson.name}</div>
                        <div style={{color:colors.muted,fontSize:13}}>{lesson.words.length} words</div>
                      </div>
                      {selectedStudent.assignedLessons.includes(lesson.id) && (
                        <span style={{background:'rgba(34,197,94,0.2)',color:colors.green,padding:'4px 10px',borderRadius:6,fontSize:12}}>Assigned</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {lessons.length === 0 && (
              <p style={{color:colors.muted,margin:'16px 0 0',fontSize:14}}>Upload custom lessons in the Lessons tab to add more content.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:colors.bg,fontFamily:'system-ui',color:colors.text}}>
      {/* Header */}
      <div style={{background:colors.card,padding:'16px 24px',borderBottom:`1px solid ${colors.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <h1 style={{margin:0,fontSize:20,fontWeight:600}}>👨‍🏫 Teacher Dashboard</h1>
          <div style={{display:'flex',gap:8}}>
            <button
              onClick={() => setScreen('lessons')}
              style={{padding:'8px 16px',background:screen==='lessons'?colors.accent:'transparent',color:screen==='lessons'?'#fff':colors.muted,border:'none',borderRadius:8,cursor:'pointer',fontWeight:500}}
            >
              Lessons
            </button>
            <button
              onClick={() => setScreen('students')}
              style={{padding:'8px 16px',background:screen==='students'?colors.accent:'transparent',color:screen==='students'?'#fff':colors.muted,border:'none',borderRadius:8,cursor:'pointer',fontWeight:500}}
            >
              Students
            </button>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{color:colors.muted}}>{user.name}</span>
          <button onClick={onLogout} style={{padding:'8px 16px',background:'rgba(239,68,68,0.1)',color:colors.red,border:`1px solid rgba(239,68,68,0.3)`,borderRadius:8,cursor:'pointer'}}>Logout</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:24}}>
        {/* Lessons Tab */}
        {screen === 'lessons' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <h2 style={{margin:0}}>📚 All Lessons</h2>
              <div>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} style={{display:'none'}} />
                <button onClick={() => fileRef.current?.click()} style={btnStyle(`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`)}>
                  + Upload Lesson
                </button>
              </div>
            </div>

            {/* Built-in Grammar Lessons */}
            <div style={{marginBottom:32}}>
              <div style={{color:colors.muted,fontSize:12,marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>📖 Built-in Grammar Lessons</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:16}}>
                {ALL_PRESETS.map(preset => {
                  const presetData = getPresetData(preset);
                  const isCustomized = !!customPresets[preset.id];
                  const accentColor = preset.type === 'prepositions' ? colors.yellow : preset.type === 'verbs-de' ? colors.purple : colors.green;
                  const iconEmoji = preset.type === 'prepositions' ? '🔗' : preset.type === 'verbs-de' ? '📝' : '🔢';
                  const itemCount = presetData.rules?.length || presetData.verbs?.length || presetData.numbers?.length;
                  return (
                    <div 
                      key={preset.id} 
                      style={{background:colors.card,borderRadius:16,padding:20,border:`1px solid ${accentColor}40`,textAlign:'center',position:'relative'}}
                    >
                      {isCustomized && (
                        <div style={{position:'absolute',top:8,right:8,background:colors.accent,color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:10}}>Edited</div>
                      )}
                      <div 
                        onClick={() => setViewingLesson({...presetData, isPreset: true, createdAt: Date.now()})}
                        style={{cursor:'pointer'}}
                      >
                        <div style={{width:64,height:64,margin:'0 auto 12px',background:`linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 12px ${accentColor}40`}}>
                          <span style={{fontSize:28}}>{iconEmoji}</span>
                        </div>
                        <div style={{fontWeight:600,fontSize:15,marginBottom:6,color:accentColor}}>{preset.name.replace('📚 ', '')}</div>
                        <div style={{color:colors.muted,fontSize:13}}>{itemCount} items • {presetData.tests?.length || 0} test questions</div>
                      </div>
                      <div style={{display:'flex',gap:6,marginTop:12,justifyContent:'center'}}>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditPreset(preset); }}
                          style={{padding:'6px 12px',background:`${accentColor}20`,color:accentColor,border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:500}}
                        >
                          ✏️ Edit
                        </button>
                        {isCustomized && (
                          <button
                            onClick={(e) => { e.stopPropagation(); resetPreset(preset.id); }}
                            style={{padding:'6px 12px',background:'rgba(239,68,68,0.1)',color:colors.red,border:'none',borderRadius:6,cursor:'pointer',fontSize:12}}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Uploaded Lessons */}
            <div>
              <div style={{color:colors.muted,fontSize:12,marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>📤 Your Uploaded Lessons</div>
              
              <div style={{background:'rgba(99,102,241,0.1)',border:`1px solid rgba(99,102,241,0.2)`,borderRadius:12,padding:16,marginBottom:16}}>
                <div style={{color:colors.accent,fontWeight:600,marginBottom:4}}>📄 Upload Excel or CSV</div>
                <div style={{color:colors.muted,fontSize:13}}>
                  Column A: Portuguese | Column B: English | Column C: PT sentence | Column D: EN sentence
                </div>
              </div>

              {lessons.length === 0 ? (
                <div style={{background:colors.card,borderRadius:16,padding:32,textAlign:'center',border:`1px solid ${colors.border}`}}>
                  <div style={{fontSize:36,marginBottom:12}}>📤</div>
                  <p style={{color:colors.muted,margin:0}}>No custom lessons yet. Click "+ Upload Lesson" to add your own!</p>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:16}}>
                  {lessons.map(lesson => (
                    <div 
                      key={lesson.id} 
                      onClick={() => setViewingLesson(lesson)}
                      style={{background:colors.card,borderRadius:16,padding:20,border:`1px solid ${colors.border}`,cursor:'pointer',transition:'all 0.2s',textAlign:'center'}}
                      onMouseOver={e => {e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = 'translateY(-2px)';}}
                      onMouseOut={e => {e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)';}}
                    >
                      {/* Excel Icon */}
                      <div style={{width:64,height:64,margin:'0 auto 12px',background:'linear-gradient(135deg, #217346, #185c37)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(33,115,70,0.3)'}}>
                        <span style={{color:'#fff',fontSize:24,fontWeight:700}}>xlsx</span>
                      </div>
                      <div style={{fontWeight:600,fontSize:15,marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lesson.name}</div>
                      <div style={{color:colors.muted,fontSize:13}}>{lesson.words.length} words</div>
                      <button
                        onClick={(e) => handleDeleteLesson(lesson.id, e)}
                        style={{marginTop:12,padding:'6px 12px',background:'rgba(239,68,68,0.1)',color:colors.red,border:'none',borderRadius:6,cursor:'pointer',fontSize:12}}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lesson View Modal */}
            {viewingLesson && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
                <div style={{background:colors.card,borderRadius:20,width:'100%',maxWidth:800,maxHeight:'90vh',display:'flex',flexDirection:'column',border:`1px solid ${colors.border}`}}>
                  {/* Header */}
                  <div style={{padding:24,borderBottom:`1px solid ${colors.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:16}}>
                      {viewingLesson.isPreset ? (
                        <div style={{width:48,height:48,background:`linear-gradient(135deg, ${viewingLesson.type === 'prepositions' ? colors.yellow : viewingLesson.type === 'verbs-de' ? colors.purple : colors.green}, ${viewingLesson.type === 'prepositions' ? colors.yellow : viewingLesson.type === 'verbs-de' ? colors.purple : colors.green}99)`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span style={{fontSize:24}}>{viewingLesson.type === 'prepositions' ? '🔗' : viewingLesson.type === 'verbs-de' ? '📝' : '🔢'}</span>
                        </div>
                      ) : (
                        <div style={{width:48,height:48,background:'linear-gradient(135deg, #217346, #185c37)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span style={{color:'#fff',fontSize:16,fontWeight:700}}>xlsx</span>
                        </div>
                      )}
                      <div>
                        <h2 style={{margin:0,fontSize:20}}>{viewingLesson.name}</h2>
                        <div style={{color:colors.muted,fontSize:14}}>
                          {viewingLesson.isPreset 
                            ? `${viewingLesson.words?.length || viewingLesson.rules?.length || viewingLesson.numbers?.length} items • ${viewingLesson.tests?.length} test questions • Built-in`
                            : `${viewingLesson.words.length} words • Created ${new Date(viewingLesson.createdAt).toLocaleDateString()}`
                          }
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setViewingLesson(null)} style={{width:40,height:40,background:colors.bg,border:'none',borderRadius:10,color:colors.text,fontSize:20,cursor:'pointer'}}>×</button>
                  </div>
                  
                  {/* Content */}
                  <div style={{flex:1,overflow:'auto',padding:24}}>
                    {/* For presets with rules (prepositions) */}
                    {viewingLesson.isPreset && viewingLesson.rules && (
                      <div style={{display:'grid',gap:12}}>
                        {viewingLesson.rules.map((rule, i) => (
                          <div key={i} style={{background:colors.bg,borderRadius:12,padding:16,border:`1px solid ${colors.border}`}}>
                            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                              <span style={{color:colors.muted,fontSize:14}}>{rule.p}</span>
                              <span style={{color:colors.yellow,fontSize:18}}>=</span>
                              <span style={{color:colors.yellow,fontSize:18,fontWeight:700}}>{rule.e.toUpperCase()}</span>
                            </div>
                            <div style={{fontSize:14}}>
                              <div style={{color:colors.text}}>🇧🇷 {rule.ex}</div>
                              <div style={{color:colors.muted,marginTop:4}}>🇨🇦 {rule.ee}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* For presets with verbs */}
                    {viewingLesson.isPreset && viewingLesson.verbs && (
                      <div style={{display:'grid',gap:12}}>
                        {viewingLesson.verbs.map((verb, i) => (
                          <div key={i} style={{background:colors.bg,borderRadius:12,padding:16,border:`1px solid ${colors.border}`}}>
                            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                              <span style={{color:colors.purple,fontSize:16,fontWeight:700}}>{verb.verb.toUpperCase()}</span>
                              <span style={{color:colors.muted,fontSize:14}}>({verb.meaning})</span>
                            </div>
                            <div style={{fontSize:14}}>
                              <div style={{color:colors.text}}>🇧🇷 {verb.ex}</div>
                              <div style={{color:colors.muted,marginTop:4}}>🇨🇦 {verb.ee}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* For presets with numbers */}
                    {viewingLesson.isPreset && viewingLesson.numbers && (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))',gap:12}}>
                        {viewingLesson.numbers.map((num, i) => (
                          <div key={i} style={{background:colors.bg,borderRadius:12,padding:16,textAlign:'center',border:`1px solid ${colors.border}`}}>
                            <div style={{fontSize:28,color:colors.green,fontWeight:600}}>{num.num}</div>
                            <div style={{fontSize:15,color:colors.text,marginTop:4}}>{num.pt}</div>
                            {num.ptf && <div style={{fontSize:12,color:colors.muted}}>({num.ptf})</div>}
                            <div style={{fontSize:12,color:colors.muted,marginTop:4}}>{num.en}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* For custom lessons (words table) */}
                    {!viewingLesson.isPreset && viewingLesson.words && (
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead>
                          <tr style={{borderBottom:`1px solid ${colors.border}`}}>
                            <th style={{textAlign:'left',padding:'12px 8px',color:colors.muted,fontSize:12,fontWeight:600}}>#</th>
                            <th style={{textAlign:'left',padding:'12px 8px',color:colors.muted,fontSize:12,fontWeight:600}}>🇧🇷 PORTUGUÊS</th>
                            <th style={{textAlign:'left',padding:'12px 8px',color:colors.muted,fontSize:12,fontWeight:600}}>🇨🇦 ENGLISH</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingLesson.words.map((word, i) => (
                            <tr key={i} style={{borderBottom:`1px solid ${colors.border}20`}}>
                              <td style={{padding:'12px 8px',color:colors.muted,fontSize:13}}>{i + 1}</td>
                              <td style={{padding:'12px 8px'}}>
                                <div style={{fontWeight:500,color:colors.yellow}}>{word.pt}</div>
                                {word.sp && <div style={{fontSize:13,color:colors.muted,marginTop:4}}>{word.sp}</div>}
                              </td>
                              <td style={{padding:'12px 8px'}}>
                                <div style={{fontWeight:500,color:colors.accent}}>{word.en}</div>
                                {word.se && <div style={{fontSize:13,color:colors.muted,marginTop:4}}>{word.se}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div style={{padding:16,borderTop:`1px solid ${colors.border}`,display:'flex',justifyContent:'flex-end',gap:12}}>
                    {!viewingLesson.isPreset && (
                      <button 
                        onClick={(e) => { handleDeleteLesson(viewingLesson.id, e); }}
                        style={{padding:'10px 20px',background:'rgba(239,68,68,0.1)',color:colors.red,border:'none',borderRadius:8,cursor:'pointer'}}
                      >
                        Delete Lesson
                      </button>
                    )}
                    <button 
                      onClick={() => setViewingLesson(null)}
                      style={{padding:'10px 20px',background:colors.accent,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Preset Modal */}
            {editingPreset && editData && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
                <div style={{background:colors.card,borderRadius:20,width:'100%',maxWidth:900,maxHeight:'90vh',display:'flex',flexDirection:'column',border:`1px solid ${colors.border}`}}>
                  {/* Header */}
                  <div style={{padding:24,borderBottom:`1px solid ${colors.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <h2 style={{margin:0,fontSize:20}}>✏️ Edit: {editingPreset.name}</h2>
                      <div style={{color:colors.muted,fontSize:14,marginTop:4}}>Add, edit, or remove items</div>
                    </div>
                    <button onClick={() => { setEditingPreset(null); setEditData(null); }} style={{width:40,height:40,background:colors.bg,border:'none',borderRadius:10,color:colors.text,fontSize:20,cursor:'pointer'}}>×</button>
                  </div>
                  
                  {/* Edit Content */}
                  <div style={{flex:1,overflow:'auto',padding:24}}>
                    {/* Prepositions Editor */}
                    {editingPreset.type === 'prepositions' && editData.rules && (
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                          <div style={{color:colors.yellow,fontWeight:600}}>Preposition Rules</div>
                          <button
                            onClick={() => setEditData({...editData, rules: [...editData.rules, {p:'de + ',e:'',ex:'',ee:''}]})}
                            style={{padding:'8px 16px',background:`${colors.yellow}20`,color:colors.yellow,border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}
                          >
                            + Add Rule
                          </button>
                        </div>
                        {editData.rules.map((rule, i) => (
                          <div key={i} style={{background:colors.bg,borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${colors.border}`}}>
                            <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                              <span style={{color:colors.muted,fontSize:13,minWidth:20}}>{i+1}.</span>
                              <input
                                value={rule.p}
                                onChange={e => {
                                  const newRules = [...editData.rules];
                                  newRules[i] = {...rule, p: e.target.value};
                                  setEditData({...editData, rules: newRules});
                                }}
                                placeholder="de + o"
                                style={{flex:1,padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.text,fontSize:14}}
                              />
                              <span style={{color:colors.yellow,fontSize:18}}>=</span>
                              <input
                                value={rule.e}
                                onChange={e => {
                                  const newRules = [...editData.rules];
                                  newRules[i] = {...rule, e: e.target.value};
                                  setEditData({...editData, rules: newRules});
                                }}
                                placeholder="do"
                                style={{width:100,padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.yellow,fontSize:14,fontWeight:600}}
                              />
                              <button
                                onClick={() => setEditData({...editData, rules: editData.rules.filter((_, idx) => idx !== i)})}
                                style={{padding:'8px 12px',background:'rgba(239,68,68,0.1)',color:colors.red,border:'none',borderRadius:6,cursor:'pointer'}}
                              >
                                🗑️
                              </button>
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                              <input
                                value={rule.ex}
                                onChange={e => {
                                  const newRules = [...editData.rules];
                                  newRules[i] = {...rule, ex: e.target.value};
                                  setEditData({...editData, rules: newRules});
                                }}
                                placeholder="🇧🇷 Portuguese sentence"
                                style={{padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.text,fontSize:13}}
                              />
                              <input
                                value={rule.ee}
                                onChange={e => {
                                  const newRules = [...editData.rules];
                                  newRules[i] = {...rule, ee: e.target.value};
                                  setEditData({...editData, rules: newRules});
                                }}
                                placeholder="🇨🇦 English sentence"
                                style={{padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.text,fontSize:13}}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Verbs Editor */}
                    {editingPreset.type === 'verbs-de' && editData.verbs && (
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                          <div style={{color:colors.purple,fontWeight:600}}>Verbs with DE</div>
                          <button
                            onClick={() => setEditData({...editData, verbs: [...editData.verbs, {verb:'',meaning:'',ex:'',ee:''}]})}
                            style={{padding:'8px 16px',background:`${colors.purple}20`,color:colors.purple,border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}
                          >
                            + Add Verb
                          </button>
                        </div>
                        {editData.verbs.map((verb, i) => (
                          <div key={i} style={{background:colors.bg,borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${colors.border}`}}>
                            <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                              <span style={{color:colors.muted,fontSize:13,minWidth:20}}>{i+1}.</span>
                              <input
                                value={verb.verb}
                                onChange={e => {
                                  const newVerbs = [...editData.verbs];
                                  newVerbs[i] = {...verb, verb: e.target.value};
                                  setEditData({...editData, verbs: newVerbs});
                                }}
                                placeholder="gostar de"
                                style={{flex:1,padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.purple,fontSize:14,fontWeight:600}}
                              />
                              <input
                                value={verb.meaning}
                                onChange={e => {
                                  const newVerbs = [...editData.verbs];
                                  newVerbs[i] = {...verb, meaning: e.target.value};
                                  setEditData({...editData, verbs: newVerbs});
                                }}
                                placeholder="to like"
                                style={{width:150,padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.muted,fontSize:14}}
                              />
                              <button
                                onClick={() => setEditData({...editData, verbs: editData.verbs.filter((_, idx) => idx !== i)})}
                                style={{padding:'8px 12px',background:'rgba(239,68,68,0.1)',color:colors.red,border:'none',borderRadius:6,cursor:'pointer'}}
                              >
                                🗑️
                              </button>
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                              <input
                                value={verb.ex}
                                onChange={e => {
                                  const newVerbs = [...editData.verbs];
                                  newVerbs[i] = {...verb, ex: e.target.value};
                                  setEditData({...editData, verbs: newVerbs});
                                }}
                                placeholder="🇧🇷 Portuguese sentence"
                                style={{padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.text,fontSize:13}}
                              />
                              <input
                                value={verb.ee}
                                onChange={e => {
                                  const newVerbs = [...editData.verbs];
                                  newVerbs[i] = {...verb, ee: e.target.value};
                                  setEditData({...editData, verbs: newVerbs});
                                }}
                                placeholder="🇨🇦 English sentence"
                                style={{padding:10,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.text,fontSize:13}}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Numbers Editor */}
                    {editingPreset.type === 'numbers' && editData.numbers && (
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                          <div style={{color:colors.green,fontWeight:600}}>Numbers</div>
                          <button
                            onClick={() => setEditData({...editData, numbers: [...editData.numbers, {num:'',pt:'',ptf:'',en:''}]})}
                            style={{padding:'8px 16px',background:`${colors.green}20`,color:colors.green,border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}
                          >
                            + Add Number
                          </button>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:12}}>
                          {editData.numbers.map((num, i) => (
                            <div key={i} style={{background:colors.bg,borderRadius:12,padding:16,border:`1px solid ${colors.border}`}}>
                              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                                <input
                                  value={num.num}
                                  onChange={e => {
                                    const newNums = [...editData.numbers];
                                    newNums[i] = {...num, num: e.target.value};
                                    setEditData({...editData, numbers: newNums});
                                  }}
                                  placeholder="1"
                                  style={{width:60,padding:8,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.green,fontSize:18,fontWeight:600,textAlign:'center'}}
                                />
                                <input
                                  value={num.en}
                                  onChange={e => {
                                    const newNums = [...editData.numbers];
                                    newNums[i] = {...num, en: e.target.value};
                                    setEditData({...editData, numbers: newNums});
                                  }}
                                  placeholder="one"
                                  style={{flex:1,padding:8,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.accent,fontSize:14}}
                                />
                                <button
                                  onClick={() => setEditData({...editData, numbers: editData.numbers.filter((_, idx) => idx !== i)})}
                                  style={{padding:'6px 10px',background:'rgba(239,68,68,0.1)',color:colors.red,border:'none',borderRadius:6,cursor:'pointer',fontSize:12}}
                                >
                                  🗑️
                                </button>
                              </div>
                              <div style={{display:'flex',gap:8}}>
                                <input
                                  value={num.pt}
                                  onChange={e => {
                                    const newNums = [...editData.numbers];
                                    newNums[i] = {...num, pt: e.target.value};
                                    setEditData({...editData, numbers: newNums});
                                  }}
                                  placeholder="🇧🇷 um"
                                  style={{flex:1,padding:8,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.text,fontSize:13}}
                                />
                                <input
                                  value={num.ptf || ''}
                                  onChange={e => {
                                    const newNums = [...editData.numbers];
                                    newNums[i] = {...num, ptf: e.target.value};
                                    setEditData({...editData, numbers: newNums});
                                  }}
                                  placeholder="fem: uma"
                                  style={{flex:1,padding:8,background:colors.card,border:`1px solid ${colors.border}`,borderRadius:6,color:colors.muted,fontSize:13}}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div style={{padding:16,borderTop:`1px solid ${colors.border}`,display:'flex',justifyContent:'space-between'}}>
                    <button 
                      onClick={() => { setEditingPreset(null); setEditData(null); }}
                      style={{padding:'10px 20px',background:'transparent',color:colors.muted,border:`1px solid ${colors.border}`,borderRadius:8,cursor:'pointer'}}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={savePresetEdits}
                      style={{padding:'10px 24px',background:`linear-gradient(135deg, ${colors.green}, #059669)`,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}
                    >
                      💾 Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Students Tab */}
        {screen === 'students' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <h2 style={{margin:0}}>🎓 My Students</h2>
              <button onClick={() => setShowCreateModal(true)} style={btnStyle(`linear-gradient(135deg, ${colors.green}, #059669)`)}>
                + Add Student
              </button>
            </div>

            {students.length === 0 ? (
              <div style={{background:colors.card,borderRadius:16,padding:40,textAlign:'center',border:`1px solid ${colors.border}`}}>
                <div style={{fontSize:48,marginBottom:16}}>🎓</div>
                <p style={{color:colors.muted}}>No students yet. Add your first student!</p>
              </div>
            ) : (
              <div style={{display:'grid',gap:12}}>
                {students.map(student => (
                  <div key={student.id} style={{background:colors.card,borderRadius:12,padding:20,border:`1px solid ${colors.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:18}}>{student.name}</div>
                      <div style={{color:colors.muted,fontSize:14,marginTop:4}}>
                        Code: <span style={{color:colors.green,fontWeight:600,fontFamily:'monospace',letterSpacing:2}}>{student.code || student.username}</span> • {student.assignedLessons.length} lessons assigned
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button
                        onClick={() => { setSelectedStudent(student); setScreen('student-detail'); }}
                        style={{padding:'8px 16px',background:colors.accent,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}
                      >
                        View / Manage
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        style={{padding:'8px 16px',background:'rgba(239,68,68,0.1)',color:colors.red,border:'none',borderRadius:8,cursor:'pointer'}}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create Student Modal */}
            {showCreateModal && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
                <div style={{background:colors.card,borderRadius:20,padding:32,maxWidth:420,width:'90%',border:`1px solid ${colors.border}`}}>
                  {!createdStudent ? (
                    <>
                      <h2 style={{margin:'0 0 8px',textAlign:'center'}}>🎓 Add New Student</h2>
                      <p style={{color:colors.muted,textAlign:'center',marginBottom:24,fontSize:14}}>Enter the student's name to generate their login code</p>
                      
                      <input
                        type="text"
                        placeholder="Student's name"
                        value={newStudentName}
                        onChange={e => setNewStudentName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && newStudentName.trim() && handleCreateStudent()}
                        autoFocus
                        style={{width:'100%',padding:14,background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:10,color:colors.text,fontSize:16,marginBottom:16,boxSizing:'border-box'}}
                      />
                      
                      <div style={{display:'flex',gap:12}}>
                        <button
                          onClick={closeModal}
                          style={{flex:1,padding:14,background:'transparent',color:colors.muted,border:`1px solid ${colors.border}`,borderRadius:10,cursor:'pointer',fontSize:15}}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateStudent}
                          disabled={!newStudentName.trim()}
                          style={{flex:1,padding:14,background:newStudentName.trim() ? `linear-gradient(135deg, ${colors.green}, #059669)` : colors.border,color:'#fff',border:'none',borderRadius:10,cursor:newStudentName.trim() ? 'pointer' : 'not-allowed',fontSize:15,fontWeight:600}}
                        >
                          Generate Code
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{textAlign:'center',marginBottom:24}}>
                        <div style={{fontSize:48,marginBottom:12}}>✅</div>
                        <h2 style={{margin:'0 0 8px'}}>Student Created!</h2>
                        <p style={{color:colors.muted,margin:0}}>{createdStudent.name} can now join</p>
                      </div>
                      
                      <div style={{background:colors.bg,borderRadius:16,padding:24,textAlign:'center',marginBottom:24,border:`2px dashed ${colors.green}`}}>
                        <div style={{color:colors.muted,fontSize:12,marginBottom:8}}>LOGIN CODE</div>
                        <div style={{fontSize:42,fontWeight:700,color:colors.green,letterSpacing:8,fontFamily:'monospace'}}>{newStudentCode}</div>
                      </div>
                      
                      <div style={{background:'rgba(99,102,241,0.1)',borderRadius:12,padding:16,marginBottom:24}}>
                        <div style={{color:colors.accent,fontWeight:600,marginBottom:8,fontSize:14}}>📋 Instructions for student:</div>
                        <ol style={{color:colors.muted,fontSize:14,margin:0,paddingLeft:20,lineHeight:1.8}}>
                          <li>Open the app</li>
                          <li>Click "I'm a Student"</li>
                          <li>Enter code: <strong style={{color:colors.green}}>{newStudentCode}</strong></li>
                          <li>Start learning! 🎉</li>
                        </ol>
                      </div>
                      
                      <button
                        onClick={closeModal}
                        style={{width:'100%',padding:14,background:`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontSize:15,fontWeight:600}}
                      >
                        Done
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==================== STUDENT GAME ====================
function StudentGame({ user, onLogout }) {
  const [screen, setScreen] = React.useState('menu');
  const [mode, setMode] = React.useState('pt-en');
  const [words, setWords] = React.useState([]);
  const [allWords, setAllWords] = React.useState([]);
  const [lessons, setLessons] = React.useState([]);
  const [presetLessons, setPresetLessons] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [input, setInput] = React.useState('');
  const [feedback, setFeedback] = React.useState(null);
  const [needsRetype, setNeedsRetype] = React.useState(false);
  const [answer, setAnswer] = React.useState('');
  const [hintSpell, setHintSpell] = React.useState(false);
  const [hintSent, setHintSent] = React.useState(false);
  const [score, setScore] = React.useState({ok:0, close:0, wrong:0});
  const [loading, setLoading] = React.useState(true);
  
  // Preset test state
  const [currentPreset, setCurrentPreset] = React.useState(null);
  const [testQuestions, setTestQuestions] = React.useState([]);
  const [testIdx, setTestIdx] = React.useState(0);
  const [testInput, setTestInput] = React.useState('');
  const [testFeedback, setTestFeedback] = React.useState(null);
  const [testScore, setTestScore] = React.useState({ok:0, wrong:0});
  const [testMustRetype, setTestMustRetype] = React.useState(false);
  const [testAnswer, setTestAnswer] = React.useState('');

  const inputRef = React.useRef(null);
  const testInputRef = React.useRef(null);

  // Load assigned lessons
  React.useEffect(() => {
    async function loadLessons() {
      const allStudents = await getData('students', true) || {};
      const student = allStudents[user.id];
      if (!student) { setLoading(false); return; }

      const allLessonsData = await getData('lessons', true) || {};
      const assignedLessonIds = student.assignedLessons || [];
      
      // Load teacher's custom preset overrides
      const teacherPresets = await getData(`presets-${student.teacherId}`, true) || {};
      
      // Separate preset and regular lessons
      const myPresets = [];
      const myRegularLessons = [];
      
      assignedLessonIds.forEach(id => {
        // Check if it's a preset
        const preset = ALL_PRESETS.find(p => p.id === id);
        if (preset) {
          // Apply teacher's customizations if they exist
          if (teacherPresets[preset.id]) {
            myPresets.push({ ...preset, ...teacherPresets[preset.id] });
          } else {
            myPresets.push(preset);
          }
        } else if (allLessonsData[id]) {
          myRegularLessons.push(allLessonsData[id]);
        }
      });
      
      setPresetLessons(myPresets);
      setLessons(myRegularLessons);
      
      // Combine all words for practice mode
      const regularWords = myRegularLessons.flatMap(l => l.words.map(w => ({ ...w, lessonName: l.name })));
      const presetWords = myPresets.flatMap(p => (p.words || []).map(w => ({ ...w, lessonName: p.name })));
      setAllWords([...regularWords, ...presetWords]);
      
      setLoading(false);
    }
    loadLessons();
  }, [user.id]);

  // Focus input
  React.useEffect(() => {
    if (screen === 'play' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (screen === 'preset-test' && testInputRef.current) {
      setTimeout(() => testInputRef.current?.focus(), 50);
    }
  }, [screen, idx, needsRetype, feedback, testIdx, testMustRetype, testFeedback]);

  const current = words[idx];
  const target = current ? (mode === 'pt-en' ? current.en : current.pt) : '';
  const source = current ? (mode === 'pt-en' ? current.pt : current.en) : '';
  // Treat teacherId as the workspaceId for attempt logging (fits your current data model)
  const workspaceId = user?.teacherId;

  function startGame(m) {
    if (allWords.length === 0) {
      alert('No lessons assigned yet. Ask your teacher to assign lessons.');
      return;
    }

    setWords(shuffle(allWords));
    setIdx(0);
    setMode(m);
    setInput('');
    setFeedback(null);
    setNeedsRetype(false);
    setAnswer('');
    setHintSpell(false);
    setHintSent(false);
    setScore({ ok: 0, close: 0, wrong: 0 });
    setScreen('play');
  }

  async function saveProgress() {
    const allStudents = (await getData('students', true)) || {};
    const student = allStudents[user.id];
    if (!student) return;

    student.progress = student.progress || { totalCorrect: 0, totalClose: 0, totalWrong: 0 };
    student.progress.totalCorrect += score.ok;
    student.progress.totalClose += score.close;
    student.progress.totalWrong += score.wrong;
    student.progress.lastActive = Date.now();

    allStudents[user.id] = student;
    await setData('students', allStudents, true);
  }

  async function goNext() {
  if (idx + 1 >= words.length) {
    await saveProgress();

    // Only call this if you actually HAVE a workspaceId in this component.
    // If you don’t, remove this fetch for now or pass workspaceId in props.
    if (typeof workspaceId !== "undefined" && workspaceId) {
      await fetch("/api/game/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          gameType: "vocab",
          score: score.ok,
          accuracy: words.length ? score.ok / words.length : null,
          meta: {
            total: words.length,
            correct: score.ok,
            incorrect: score.wrong,
          },
        }),
      });
    }

    setScreen("done");
  } else {
    setIdx(idx + 1);
    setInput("");
    setFeedback(null);
    setNeedsRetype(false);
    setAnswer("");
    setHintSpell(false);
    setHintSent(false);
  }
}


  async function saveProgress() {
    const allStudents = await getData('students', true) || {};
    const student = allStudents[user.id];
    if (!student) return;

    student.progress = student.progress || { totalCorrect: 0, totalClose: 0, totalWrong: 0 };
    student.progress.totalCorrect += score.ok;
    student.progress.totalClose += score.close;
    student.progress.totalWrong += score.wrong;
    student.progress.lastActive = Date.now();

    allStudents[user.id] = student;
    await setData('students', allStudents, true);
  }

  function onSubmit(e) {
    if (e) e.preventDefault();
    const val = input.trim();
    if (val === '') return;

    if (needsRetype) {
      if (normalize(val) === normalize(answer)) {
        goNext();
      } else {
        setInput('');
      }
      return;
    }

    const userNorm = normalize(val);
    const targetNorm = normalize(target);

    let result;
    if (userNorm === targetNorm) {
      result = 'ok';
    } else if (target.startsWith('to ') && userNorm === normalize(target.slice(3))) {
      result = 'ok';
    } else {
      const sim = similarity(userNorm, targetNorm);
      result = sim >= 85 ? 'close' : 'wrong';
    }

    setFeedback(result);
    setAnswer(target);

    if (result === 'ok') {
      setScore(s => ({...s, ok: s.ok + 1}));
      setTimeout(() => { void goNext(); }, 700);
    } else {
      setScore(s => result === 'close' ? {...s, close: s.close + 1} : {...s, wrong: s.wrong + 1});
      setNeedsRetype(true);
      setInput('');
    }
  }

  function onSkip() {
    setFeedback('wrong');
    setAnswer(target);
    setScore(s => ({...s, wrong: s.wrong + 1}));
    setNeedsRetype(true);
    setInput('');
  }

  // Preset study/test functions
  function openPresetStudy(preset) {
    setCurrentPreset(preset);
    setScreen('preset-study');
  }

  function startPresetTest(preset) {
    setCurrentPreset(preset);
    setTestQuestions(shuffle([...preset.tests]));
    setTestIdx(0);
    setTestInput('');
    setTestFeedback(null);
    setTestScore({ok:0, wrong:0});
    setTestMustRetype(false);
    setTestAnswer('');
    setScreen('preset-test');
  }

  function onTestSubmit(e) {
    if (e) e.preventDefault();
    const val = testInput.trim();
    if (val === '') return;

    const currentQ = testQuestions[testIdx];

    if (testMustRetype) {
      if (normalize(val) === normalize(testAnswer)) {
        if (testIdx + 1 >= testQuestions.length) {
          setScreen('preset-test-done');
        } else {
          setTestIdx(testIdx + 1);
          setTestInput('');
          setTestFeedback(null);
          setTestMustRetype(false);
          setTestAnswer('');
        }
      } else {
        setTestInput('');
      }
      return;
    }

    const userNorm = normalize(val);
    const targetNorm = normalize(currentQ.pt);
    const sim = similarity(userNorm, targetNorm);

    if (userNorm === targetNorm) {
      setTestFeedback('ok');
      setTestScore(s => ({...s, ok: s.ok + 1}));
      setTimeout(() => {
        if (testIdx + 1 >= testQuestions.length) {
          setScreen('preset-test-done');
        } else {
          setTestIdx(testIdx + 1);
          setTestInput('');
          setTestFeedback(null);
        }
      }, 700);
    } else if (sim >= 85) {
      setTestFeedback('close');
      setTestAnswer(currentQ.pt);
      setTestScore(s => ({...s, ok: s.ok + 1}));
      setTestMustRetype(true);
      setTestInput('');
    } else {
      setTestFeedback('wrong');
      setTestAnswer(currentQ.pt);
      setTestScore(s => ({...s, wrong: s.wrong + 1}));
      setTestMustRetype(true);
      setTestInput('');
    }
  }

  if (loading) {
    return <div style={{minHeight:'100vh',background:colors.bg,display:'flex',alignItems:'center',justifyContent:'center',color:colors.text}}>Loading...</div>;
  }

  // Preset Study Screen
  if (screen === 'preset-study' && currentPreset) {
    const accentColor = currentPreset.type === 'prepositions' ? colors.yellow : currentPreset.type === 'verbs-de' ? colors.purple : colors.green;
    
    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:'30px 20px',fontFamily:'system-ui',color:colors.text}}>
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
            <div>
              <div style={{fontSize:12,color:accentColor,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Grammar Lesson</div>
              <h1 style={{margin:0,fontSize:28,fontWeight:700}}>{currentPreset.name}</h1>
            </div>
            <button onClick={() => setScreen('menu')} style={{padding:'10px 20px',background:colors.accent,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600}}>← Back</button>
          </div>

          {/* Intro */}
          <div style={{background:`rgba(${currentPreset.type === 'prepositions' ? '234,179,8' : currentPreset.type === 'verbs-de' ? '167,139,250' : '34,197,94'},0.1)`,border:`1px solid ${accentColor}40`,borderRadius:16,padding:20,marginBottom:24}}>
            <div style={{fontSize:15,lineHeight:1.7}}>
              {currentPreset.type === 'prepositions' && 'In Portuguese, the preposition DE (of/from) combines with articles and pronouns to form contractions. These are essential for natural-sounding Portuguese!'}
              {currentPreset.type === 'verbs-de' && 'Many Portuguese verbs require the preposition DE after them. When combined with pronouns or articles, they form contractions.'}
              {currentPreset.type === 'numbers' && 'Learn Portuguese numbers from 1 to 200. Note that um/uma and dois/duas have masculine and feminine forms!'}
            </div>
          </div>

          {/* Test Button */}
          <button 
            onClick={() => startPresetTest(currentPreset)}
            style={{width:'100%',padding:18,marginBottom:24,background:`linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,color:currentPreset.type === 'prepositions' ? '#000' : '#fff',border:'none',borderRadius:12,fontSize:17,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:`0 4px 20px ${accentColor}40`}}
          >
            📝 Take the Test ({currentPreset.tests.length} questions)
          </button>

          {/* Content based on type */}
          {currentPreset.type === 'prepositions' && (
            <div style={{display:'grid',gap:12}}>
              {currentPreset.rules.map((rule, i) => (
                <div key={i} style={{background:colors.card,borderRadius:16,padding:20,border:`1px solid ${accentColor}30`}}>
                  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
                    <div style={{background:`${accentColor}20`,padding:'8px 16px',borderRadius:10}}>
                      <span style={{color:colors.muted,fontSize:14}}>{rule.p}</span>
                      <span style={{color:accentColor,fontSize:20,margin:'0 10px'}}>=</span>
                      <span style={{color:accentColor,fontSize:20,fontWeight:700}}>{rule.e.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{display:'grid',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:16}}>🇧🇷</span>
                      <span style={{color:colors.text,fontSize:15}}>{rule.ex}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:16}}>🇨🇦</span>
                      <span style={{color:colors.muted,fontSize:15}}>{rule.ee}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentPreset.type === 'verbs-de' && (
            <div style={{display:'grid',gap:12}}>
              {currentPreset.verbs.map((v, i) => (
                <div key={i} style={{background:colors.card,borderRadius:16,padding:20,border:`1px solid ${accentColor}30`}}>
                  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
                    <div style={{background:`${accentColor}20`,padding:'8px 16px',borderRadius:10}}>
                      <span style={{color:accentColor,fontSize:18,fontWeight:700}}>{v.verb.toUpperCase()}</span>
                    </div>
                    <span style={{color:colors.muted,fontSize:14}}>({v.meaning})</span>
                  </div>
                  <div style={{display:'grid',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:16}}>🇧🇷</span>
                      <span style={{color:colors.text,fontSize:15}}>{v.ex}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:16}}>🇨🇦</span>
                      <span style={{color:colors.muted,fontSize:15}}>{v.ee}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentPreset.type === 'numbers' && (
            <>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,color:accentColor,fontWeight:600,marginBottom:12}}>1-10</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
                  {currentPreset.numbers.slice(0,10).map((n, i) => (
                    <div key={i} style={{background:colors.card,borderRadius:12,padding:12,textAlign:'center',border:`1px solid ${accentColor}30`}}>
                      <div style={{fontSize:24,color:accentColor,fontWeight:600}}>{n.num}</div>
                      <div style={{fontSize:14,color:colors.text}}>{n.pt}</div>
                      {n.ptf && <div style={{fontSize:11,color:colors.muted}}>({n.ptf})</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,color:accentColor,fontWeight:600,marginBottom:12}}>11-20</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
                  {currentPreset.numbers.slice(10,20).map((n, i) => (
                    <div key={i} style={{background:colors.card,borderRadius:12,padding:12,textAlign:'center',border:`1px solid ${accentColor}30`}}>
                      <div style={{fontSize:24,color:accentColor,fontWeight:600}}>{n.num}</div>
                      <div style={{fontSize:14,color:colors.text}}>{n.pt}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,color:accentColor,fontWeight:600,marginBottom:12}}>Tens & Hundreds</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
                  {currentPreset.numbers.slice(20).map((n, i) => (
                    <div key={i} style={{background:colors.card,borderRadius:12,padding:12,textAlign:'center',border:`1px solid ${accentColor}30`}}>
                      <div style={{fontSize:20,color:accentColor,fontWeight:600}}>{n.num}</div>
                      <div style={{fontSize:12,color:colors.text}}>{n.pt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pro Tip */}
          <div style={{marginTop:24,padding:20,background:`rgba(99,102,241,0.1)`,borderRadius:16,border:`1px solid rgba(99,102,241,0.2)`}}>
            <div style={{fontSize:14,color:colors.accent,fontWeight:600,marginBottom:8}}>💡 Pro Tip</div>
            <div style={{fontSize:14,color:colors.muted,lineHeight:1.6}}>
              {currentPreset.type === 'prepositions' && 'These contractions are mandatory in Portuguese - you cannot say "de o" or "de a" separately. Practice these until they become automatic!'}
              {currentPreset.type === 'verbs-de' && 'Remember: de + ele = dele, de + ela = dela, de + isso = disso. These contractions are required!'}
              {currentPreset.type === 'numbers' && 'cem = exactly 100, cento e... = 101-199. um/uma and dois/duas change for gender.'}
            </div>
          </div>

          <button 
            onClick={() => setScreen('menu')} 
            style={{width:'100%',marginTop:24,padding:16,background:`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,color:'#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:600,cursor:'pointer'}}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Preset Test Screen
  if (screen === 'preset-test' && currentPreset) {
    const currentQ = testQuestions[testIdx];
    if (!currentQ) return null;
    const accentColor = currentPreset.type === 'prepositions' ? colors.yellow : currentPreset.type === 'verbs-de' ? colors.purple : colors.green;

    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:'30px 20px',fontFamily:'system-ui',color:colors.text}}>
        <div style={{maxWidth:500,margin:'0 auto'}}>
          {/* Header */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,color:colors.muted}}>
            <span style={{background:`${accentColor}20`,padding:'6px 12px',borderRadius:8,color:accentColor,fontSize:13}}>{currentPreset.name} Test</span>
            <span><span style={{color:colors.green}}>{testScore.ok}</span> / {testScore.ok + testScore.wrong}</span>
            <button onClick={() => setScreen('preset-study')} style={{padding:'6px 14px',background:'transparent',border:`1px solid ${colors.border}`,borderRadius:6,color:colors.muted,cursor:'pointer',fontSize:13}}>Exit</button>
          </div>

          {/* Main Card */}
          <div style={{background:colors.card,borderRadius:20,padding:28,border:`1px solid ${accentColor}30`}}>
            {/* Rule hint */}
            {currentQ.rule && (
              <div style={{textAlign:'center',marginBottom:20}}>
                <span style={{background:`${accentColor}20`,padding:'6px 14px',borderRadius:8,color:accentColor,fontSize:13}}>{currentQ.rule}</span>
              </div>
            )}

            {/* Question */}
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{color:colors.muted,fontSize:12,marginBottom:10}}>TRANSLATE TO PORTUGUESE</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                <span style={{fontSize:24}}>🇨🇦</span>
                <span style={{fontSize:24,fontWeight:500}}>{currentQ.en}</span>
              </div>
            </div>

            {/* Feedback */}
            {testFeedback && (
              <div style={{
                background: testFeedback === 'ok' ? 'rgba(34,197,94,0.15)' : testFeedback === 'close' ? `${accentColor}20` : 'rgba(239,68,68,0.15)',
                border: `1px solid ${testFeedback === 'ok' ? colors.green : testFeedback === 'close' ? accentColor : colors.red}`,
                borderRadius: 10,
                padding: 16,
                marginBottom: 16
              }}>
                <div style={{color: testFeedback === 'ok' ? colors.green : testFeedback === 'close' ? accentColor : colors.red, fontWeight: 600, marginBottom: testFeedback === 'ok' ? 0 : 8}}>
                  {testFeedback === 'ok' ? '✓ Correto!' : testFeedback === 'close' ? '~ Almost! Spelling error' : '✗ Incorreto'}
                </div>
                {testFeedback !== 'ok' && (
                  <>
                    <div style={{marginTop:8}}>
                      <span style={{color:colors.muted}}>Correct answer:</span>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                        <span style={{fontSize:18}}>🇧🇷</span>
                        <strong style={{fontSize:16}}>{testAnswer}</strong>
                      </div>
                    </div>
                    {testMustRetype && (
                      <div style={{color:colors.muted,fontSize:13,marginTop:10}}>Type the correct answer to continue</div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Input */}
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <span style={{fontSize:20}}>🇧🇷</span>
                <input
                  ref={testInputRef}
                  type="text"
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onTestSubmit(e);
                    }
                  }}
                  placeholder={testMustRetype ? `Type: ${testAnswer}` : 'Type in Portuguese...'}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{flex:1,padding:14,background:colors.bg,border:`2px solid ${accentColor}40`,borderRadius:10,color:colors.text,fontSize:18,outline:'none'}}
                />
              </div>
              <button
                type="button"
                onClick={onTestSubmit}
                style={{width:'100%',padding:16,background:`linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,color:currentPreset.type === 'prepositions' ? '#000' : '#fff',border:'none',borderRadius:10,fontSize:16,fontWeight:600,cursor:'pointer'}}
              >
                {testMustRetype ? 'Confirm' : 'Submit'} ↵
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{textAlign:'center',marginTop:20,color:colors.muted,fontSize:14}}>
            Question {testIdx + 1} of {testQuestions.length}
          </div>
          <div style={{marginTop:12,background:`${accentColor}30`,borderRadius:8,height:8,overflow:'hidden'}}>
            <div style={{background:accentColor,height:'100%',width:`${((testIdx + 1) / testQuestions.length) * 100}%`,transition:'width 0.3s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Preset Test Done Screen
  if (screen === 'preset-test-done' && currentPreset) {
    const total = testScore.ok + testScore.wrong;
    const pct = total ? Math.round((testScore.ok / total) * 100) : 0;
    const accentColor = currentPreset.type === 'prepositions' ? colors.yellow : currentPreset.type === 'verbs-de' ? colors.purple : colors.green;

    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:40,fontFamily:'system-ui',color:colors.text,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center',maxWidth:400}}>
          <div style={{fontSize:14,color:accentColor,textTransform:'uppercase',letterSpacing:2,marginBottom:16}}>{currentPreset.name} Test Complete</div>
          <div style={{fontSize:72,fontWeight:200,marginBottom:8,background:`linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{pct}%</div>
          <p style={{color:colors.muted,marginBottom:32,fontSize:16}}>
            {pct >= 90 ? '🏆 Excellent! You\'ve mastered this!' : 
             pct >= 70 ? '👏 Great job! Keep practicing!' : 
             pct >= 50 ? '💪 Good effort! Review and try again.' : 
             '📚 Keep studying! Practice makes perfect.'}
          </p>
          
          <div style={{display:'flex',gap:24,justifyContent:'center',marginBottom:36}}>
            <div style={{background:'rgba(34,197,94,0.15)',padding:'20px 32px',borderRadius:16,border:'1px solid rgba(34,197,94,0.3)'}}>
              <div style={{fontSize:36,color:colors.green,fontWeight:300}}>{testScore.ok}</div>
              <div style={{color:colors.muted,fontSize:12,marginTop:4}}>CORRECT</div>
            </div>
            <div style={{background:'rgba(239,68,68,0.15)',padding:'20px 32px',borderRadius:16,border:'1px solid rgba(239,68,68,0.3)'}}>
              <div style={{fontSize:36,color:colors.red,fontWeight:300}}>{testScore.wrong}</div>
              <div style={{color:colors.muted,fontSize:12,marginTop:4}}>WRONG</div>
            </div>
          </div>
          
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <button onClick={() => startPresetTest(currentPreset)} style={{padding:16,background:`linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,color:currentPreset.type === 'prepositions' ? '#000' : '#fff',border:'none',borderRadius:12,fontSize:16,fontWeight:600,cursor:'pointer'}}>
              Try Again
            </button>
            <button onClick={() => setScreen('preset-study')} style={{padding:16,background:`${accentColor}20`,color:accentColor,border:`1px solid ${accentColor}40`,borderRadius:12,fontSize:16,fontWeight:600,cursor:'pointer'}}>
              Review Lesson
            </button>
            <button onClick={() => setScreen('menu')} style={{padding:16,background:'transparent',color:colors.muted,border:`1px solid ${colors.border}`,borderRadius:12,fontSize:16,cursor:'pointer'}}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Menu
  if (screen === 'menu') {
    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:24,fontFamily:'system-ui',color:colors.text}}>
        <div style={{maxWidth:500,margin:'0 auto'}}>
          {/* Header */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32}}>
            <div>
              <div style={{color:colors.muted,fontSize:13}}>Welcome back,</div>
              <div style={{fontSize:20,fontWeight:600}}>{user.name}</div>
            </div>
            <button onClick={onLogout} style={{padding:'8px 16px',background:'rgba(239,68,68,0.1)',color:colors.red,border:`1px solid rgba(239,68,68,0.3)`,borderRadius:8,cursor:'pointer'}}>Logout</button>
          </div>

          {/* Title */}
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:12}}>
              <div style={{width:50,height:35,background:'#009c3b',borderRadius:4,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:0,height:0,borderLeft:'25px solid transparent',borderRight:'25px solid transparent',borderTop:'17px solid #ffdf00',borderBottom:'17px solid #ffdf00'}}></div>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:18,height:18,background:'#002776',borderRadius:'50%'}}></div>
              </div>
              <span style={{fontSize:20,color:colors.accent}}>⟷</span>
              <div style={{width:50,height:35,background:'#fff',borderRadius:4,display:'flex',overflow:'hidden'}}>
                <div style={{width:12,background:'#ff0000'}}></div>
                <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#ff0000',fontSize:14}}>🍁</span></div>
                <div style={{width:12,background:'#ff0000'}}></div>
              </div>
            </div>
            <h1 style={{fontSize:28,fontWeight:700,margin:0,background:`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Português ↔ English
            </h1>
          </div>

          {/* Practice Mode */}
          <div style={{background:colors.card,borderRadius:16,padding:20,marginBottom:20,border:`1px solid ${colors.border}`}}>
            <div style={{color:colors.muted,fontSize:12,marginBottom:12}}>PRACTICE MODE</div>
            {allWords.length === 0 ? (
              <p style={{color:colors.muted,margin:0}}>No lessons assigned yet. Ask your teacher!</p>
            ) : (
              <>
                <div style={{color:colors.green,fontWeight:500,marginBottom:16}}>{allWords.length} words to practice</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <button
                    onClick={() => startGame('pt-en')}
                    style={{...btnStyle(`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`),padding:16,fontSize:16}}
                  >
                    🇧🇷 Português → English 🇨🇦
                  </button>
                  <button
                    onClick={() => startGame('en-pt')}
                    style={{...btnStyle('transparent'),border:`2px solid ${colors.accent}`,color:colors.text,padding:16,fontSize:16}}
                  >
                    🇨🇦 English → Português 🇧🇷
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Preset Lessons */}
          {presetLessons.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{color:colors.muted,fontSize:12,marginBottom:12}}>GRAMMAR LESSONS</div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {presetLessons.map(preset => {
                  const accentColor = preset.type === 'prepositions' ? colors.yellow : preset.type === 'verbs-de' ? colors.purple : colors.green;
                  return (
                    <div key={preset.id} style={{background:colors.card,borderRadius:16,padding:20,border:`1px solid ${accentColor}30`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <div style={{fontWeight:600,fontSize:16}}>{preset.name}</div>
                        <span style={{background:`${accentColor}20`,color:accentColor,padding:'4px 10px',borderRadius:6,fontSize:12}}>{preset.tests.length} questions</span>
                      </div>
                      <div style={{display:'flex',gap:10}}>
                        <button
                          onClick={() => openPresetStudy(preset)}
                          style={{flex:1,padding:12,background:`${accentColor}20`,color:accentColor,border:'none',borderRadius:10,cursor:'pointer',fontWeight:500}}
                        >
                          📖 Study
                        </button>
                        <button
                          onClick={() => startPresetTest(preset)}
                          style={{flex:1,padding:12,background:`linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,color:preset.type === 'prepositions' ? '#000' : '#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:500}}
                        >
                          📝 Test
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Lessons List */}
          {lessons.length > 0 && (
            <div style={{background:colors.card,borderRadius:16,padding:20,border:`1px solid ${colors.border}`}}>
              <div style={{color:colors.muted,fontSize:12,marginBottom:8}}>YOUR LESSONS</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {lessons.map(l => (
                  <span key={l.id} style={{padding:'6px 12px',background:'rgba(99,102,241,0.15)',borderRadius:8,fontSize:13,color:colors.accent}}>{l.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Done
  if (screen === 'done') {
    const total = score.ok + score.close + score.wrong;
    const pct = total ? Math.round((score.ok / total) * 100) : 0;
    return (
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:40,fontFamily:'system-ui',color:colors.text,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center',maxWidth:400}}>
          <div style={{fontSize:14,color:colors.accent,textTransform:'uppercase',letterSpacing:2,marginBottom:16}}>Session Complete</div>
          <div style={{fontSize:72,fontWeight:200,marginBottom:8,background:`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{pct}%</div>
          <p style={{color:colors.muted,marginBottom:32}}>
            {pct >= 90 ? '🏆 Excellent!' : pct >= 70 ? '👏 Great job!' : pct >= 50 ? '💪 Good effort!' : '📚 Keep practicing!'}
          </p>
          <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:32}}>
            <div style={{background:'rgba(34,197,94,0.15)',padding:'16px 24px',borderRadius:12}}>
              <div style={{fontSize:28,color:colors.green}}>{score.ok}</div>
              <div style={{color:colors.muted,fontSize:12}}>CORRECT</div>
            </div>
            <div style={{background:'rgba(234,179,8,0.15)',padding:'16px 24px',borderRadius:12}}>
              <div style={{fontSize:28,color:colors.yellow}}>{score.close}</div>
              <div style={{color:colors.muted,fontSize:12}}>CLOSE</div>
            </div>
            <div style={{background:'rgba(239,68,68,0.15)',padding:'16px 24px',borderRadius:12}}>
              <div style={{fontSize:28,color:colors.red}}>{score.wrong}</div>
              <div style={{color:colors.muted,fontSize:12}}>WRONG</div>
            </div>
          </div>
          <button onClick={() => setScreen('menu')} style={{...btnStyle(`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`),padding:'14px 40px'}}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Play
  return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${colors.bg} 0%, #1a1a2e 50%, #0f3460 100%)`,padding:24,fontFamily:'system-ui',color:colors.text}}>
      <div style={{maxWidth:500,margin:'0 auto'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,color:colors.muted}}>
          <span>{mode === 'pt-en' ? 'PT→EN' : 'EN→PT'}</span>
          <span><span style={{color:colors.green}}>{score.ok}</span> / {score.ok+score.close+score.wrong}</span>
          <button onClick={() => { void saveProgress(); setScreen('menu'); }} style={{padding:'6px 12px',background:'transparent',border:`1px solid ${colors.border}`,borderRadius:6,color:colors.muted,cursor:'pointer'}}>End</button>
        </div>

        {/* Card */}
        <div style={{background:colors.card,borderRadius:20,padding:28,border:`1px solid ${colors.border}`}}>
          {/* Lesson tag */}
          {current?.lessonName && (
            <div style={{textAlign:'center',marginBottom:12}}>
              <span style={{background:'rgba(99,102,241,0.15)',color:colors.accent,padding:'4px 12px',borderRadius:6,fontSize:12}}>{current.lessonName}</span>
            </div>
          )}

          {/* Word */}
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{color:colors.muted,fontSize:12,marginBottom:8}}>TRANSLATE</div>
            <div style={{fontSize:32,fontWeight:500}}>{source}</div>
          </div>

          {/* Hints */}
          {!needsRetype && (
            <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
              <button onClick={() => setHintSpell(!hintSpell)} style={{padding:'6px 14px',background:hintSpell?colors.accent:'transparent',color:hintSpell?'#fff':colors.muted,border:`1px solid ${colors.border}`,borderRadius:16,cursor:'pointer',fontSize:13}}>🔤 Spelling</button>
              <button onClick={() => setHintSent(!hintSent)} style={{padding:'6px 14px',background:hintSent?colors.accent:'transparent',color:hintSent?'#fff':colors.muted,border:`1px solid ${colors.border}`,borderRadius:16,cursor:'pointer',fontSize:13}}>📝 Sentence</button>
            </div>
          )}

          {hintSpell && !needsRetype && (
            <div style={{background:colors.bg,borderRadius:8,padding:14,marginBottom:14,textAlign:'center'}}>
              <div style={{color:colors.muted,fontSize:11,marginBottom:6}}>SPELLING</div>
              <div style={{color:colors.accent,fontSize:18,fontFamily:'monospace',letterSpacing:2}}>{spellHint(target)}</div>
            </div>
          )}

          {hintSent && !needsRetype && current && (current.sp || current.se) && (
            <div style={{background:colors.bg,borderRadius:8,padding:14,marginBottom:14}}>
              <div style={{color:colors.muted,fontSize:11,marginBottom:6}}>SENTENCES</div>
              {current.sp && <div style={{color:colors.yellow,marginBottom:4}}>🇧🇷 {current.sp}</div>}
              {current.se && <div style={{color:colors.accent}}>🇨🇦 {mode === 'pt-en' ? current.se.split(' ').map(word => {
                const targetWords = target.toLowerCase().split(' ');
                const wordLower = word.toLowerCase().replace(/[.,!?]/g, '');
                if (targetWords.some(tw => wordLower === tw.replace(/[.,!?]/g, ''))) {
                  const punct = word.match(/[.,!?]$/)?.[0] || '';
                  return word[0] + '_'.repeat(word.length - 1 - punct.length) + punct;
                }
                return word;
              }).join(' ') : current.se}</div>}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div style={{background:feedback==='ok'?'rgba(34,197,94,0.15)':feedback==='close'?'rgba(234,179,8,0.15)':'rgba(239,68,68,0.15)',border:`1px solid ${feedback==='ok'?colors.green:feedback==='close'?colors.yellow:colors.red}`,borderRadius:8,padding:14,marginBottom:14}}>
              <div style={{color:feedback==='ok'?colors.green:feedback==='close'?colors.yellow:colors.red,fontWeight:600}}>
                {feedback==='ok' ? '✓ Correct!' : feedback==='close' ? '~ Almost!' : '✗ Wrong'}
              </div>
              {feedback !== 'ok' && <div style={{marginTop:6}}>Answer: <strong>{answer}</strong></div>}
              {needsRetype && <div style={{color:colors.muted,fontSize:13,marginTop:6}}>Type the answer to continue</div>}
            </div>
          )}

          {/* Input */}
          <div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(); } }}
              placeholder={needsRetype ? `Type: ${answer}` : 'Your answer...'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              style={{width:'100%',padding:14,background:colors.bg,border:`2px solid ${colors.border}`,borderRadius:10,color:colors.text,fontSize:18,boxSizing:'border-box',marginBottom:12,outline:'none'}}
            />
            <div style={{display:'flex',gap:10}}>
              <button type="button" onClick={onSubmit} style={{flex:1,padding:14,background:`linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,color:'#fff',border:'none',borderRadius:10,fontSize:16,fontWeight:600,cursor:'pointer'}}>
                {needsRetype ? 'Confirm' : 'Submit'} ↵
              </button>
              {!needsRetype && (
                <button type="button" onClick={onSkip} style={{padding:'14px 20px',background:'transparent',color:colors.muted,border:`1px solid ${colors.border}`,borderRadius:10,cursor:'pointer'}}>Skip</button>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{textAlign:'center',marginTop:16,color:colors.muted,fontSize:14}}>
          {idx + 1} / {words.length}
        </div>
      </div>
    </div>
  );
}