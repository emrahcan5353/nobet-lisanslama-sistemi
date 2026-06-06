import { useState, useEffect, useCallback, useRef } from "react";

/* ╔══════════════════════════════════════════════════════════════╗
 * ║               NÖBET PUANTAJ SİSTEMİ                         ║
 * ║   RTEÜ Eğitim Araştırma Hastanesi                           ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  İÇİNDEKİLER  (Ctrl+F ile bölüm numarasını ara)             ║
 * ║                                                              ║
 * ║  ①  SABİTLER         - Tatiller, izin kodları, renkler      ║
 * ║     1a Tatil & Arefe · 1b İzin Kodları · 1c Renkler         ║
 * ║                                                              ║
 * ║  ②  BAŞLANGIÇ VERİSİ - INIT, varsayılan kullanıcı/birim     ║
 * ║                                                              ║
 * ║  ③  ORTAK STILLER    - Buton, input stilleri (S objesi)      ║
 * ║                                                              ║
 * ║  ④  HESAPLAMA        - Tarih, saat, mesai fonksiyonları      ║
 * ║     4a Tarih · 4b Parse · 4c Gece · 4d Doğrulama            ║
 * ║     4e Süt İzni · 4f Sendika · 4g Zorunlu/calcRow           ║
 * ║                                                              ║
 * ║  ⑤  TEMEL BİLEŞENLER - Modal, Fld, Badge, Cell              ║
 * ║                                                              ║
 * ║  ⑥  GİRİŞ & MENÜ     - Login, Header, SifreModal            ║
 * ║                                                              ║
 * ║  ⑦  PUANTAJ MODALLER - TakvimModal, CokluBirimModal          ║
 * ║                                                              ║
 * ║  ⑧  PRINT & İMZA     - PrintView, ImzaModal, ServisModal    ║
 * ║                                                              ║
 * ║  ⑨  ÇİFT BİRİM       - CiftBirimGunModal, BakisModal        ║
 * ║                                                              ║
 * ║  ⑩  SEKMELER         - Puantaj, Personel, Birimler, Kullanıcı║
 * ║                                                              ║
 * ║  ⑪  ANA UYGULAMA     - App, state, storage, routing         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ①  SABİTLER                                                ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  🔧 Tatil ekle    → TATILLER objesi                         ║
 * ║  🔧 İzin kodu ekle→ IZIN_LIST dizisi + IZIN_AD objesi       ║
 * ║  🔧 Renk değiştir → SUT_RENK, SENDIKA_RENK, BRENK           ║
 * ║  🔧 B&W baskı rengi→ PrintView bölümündeki BW objesi        ║
 * ╚══════════════════════════════════════════════════════════════╝ */

/* ── 1a — Tatil & Arefe Günleri 2026 ─────────────────────── */
/* 🔧 Yeni yıl için tarihleri buradan güncelle                 */
const TATILLER = {
  "2026-01-01":{t:"tatil",n:"Yılbaşı"},
  "2026-03-19":{t:"arefe",n:"Ramazan Arefesi"},
  "2026-03-20":{t:"tatil",n:"Ramazan Bayramı 1.Gün"},
  "2026-03-21":{t:"tatil",n:"Ramazan Bayramı 2.Gün"},
  "2026-03-22":{t:"tatil",n:"Ramazan Bayramı 3.Gün"},
  "2026-04-23":{t:"tatil",n:"23 Nisan"},
  "2026-05-01":{t:"tatil",n:"1 Mayıs İşçi Bayramı"},
  "2026-05-19":{t:"tatil",n:"19 Mayıs Gençlik Bayramı"},
  "2026-05-26":{t:"arefe",n:"Kurban Arefesi"},
  "2026-05-27":{t:"tatil",n:"Kurban Bayramı 1.Gün"},
  "2026-05-28":{t:"tatil",n:"Kurban Bayramı 2.Gün"},
  "2026-05-29":{t:"tatil",n:"Kurban Bayramı 3.Gün"},
  "2026-05-30":{t:"tatil",n:"Kurban Bayramı 4.Gün"},
  "2026-07-15":{t:"tatil",n:"15 Temmuz"},
  "2026-08-30":{t:"tatil",n:"30 Ağustos Zafer Bayramı"},
  "2026-10-28":{t:"arefe",n:"Cumhuriyet Arefesi"},
  "2026-10-29":{t:"tatil",n:"Cumhuriyet Bayramı"},
};
/* ── 1b — İzin Kodları ────────────────────────────────────── */
/* 🔧 Yeni kod: IZIN_LIST + IZIN_AD ikisine birden ekle        */
const IZIN_LIST = ["Yİ","R","Nİ","Mİ","RG","E","ANİ","Bİ","Öİ","ASİ","İİ","Üİ","SUA","X"];
const IZIN_AD = {
  "Yİ":"Yıllık İzin","R":"Rapor","Nİ":"Nikah İzni","Mİ":"Mazeret İzni",
  "RG":"Resmi Görevli","E":"Eğitim İzni","ANİ":"Analık İzni",
  "Bİ":"Babalık İzni","Öİ":"Ölüm İzni","ASİ":"Askerlik İzni",
  "İİ":"İdari İzin","Üİ":"Ücretsiz İzin","SUA":"Şua İzni","X":"Birimde Yok"
};
/* ── 1c — Genel Sabitler (Aylar, Unvanlar, Renkler) ───────── */
/* 🔧 Birim renkleri → BRENK dizisi (8 renk, döngüsel)         */
const AYLAR=["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
// [AÇIKLAMA]: Tabloda gösterilen gün isimlerinin 3 harfli kısaltmaları (0=Pazar, 1=Pazartesi... şeklinde sıralanır)
const GK=["Pzr","Pzt","Sal","Çar","Per","Cum","Cts"];
const UNVAN_AD={hemsire:"Hemşire",ebe:"Ebe",radyoloji:"Rad.Teknikeri",anestezi:"Anes.Teknikeri"};
const CALISMA_AD={tam:"Tam Zamanlı",yari:"Yarı Zamanlı",sut:"Süt İzni"};
const BRENK=["#0ea5e9","#10b981","#f59e0b","#8b5cf6","#ef4444","#ec4899","#14b8a6","#f97316"];
const SENDIKA_RENK={bg:"#fde8d8",bdr:"#c2410c",lbl:"Sendika YKÜ İzin Günü"};
const HAFTAICI_GUNLER=["Pazartesi","Salı","Çarşamba","Perşembe","Cuma"];
const DOW_MAP={"Pazartesi":1,"Salı":2,"Çarşamba":3,"Perşembe":4,"Cuma":5};
/* ── 1d — Süt İzni & Sendika Renkleri ─────────────────────── */
/* 🔧 Süt izni dönem renkleri → SUT_RENK (analik/sut1/sut2)    */
const GEBELIK={
  "ETekil":{label:"E-Tekil · 16 Hafta (Eski/Tekil)",hafta:16},
  "EÇoğul":{label:"E-Çoğul · 18 Hafta (Eski/Çoğul)",hafta:18},
  "YTekil":{label:"Y-Tekil · 24 Hafta (Yeni/Tekil)",hafta:24},
  "YÇoğul":{label:"Y-Çoğul · 26 Hafta (Yeni/Çoğul)",hafta:26},
};
// Süt izni dönem renkleri
const SUT_RENK={
  analik:{bg:"#f3e8ff",bdr:"#d8b4fe",lbl:"Analık İzni"},
  sut1:  {bg:"#dbeafe",bdr:"#93c5fd",lbl:"Süt İzni 1.Dönem (3s)"},
  sut2:  {bg:"#dcfce7",bdr:"#86efac",lbl:"Süt İzni 2.Dönem (1.5s)"},
};


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ②  BAŞLANGIÇ VERİSİ                                        ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  🔧 Admin şifresi   → INIT.users[0].pass                    ║
 * ║  🔧 Demo sorumlu    → INIT.users[1]                         ║
 * ║  🔧 Başlangıç birimi→ INIT.birimler                         ║
 * ╚══════════════════════════════════════════════════════════════╝ */
const INIT={
  users:[
    {id:"u0",ad:"Yönetici",user:"admin",pass:"admin123",rol:"yonetici",birimId:null},
    {id:"u1",ad:"Dahiliye Sorumlusu",user:"dahiliye",pass:"123456",rol:"sorumlu",birimId:"b1"},
  ],
  birimler:[{id:"b1",ad:"Dahiliye"},{id:"b2",ad:"Cerrahi"},{id:"b3",ad:"Radyoloji"}],
  personeller:[],aylikListe:{},puantaj:{},cokluBirim:{},manuelFazla:{},mesajlar:[],sonOkumaZamani:{},
  imzaYetkilileri:{
    servisSorumluBirim:{},
    birimSorumlu:"",
    mudurYardimcisi:"",
    mudur:"",
  },
  ciftBirimGun:{}, // "pid_yil_ay" -> {tamGun, arefeGun}
};


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ③  ORTAK STILLER                                           ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  🔧 S.btn    → Mavi birincil buton                          ║
 * ║  🔧 S.btnR   → Kırmızı silme butonu                         ║
 * ║  🔧 S.btnGrn → Yeşil onay butonu                            ║
 * ║  🔧 S.inp    → Input alanı stili                            ║
 * ╚══════════════════════════════════════════════════════════════╝ */
const S={
  inp:{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:5,fontSize:13,boxSizing:"border-box",outline:"none"},
  btn:{backgroundColor:"#0f4c81",color:"#fff",border:"none",borderRadius:5,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:600},
  btnG:{backgroundColor:"#fff",color:"#374151",border:"1px solid #d1d5db",borderRadius:5,padding:"8px 18px",cursor:"pointer",fontSize:13},
  btnR:{backgroundColor:"#dc2626",color:"#fff",border:"none",borderRadius:5,padding:"6px 12px",cursor:"pointer",fontSize:12},
  btnGrn:{backgroundColor:"#059669",color:"#fff",border:"none",borderRadius:5,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:600},
};

/* ╔══════════════════════════════════════════════════════════════╗
 * ║  [AÇIKLAMA]: AYLIK PERSONEL LİSTESİ (TRANSFER SİSTEMİ)      ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Eskiden personellerin sadece genel bir "birimId" değeri    ║
 * ║  vardı. Artık geçmiş listelerin bozulmaması için            ║
 * ║  her birimin o ayki personel listesi state.aylikListe       ║
 * ║  içinde ["BirimId_Yıl_Ay" = [p1, p2]] olarak tutulur.       ║
 * ║  Eğer o ay için bir liste yoksa, otomatik olarak personelin ║
 * ║  orijinal birimine bakılır.                                 ║
 * ╚══════════════════════════════════════════════════════════════╝ */
// --- AYLIK LİSTE (ROSTER) YARDIMCILARI ---
const getBirimPersonelleri = (state, birimId, yil, ay) => {
  if(!birimId) return state.personeller; // fallback (tüm birimler)
  const aylik = state.aylikListe?.[`${birimId}_${yil}_${ay}`];
  if (aylik) return state.personeller.filter(p => aylik.includes(p.id));
  return state.personeller.filter(p => p.birimId === birimId);
};

const getPersonelBirimId = (state, pid, yil, ay) => {
  const p = state.personeller.find(x => x.id === pid);
  if (!p) return null;
  // Fallback: check explicitly if they are in any unit's list for this month
  for (let b of state.birimler) {
    const list = state.aylikListe?.[`${b.id}_${yil}_${ay}`];
    if (list && list.includes(pid)) return b.id;
  }
  return p.birimId; // default
};

const getFiltrelenmisPersonel = (state, efBirim, yil, ay) => {
  if (efBirim) {
    return getBirimPersonelleri(state, efBirim, yil, ay);
  }
  // Tüm birimler seçiliyse, tüm birimlerin o ayki listelerini birleştir
  const result = [];
  const added = new Set();
  state.birimler.forEach(b => {
    getBirimPersonelleri(state, b.id, yil, ay).forEach(p => {
      if (!added.has(p.id)) { added.add(p.id); result.push(p); }
    });
  });
  return result;
};
// ----------------------------------------

function Modal({title,onClose,children,width=480}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:10,width,maxWidth:"96vw",maxHeight:"92vh",overflow:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.35)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",background:"#0f4c81",borderRadius:"10px 10px 0 0",position:"sticky",top:0,zIndex:1}}>
          <span style={{color:"#fff",fontWeight:700,fontSize:15}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}
function Fld({label,children}){return <div style={{marginBottom:12}}><label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:4}}>{label}</label>{children}</div>;}
function Badge({text,color="#6b7280",bg="#f3f4f6"}){return <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,backgroundColor:bg,color,display:"inline-block"}}>{text}</span>;}


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ④  HESAPLAMA FONKSİYONLARI                                 ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  🔧 Gece mesaisi saatleri  → nightH (20:00-08:00)           ║
 * ║  🔧 Zorunlu saat mantığı   → zorunlu() fonksiyonu           ║
 * ║  🔧 Saat doğrulama mesajları→ validateInput() fonksiyonu    ║
 * ╚══════════════════════════════════════════════════════════════╝ */
/* ── 4a — Tarih Yardımcıları ─────────────────────────────── */
/* 🔧 dk=tarih anahtarı, dim=ay gün sayısı, dayInfo=gün tipi  */
const dk=(y,m,d)=>`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const dim=(y,m)=>new Date(y,m,0).getDate();
const dow=(y,m,d)=>new Date(y,m-1,d).getDay();

function dayInfo(y,m,d){
  const k=dk(y,m,d);
  if(TATILLER[k]) return TATILLER[k];
  const dw=dow(y,m,d);
  if(dw===0||dw===6) return {t:"hs",n:dw===6?"Cumartesi":"Pazar"};
  return {t:"is",n:null};
}

/* ── 4b — Vardiya Parse (08-15 → saat) ──────────────────── */
/* 🔧 parseTime: "08:30"→8.5 · parseVal: "08-15"→{saat:7} */
function parseTime(s){
  if(!s) return null;
  if(s.includes(":")){
    const [h,m]=s.split(":");
    const hh=+h, mm=+m;
    if(isNaN(hh)||isNaN(mm)||hh>23||mm>=60) return null;
    return hh+(mm/60);
  }
  const n=+s;
  if(isNaN(n)||n>23) return null;
  return n;
}

function parseVal(v){
  if(!v||!v.trim()) return null;
  const s=v.trim(), up=s.toUpperCase();
  for(const k of IZIN_LIST){ if(up===k.toUpperCase()) return {type:"izin",kod:k,saat:0}; }
  // HH-HH, HH:MM-HH, HH-HH:MM, HH:MM-HH:MM
  const mt=s.match(/^(\d{1,2}(?::\d{2})?)-(\d{1,2}(?::\d{2})?)$/);
  if(mt){
    const a=parseTime(mt[1]), b=parseTime(mt[2]);
    if(a===null||b===null) return null;
    const saat=a===b?24:b>a?b-a:(24-a)+b;
    return {type:"v",a,b,saat:Math.round(saat*100)/100};
  }
  return null;
}


/* ── 4d — Giriş Doğrulama ───────────────────────────────── */
/* 🔧 Hatalı giriş tipleri ve öneri mesajları buradan düzenlenir */
function validateInput(v, unvan){
  if(!v||!v.trim()) return {ok:true};
  const s=v.trim();
  const up=s.toUpperCase();

  // İzin kodu kontrolü
  for(const k of IZIN_LIST){
    if(up===k.toUpperCase()){
      if(k==="SUA" && unvan!=="radyoloji"){
        return {ok:false, msg:"ŞUA izni sadece radyoloji çalışanlarına girilebilir."};
      }
      return {ok:true};
    }
  }

  // Yaygın Türkçe izin yazımı önerileri
  const ONERI={
    "RAPOR":"R","RAP":"R","YILLIK":"Yİ","YILLIK IZIN":"Yİ","YI":"Yİ",
    "NIKAH":"Nİ","NI":"Nİ","MAZERET":"Mİ","MI":"Mİ",
    "EGITIM":"E","EĞİTİM":"E","ANALIK":"ANİ","ANALIK":"ANİ","ANI":"ANİ",
    "BABALIK":"Bİ","BABALK":"Bİ","BI":"Bİ",
    "OLUM":"Öİ","ÖLÜM":"Öİ","OI":"Öİ","ÖI":"Öİ",
    "ASKER":"ASİ","ASKERLİK":"ASİ","ASKERI":"ASİ","ASI":"ASİ",
    "IDARI":"İİ","İDARİ":"İİ","II":"İİ","İI":"İİ",
    "UCRETSIZ":"Üİ","ÜCRETSİZ":"Üİ","UI":"Üİ","ÜI":"Üİ",
    "RESMI":"RG","RESMİ":"RG","ŞUA":"SUA"
  };
  if(ONERI[up]) return {ok:false,msg:`"${s}" geçersiz. Rapor için → `+ONERI[up],oneri:ONERI[up]};

  // Saat format kontrolü — önce yaygın hatalar
  if(/^\d{4}$/.test(s)){
    const h1=s.slice(0,2),h2=s.slice(2,4);
    return {ok:false,msg:`Tire eksik. Doğru format: ${h1}-${h2}`,oneri:`${h1}-${h2}`};
  }
  if(/^\d{1,2}--\d{1,2}/.test(s))
    return {ok:false,msg:`Çift tire. Doğru: ${s.replace("--","-")}`,oneri:s.replace("--","-")};
  if(/^-/.test(s)||/-$/.test(s))
    return {ok:false,msg:`Başta/sonda tire var. Örnek: 08-16`,oneri:s.replace(/^-+|-+$/g,"")};
  if(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(s)||/^\d{1,2}-\d{1,2}:\d{2}$/.test(s)||/^\d{1,2}:\d{2}-\d{1,2}$/.test(s)){
    // Geçerli format - parse et
    const parsed=parseVal(s);
    if(!parsed) return {ok:false,msg:"Saat 0-23 arasında olmalı. Örnek: 08-14:30"};
    return {ok:true};
  }
  // Standart HH-HH formatı
  const mt=s.match(/^(\d{1,2})-(\d{1,2})$/);
  if(mt){
    const a=+mt[1],b=+mt[2];
    if(a>23||b>23) return {ok:false,msg:`Saat 0-23 arasında olmalı. "${s}" hatalı.`};
    return {ok:true};
  }

  // Hiçbirine uymadı
  return {
    ok:false,
    msg:`"${s}" geçersiz. Saat: 08-16, 08-14:30 · İzin: ${IZIN_LIST.join(" ")}`,
  };
}
/* ── 4c — Gece Mesaisi Hesabı (20:00-08:00) ─────────────── */
/* 🔧 0.5 saatlik adımlarla doğru hesaplama */
function nightH(a,b){
  // Works with decimal hours (e.g. 8.5 = 08:30)
  const tot=a===b?24:b>a?b-a:(24-a)+b;
  // Use small steps (0.5h) for accuracy
  const step=0.5;
  let n=0,steps=Math.round(tot/step);
  for(let i=0;i<steps;i++){
    const h=((a+(i*step))%24+24)%24;
    if(h>=20||h<8) n+=step;
  }
  return Math.round(n*100)/100;
}

/* ── 4e — Süt İzni Dönem Hesabı ────────────────────────── */
/* 🔧 analik/sut1/sut2 dönem başlangıç-bitiş tarihleri */
function getSutDonemi(p,y,m,d){
  if(!p||p.calisma!=="sut"||!p.sutBaslangic) return null;
  const bas=new Date(p.sutBaslangic);
  const hafta=(GEBELIK[p.gebeligTipi]?.hafta)||16;
  const analikBitis=new Date(bas); analikBitis.setDate(analikBitis.getDate()+hafta*7);
  const sut1Bitis=new Date(analikBitis); sut1Bitis.setMonth(sut1Bitis.getMonth()+6);
  const sut2Bitis=new Date(sut1Bitis); sut2Bitis.setMonth(sut2Bitis.getMonth()+6);
  const gun=new Date(y,m-1,d);
  if(gun<bas) return null;
  if(gun<analikBitis) return "analik";
  if(gun<sut1Bitis) return "sut1";
  if(gun<sut2Bitis) return "sut2";
  return null;
}

function fmtTarih(dateObj){
  return dateObj.toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"});
}

/* [AÇIKLAMA]: Hamile/yeni doğum yapmış personelin süt izni dönemlerini hesaplar.
 * Personelin 'İzne Ayrılış Tarihi'ne ve 'Gebelik Tipi'ne göre; analık izni (genelde 16hf), 
 * Süt 1. Dönem (ilk 6 ay - 3 saat) ve Süt 2. Dönem (ikinci 6 ay - 1.5 saat) başlangıç/bitiş tarihlerini belirler.
 * Bu tarihler daha sonra 'zorunlu' çalışma saati hedefinden düşülürken kullanılır. */
function sutOzet(p){
  if(!p.sutBaslangic) return null;
  const bas=new Date(p.sutBaslangic);
  const hafta=(GEBELIK[p.gebeligTipi]?.hafta)||16;
  const analikBitis=new Date(bas); analikBitis.setDate(analikBitis.getDate()+hafta*7);
  const sut1Bitis=new Date(analikBitis); sut1Bitis.setMonth(sut1Bitis.getMonth()+6);
  const sut2Bitis=new Date(sut1Bitis); sut2Bitis.setMonth(sut2Bitis.getMonth()+6);
  return{bas,analikBitis,sut1Bitis,sut2Bitis};
}

/* ── 4f — Sendika YKÜ İzin Günleri ─────────────────────── */
/* 🔧 Hangi günün sendika izni sayılacağını belirler */
function isSendikaGunu(personel,y,m,d){
  if(!personel?.sendikaYku||!personel?.sendikaGun) return false;
  const {t}=dayInfo(y,m,d);
  if(t==="tatil"||t==="hs") return false; // Tatil/hs'de sendika izni geçersiz
  const targetDow=DOW_MAP[personel.sendikaGun];
  return dow(y,m,d)===targetDow;
}

function calcSendikaIzinSaat(personel,y,m){
  if(!personel?.sendikaYku||!personel?.sendikaGun) return 0;
  const base=personel.unvan==="radyoloji"?7:8;
  const days=dim(y,m);
  let total=0;
  for(let d=1;d<=days;d++){
    if(isSendikaGunu(personel,y,m,d)){
      const {t}=dayInfo(y,m,d);
      total+=t==="arefe"?5:base;
    }
  }
  if(personel.calisma==="yari") total/=2;
  return total;
}

/* ── 4g — Zorunlu Saat & Aylık İstatistik ───────────────── */
/* 🔧 zorunlu: aylık çalışma saati · calcRow: kişi özeti */
function zorunlu(unvan,calisma,y,m,izinSet=new Set(),personel=null,row=null,idariIzinlerArr=[]){
  const total=dim(y,m),base=unvan==="radyoloji"?7:8;
  let sum=0;
  for(let d=1;d<=total;d++){
    const {t}=dayInfo(y,m,d);
    if(t==="tatil"||t==="hs") continue;
    if(izinSet.has(d)) continue;
    const gunBase=t==="arefe"?5:base;
    if(calisma==="sut"&&personel?.sutBaslangic){
      const don=getSutDonemi(personel,y,m,d);
      if(don==="analik") continue; // Analık izni - çalışma yok
      else if(don==="sut1") sum+=Math.max(0,gunBase-3);
      else if(don==="sut2") sum+=Math.max(0,gunBase-1.5);
      else sum+=gunBase; // Dönem dışı - normal
    } else if(calisma==="sut"){
      sum+=Math.max(0,gunBase-1.5); // Tarih girilmemişse varsayılan
    } else {
      sum+=gunBase;
    }
  }
  if(calisma==="yari") sum/=2;
  // Sendika YKÜ düşümü
  if(personel?.sendikaYku&&personel?.sendikaGun){
    const base=unvan==="radyoloji"?7:8;
    for(let d=1;d<=dim(y,m);d++){
      if(izinSet.has(d)) continue; // İzin varsa zaten düşülmüş
      if(isSendikaGunu(personel,y,m,d)){
        const {t}=dayInfo(y,m,d);
        const dusus=t==="arefe"?5:base;
        sum-=calisma==="yari"?dusus/2:dusus;
      }
    }
  }
  // [YENİ: İdari İzin Mantığı]
  // Kullanıcının belirlediği (Örn: 25 Mayıs) idari izin günlerinde personel EĞER NÖBET TUTARSA:
  // Normalde o günün zorunlu mesai hedefinden, personelin unvanı ve çalışma şekline göre 
  // ilgili günün TAM SAATİ (8, 7, 4 veya 5) kadar hedeften otomatik indirim yapar.
  // Not: Eğer personel idari izinde ÇALIŞMAZSA bu döngü çalışmaz ve 125 saat hedefi aynı kalır.
  if(idariIzinlerArr?.length>0 && row){
    for(const d of idariIzinlerArr){
      if(!izinSet.has(d)){
        const pv=parseVal(row[d]);
        // pv.saat > 0 durumu personelin o gün çalıştığı (nöbet girdiği) anlamına gelir.
        if(pv?.type==="v" && pv.saat>0){
          const {t}=dayInfo(y,m,d);
          // 1. Kural: Arefe gününde herkesin mesaisi 5 saattir.
          // 2. Kural: Radyoloji 7 saat, diğerleri 8 saat hedefe sahiptir.
          const gunBase=t==="arefe"?5:(unvan==="radyoloji"?7:8);
          
          // 3. Kural: Yarı zamanlı personelin hedefinden (8/2 = 4 saat) düşülür.
          sum-=calisma==="yari"?gunBase/2:gunBase;
        }
      }
    }
  }
  return Math.max(0,sum);
}

/* ── 4h — Artırımlı (Bayram) Mesaisi Hesabı ─────────────── */
/* 
 * [AÇIKLAMA]: Bu fonksiyon, verilen tarihteki nöbet saatlerinin (a ve b), 
 * artırımlı mesai ödenen resmi ve dini bayramlara denk gelip gelmediğini hesaplar.
 * - Ramazan Bayramı, Kurban Bayramı, 29 Ekim, 23 Nisan ve 30 Ağustos artırımlı günlerdir.
 * - Eğer tatil "Arefe" (tatil.t === "arefe") ise, mesai sadece saat 13:00'ten sonra başlarsa artırımlı sayılır.
 * - Nöbet gece yarısını geçiyorsa (isNextDay), iki güne bölünerek her günün tatil durumuna ayrı ayrı bakılır.
 */
function calcArtirimli(y, m, d, a, b) {
  if (a == null || b == null) return 0;
  let totalArtirimli = 0;
  const isNextDay = a >= b && !(a === 0 && b === 0);
  const segments = [];
  if (isNextDay) {
    segments.push({ date: new Date(y, m - 1, d), start: a, end: 24 });
    const nextDate = new Date(y, m - 1, d + 1);
    segments.push({ date: nextDate, start: 0, end: b });
  } else {
    segments.push({ date: new Date(y, m - 1, d), start: a, end: b });
  }
  for (const seg of segments) {
    const sy = seg.date.getFullYear();
    const sm = seg.date.getMonth() + 1;
    const sd = seg.date.getDate();
    const k = dk(sy, sm, sd);
    const tatil = TATILLER[k];
    if (!tatil) continue;
    const n = tatil.n.toLowerCase();
    const isArtirimli = n.includes("ramazan") || n.includes("kurban") || n.includes("cumhuriyet") || n.includes("23 nisan") || n.includes("30 ağustos");
    if (!isArtirimli) continue;
    let overlapStart = seg.start;
    let overlapEnd = seg.end;
    if (tatil.t === "arefe") {
      overlapStart = Math.max(overlapStart, 13);
    }
    if (overlapEnd > overlapStart) {
      totalArtirimli += (overlapEnd - overlapStart);
    }
  }
  return totalArtirimli;
}

/* [AÇIKLAMA]: Personelin seçili aydaki toplam nöbet (çalışma) saati ve gece mesailerini hesaplar.
 * İzinli günleri atlar, personelin tutması gereken hedef saati 'zorunlu()' fonksiyonundan alır.
 * Sonra gerçekleşen nöbet saatiyle hedefi kıyaslayarak fazla mesai (faz), gündüz/gece mesai (gnM, gM) gibi özet verileri çıkarır. */
function calcRow(row,unvan,calisma,y,m,mf,personel=null,idariIzinlerArr=[]){
  const total=dim(y,m); let cal=0,gece=0,artMesai=0;
  const izinSet=new Set();
  for(let d=1;d<=total;d++){
    const pv=parseVal(row?.[d]);
    if(!pv) continue;
    if(pv.type==="izin") izinSet.add(d);
    else{
      cal+=pv.saat;
      gece+=nightH(pv.a,pv.b);
      artMesai+=calcArtirimli(y,m,d,pv.a,pv.b);
    }
  }
  const zon=zorunlu(unvan,calisma,y,m,izinSet,personel,row,idariIzinlerArr);
  const faz=mf!=null?mf:Math.max(0,cal-zon);
  
  /* YASAL KURAL: Bayram günlerinde çalışılan saatler, ancak kişinin o ay içerisindeki 
   * toplam mesaisi aylık yasal süreyi (zon) aşmışsa (yani fazla mesaisi varsa) artırımlı ödenir. 
   * Ay toplamında fazla mesai yoksa (faz=0), bayram farkı ödemesi (gecerliArtMesai) sıfır olur.
   * Eğer fazla mesai varsa, bayram mesaisi toplam fazla mesai limitini aşamaz (Math.min). */
  const gecerliArtMesai=calisma!=="sut"&&faz>0?Math.min(artMesai,faz):0;
  
  const gM=calisma!=="sut"&&faz>0?Math.min(gece,faz):0;
  const gnM=calisma!=="sut"&&faz>0?faz-gM:0;
  return{cal,zon,gece,gM,gnM,faz:calisma==="sut"?0:faz,artMesai:gecerliArtMesai};
}

function calcCokluZorunlu(unvan,calisma,al){
  if(!al||al.length===0) return null;
  const base=unvan==="radyoloji"?7:8,db=calisma==="sut"?base-1.5:base;
  let t=0;
  for(const a of al){const cg=Math.max(0,(+a.tamGun||0)-(+a.izinGun||0));t+=cg*db+(+a.arefe||0)*5;}
  if(calisma==="yari") t/=2;
  return t;
}

function ayIsGunu(y,m){
  const total=dim(y,m);let c=0;
  for(let d=1;d<=total;d++){const {t}=dayInfo(y,m,d);if(t==="is"||t==="arefe")c++;}
  return c;
}

/* ═══════════════════════════════════════════════


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ⑤  TEMEL BİLEŞENLER                                       ║
 * ╚══════════════════════════════════════════════════════════════╝ *
 *  Uygulamanın her yerinde kullanılan temel React bileşenleri.
 *   *  ──────────────────────────────────────────────────────
 *   *    Modal → Açılır pencere şablonu
 *   *    Fld   → Form alanı (label + input)
 *   *    Badge → Renkli küçük etiket
 *   *    Cell  → Puantaj hücresi + doğrulama uyarı balonu
 */

function Cell({val,dt,editable,onSave,sutDon,sendika,unvan,prevVal,nextVal}){
  const [ed,setEd]=useState(false);const [inp,setInp]=useState(val||"");const ref=useRef();
  const [warn,setWarn]=useState(null);const warnTimer=useRef(null);
  useEffect(()=>{setInp(val||"");},[val]);
  useEffect(()=>{if(ed&&ref.current){ref.current.focus();ref.current.select();}},[ed]);
  const showWarn=(msg)=>{
    setWarn(msg);
    if(warnTimer.current) clearTimeout(warnTimer.current);
    warnTimer.current=setTimeout(()=>setWarn(null),3000);
  };
  const commit=()=>{
    const v=inp.trim();
    setEd(false);
    if(!v){onSave(null);return;}
    const chk=validateInput(v, unvan);
    if(!chk.ok){
      showWarn(chk.msg);
      setInp(val||""); // eski değere dön
      return;
    }

    // Çakışma ve Dinlenme Süresi Kontrolü (Örn: 08-08 sonrası ertesi gün 08-08 yazılamaz)
    const pvCurrent = parseVal(v);
    if(pvCurrent && pvCurrent.type === "v"){
      const pvPrev = parseVal(prevVal);
      const pvNext = parseVal(nextVal);
      
      // Eğer dünkü mesai gece 24'ü geçiyorsa (a >= b) ve bugünkü mesai çıkış saatinden önce/aynı saatte başlıyorsa
      if(pvPrev && pvPrev.type === "v" && pvPrev.a >= pvPrev.b){
        if(pvCurrent.a <= pvPrev.b){
          showWarn(`Hata: Dünkü mesai bugün saat ${pvPrev.b}:00'da bitiyor. Çakışan mesai giremezsiniz!`);
          setInp(val||"");
          return;
        }
      }
      
      // Eğer bugünkü mesai gece 24'ü geçiyorsa (a >= b) ve yarınki mesai ile çakışıyorsa
      if(pvNext && pvNext.type === "v" && pvCurrent.a >= pvCurrent.b){
        if(pvNext.a <= pvCurrent.b){
          showWarn(`Hata: Bu mesai yarın saat ${pvCurrent.b}:00'da bitiyor ve yarınki kayıtla çakışıyor!`);
          setInp(val||"");
          return;
        }
      }
    }

    onSave(v);
  };
  const pv=parseVal(val);
  // Süt izni dönemine göre is günü rengini override et
  const sutRenk=sutDon&&SUT_RENK[sutDon];
  const bg2=dt==="tatil"?"#fff0f0":dt==="hs"?"#e8e8e8":dt==="arefe"?"#f2f2f2":sendika?SENDIKA_RENK.bg:sutRenk&&dt==="is"?sutRenk.bg:"#ffffff";
  const bdr2=dt==="tatil"?"#ffc5c5":dt==="hs"?"#cccccc":dt==="arefe"?"#d5d5d5":sendika?SENDIKA_RENK.bdr:sutRenk&&dt==="is"?sutRenk.bdr:"#e5e7eb";
  if(ed) return(
    <td style={{padding:0,background:bg2,border:`1px solid ${bdr2}`}}>
      <input ref={ref} value={inp} onChange={e=>setInp(e.target.value)} onBlur={commit}
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setEd(false);setInp(val||"");}}}
        style={{width:54,border:"2px solid #2563eb",textAlign:"center",fontSize:11,padding:"3px 0",outline:"none",background:"#fffde7",boxSizing:"border-box"}}/>
    </td>
  );
  return(
    <td onClick={()=>editable&&setEd(true)}
      title={pv?.type==="izin"?IZIN_AD[pv.kod]:pv?.type==="v"?`${pv.saat} saat`:sendika?SENDIKA_RENK.lbl:sutDon?SUT_RENK[sutDon]?.lbl:editable?"Tıklayın":""}
      style={{background:warn?"#fef9c3":bg2,border:`1px solid ${warn?"#f59e0b":bdr2}`,padding:"3px 2px",textAlign:"center",cursor:editable?"pointer":"default",width:54,minWidth:54,maxWidth:54,height:36,position:"relative"}}>
      {warn&&(
        <div style={{position:"absolute",zIndex:9999,bottom:"105%",left:"50%",transform:"translateX(-50%)",background:"#1e293b",color:"#fff",fontSize:9,padding:"6px 10px",borderRadius:6,whiteSpace:"normal",width:200,textAlign:"center",boxShadow:"0 4px 14px rgba(0,0,0,.35)",lineHeight:1.5,pointerEvents:"none"}}>
          ⚠️ {warn}
          <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:"6px solid #1e293b"}}/>
        </div>
      )}
      {val&&<>
        <div style={{fontSize:10,fontWeight:700,color:pv?.type==="izin"?"#7c3aed":"#111827",lineHeight:1.3}}>{val}</div>
        {pv?.type==="v"&&<div style={{fontSize:9,color:"#9ca3af"}}>{pv.saat}s</div>}
      </>}
    </td>
  );
}

/* ═══════════════════════════════════════════════


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ⑥  GİRİŞ & MENÜ                                           ║
 * ╚══════════════════════════════════════════════════════════════╝ *
 *  Kullanıcı girişi ve üst menü bileşenleri.
 *   *  ──────────────────────────────────────────
 *   *    SifreModal  → Şifre değiştirme formu
 *   *    LoginScreen → Yönetici/Sorumlu giriş ekranı
 *   *    Header      → Üst menü + sekme navigasyonu
 */

/* ── SifreModal ──────────────────────────────────────── */
/* 🔧 Min şifre uzunluğu → form.yeni.length < 6 */
/* ŞİFRE DEĞİŞTİR MODAL
═══════════════════════════════════════════════ */
function SifreModal({user,onSave,onClose}){
  const [form,setForm]=useState({eski:"",yeni:"",tekrar:""});
  const [err,setErr]=useState("");
  const [ok,setOk]=useState(false);
  const save=()=>{
    if(!form.eski||!form.yeni||!form.tekrar){setErr("Tüm alanlar zorunludur");return;}
    if(form.eski!==user.pass){setErr("Mevcut şifre hatalı");return;}
    if(form.yeni.length<6){setErr("Yeni şifre en az 6 karakter olmalıdır");return;}
    if(form.yeni!==form.tekrar){setErr("Yeni şifreler eşleşmiyor");return;}
    onSave(form.yeni);
    setOk(true);
    setTimeout(onClose,1200);
  };
  return(
    <Modal title="🔑 Şifre Değiştir" onClose={onClose} width={360}>
      {ok?(
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:40,marginBottom:8}}>✅</div>
          <div style={{fontSize:15,fontWeight:700,color:"#059669"}}>Şifre başarıyla değiştirildi</div>
        </div>
      ):(
        <>
          {err&&<div style={{background:"#fee2e2",color:"#dc2626",padding:"10px 12px",borderRadius:5,marginBottom:12,fontSize:13,display:"flex",gap:6}}><span>⚠️</span>{err}</div>}
          <Fld label="Mevcut Şifre">
            <input type="password" style={S.inp} value={form.eski} onChange={e=>setForm(f=>({...f,eski:e.target.value}))} autoFocus placeholder="Mevcut şifrenizi girin"/>
          </Fld>
          <Fld label="Yeni Şifre">
            <input type="password" style={S.inp} value={form.yeni} onChange={e=>setForm(f=>({...f,yeni:e.target.value}))} placeholder="En az 6 karakter"/>
          </Fld>
          <Fld label="Yeni Şifre (Tekrar)">
            <input type="password" style={S.inp} value={form.tekrar} onChange={e=>setForm(f=>({...f,tekrar:e.target.value}))} placeholder="Yeni şifreyi tekrar girin"
              onKeyDown={e=>e.key==="Enter"&&save()}/>
          </Fld>
          <div style={{background:"#f9fafb",borderRadius:5,padding:"8px 12px",fontSize:11,color:"#6b7280",marginBottom:14,borderLeft:"3px solid #d1d5db"}}>
            Şifre en az <strong>6 karakter</strong> olmalıdır.
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={S.btnG} onClick={onClose}>İptal</button>
            <button style={S.btn} onClick={save}>Kaydet</button>
          </div>
        </>
      )}
    </Modal>
  );
}


/* ═══════════════════════════════════════════════

/* ── LoginScreen ─────────────────────────────────────── */
/* 🔧 Hastane adı → div içindeki metin bloğu */
/* 🔧 Demo bilgileri → en alttaki div bloğu */
/* GİRİŞ EKRANI
═══════════════════════════════════════════════ */
function LoginScreen({users,onLogin}){
  const [u,setU]=useState("");const [p,setP]=useState("");const [err,setErr]=useState("");
  const go=(gereken)=>{
    if(!u.trim()||!p.trim()){setErr("Kullanıcı adı ve şifre giriniz");return;}
    const usr=users.find(x=>x.user===u&&x.pass===p);
    if(!usr){setErr("Kullanıcı adı veya şifre hatalı");return;}
    if(gereken&&usr.rol!==gereken){
      setErr(gereken==="yonetici"
        ?"Bu hesap Birim Sorumlusuna aittir. Sorumlu Girişi kullanın."
        :"Bu hesap Yöneticiye aittir. Yönetici Girişi kullanın.");
      return;
    }
    onLogin(usr);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f4c81 0%,#1565c0 55%,#0d47a1 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:16}}>
      <div style={{background:"#fff",borderRadius:14,padding:40,width:400,boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:42,marginBottom:10}}>🏥</div>
          <div style={{fontSize:11,fontWeight:800,color:"#0f4c81",letterSpacing:"0.5px",lineHeight:1.5,textTransform:"uppercase"}}>
            Rize Recep Tayyip Erdoğan Üniversitesi
          </div>
          <div style={{fontSize:13,fontWeight:800,color:"#0f4c81",letterSpacing:"0.3px",marginTop:2}}>
            Eğitim Araştırma Hastanesi
          </div>
          <div style={{height:1,background:"linear-gradient(to right,transparent,#d1d5db,transparent)",margin:"12px 0"}}/>
          <div style={{fontSize:15,fontWeight:700,color:"#374151"}}>Nöbet Puantaj Sistemi</div>
          <p style={{margin:"4px 0 0",fontSize:11,color:"#9ca3af"}}>Nöbet Puantaj Sistemi</p>
          <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
            {[["👩‍⚕️","Hemşire"],["👩‍⚕️","Ebe"],["🔬","Radyoloji\nTeknikeri"],["💉","Anestezi\nTeknikeri"]].map(([ico,lbl])=>(
              <div key={lbl} style={{background:"#eef4ff",borderRadius:6,padding:"6px 3px",textAlign:"center",border:"1px solid #c7d9f5"}}>
                <div style={{fontSize:16}}>{ico}</div>
                <div style={{fontSize:8,fontWeight:700,color:"#1e40af",whiteSpace:"pre-line",lineHeight:1.3,marginTop:2}}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        {err&&<div style={{background:"#fee2e2",color:"#dc2626",padding:"10px 14px",borderRadius:6,marginBottom:14,fontSize:13,display:"flex",gap:6}}><span>⚠️</span><span>{err}</span></div>}
        <Fld label="Kullanıcı Adı">
          <input style={S.inp} value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go(null)} autoFocus placeholder="Kullanıcı adı"/>
        </Fld>
        <Fld label="Şifre">
          <input type="password" style={S.inp} value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go(null)} placeholder="Şifre"/>
        </Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
          <button style={{...S.btn,padding:"12px 0",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:7}} onClick={()=>go("yonetici")}>
            <span style={{fontSize:18}}>👔</span><span>Yönetici</span>
          </button>
          <button style={{...S.btnGrn,padding:"12px 0",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:7}} onClick={()=>go("sorumlu")}>
            <span style={{fontSize:18}}>👩‍⚕️</span><span>Sorumlu</span>
          </button>
        </div>
        <div style={{marginTop:16,padding:12,background:"#f9fafb",borderRadius:6,fontSize:11,color:"#6b7280",borderLeft:"3px solid #d1d5db"}}>
          <div><strong>Yönetici:</strong> admin / admin123</div>
          <div style={{marginTop:3}}><strong>Sorumlu:</strong> dahiliye / 123456</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════

/* ── Header ──────────────────────────────────────────── */
/* 🔧 Sekme listesi → tabs dizisi */
/* 🔧 Yıl seçenekleri → [2025, 2026, 2027] */
/* HEADER
═══════════════════════════════════════════════ */
function Header({user,tab,setTab,yil,ay,setYil,setAy,onLogout,onSifreDegistir,birimler,appZoom,setAppZoom,unreadCount=0}){
  const [showSifre,setShowSifre]=useState(false);
  const tabs=user.rol==="yonetici"
    ?[{id:"puantaj",lbl:"📋 Puantaj"},{id:"dashboard",lbl:"📊 Dashboard"},{id:"personel",lbl:"👥 Personel"},{id:"birimler",lbl:"🏥 Birimler"},{id:"kullanicilar",lbl:"🔐 Kullanıcılar"},{id:"mesajlar",lbl:"✉️ Mesajlar",badge:0}]
    :[{id:"puantaj",lbl:"📋 Puantaj"},{id:"dashboard",lbl:"📊 Dashboard"},{id:"personel",lbl:"👥 Personel"},{id:"mesajlar",lbl:"✉️ Mesajlar",badge:unreadCount}];
  const birimAd=birimler.find(b=>b.id===user.birimId)?.ad;
  return(
    <div style={{background:"#0f4c81",color:"#fff",fontFamily:"'Segoe UI',system-ui,sans-serif",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.25)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🏥</span>
          <div>
            <div style={{fontWeight:800,fontSize:13,lineHeight:1.3}}>RTEÜ Eğitim Araştırma Hastanesi</div>
            <div style={{fontSize:10,opacity:.8,fontWeight:600}}>Nöbet Puantaj Sistemi</div>
            <div style={{fontSize:11,opacity:.75}}>{user.ad}{birimAd?" · "+birimAd:""} · {user.rol==="yonetici"?"👔 Yönetici":"👩‍⚕️ Birim Sorumlusu"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <select value={ay} onChange={e=>setAy(+e.target.value)} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:5,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>
            {AYLAR.slice(1).map((a,i)=><option key={i+1} value={i+1} style={{color:"#000"}}>{a}</option>)}
          </select>
          <select value={yil} onChange={e=>setYil(+e.target.value)} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:5,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>
            {[2025,2026,2027].map(y=><option key={y} value={y} style={{color:"#000"}}>{y}</option>)}
          </select>
          <div style={{display:"flex",alignItems:"center",background:"rgba(0,0,0,.15)",borderRadius:5,padding:"2px",gap:2,marginRight:8}}>
            <button onClick={()=>setAppZoom(z=>Math.max(40,z-5))} title="Uzaklaştır (-)" style={{background:"transparent",border:"none",color:"#fff",cursor:"pointer",padding:"3px 8px",fontSize:14,fontWeight:800}}>-</button>
            <span style={{fontSize:11,fontWeight:600,padding:"0 4px",minWidth:36,textAlign:"center"}} title="Görünüm Boyutu">%{appZoom}</span>
            <button onClick={()=>setAppZoom(z=>Math.min(150,z+5))} title="Yakınlaştır (+)" style={{background:"transparent",border:"none",color:"#fff",cursor:"pointer",padding:"3px 8px",fontSize:14,fontWeight:800}}>+</button>
          </div>
          <button onClick={()=>setShowSifre(true)} title="Şifre Değiştir"
            style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:5,padding:"5px 12px",cursor:"pointer",fontSize:12}}>
            🔑 Şifre
          </button>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:5,padding:"5px 12px",cursor:"pointer",fontSize:12}}>Çıkış</button>
          {showSifre&&<SifreModal user={user} onSave={pwd=>onSifreDegistir(user.id,pwd)} onClose={()=>setShowSifre(false)}/>}
        </div>
      </div>
      <div style={{display:"flex",paddingLeft:16}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"rgba(255,255,255,.18)":"transparent",color:"#fff",border:"none",borderBottom:tab===t.id?"3px solid #7dd3fc":"3px solid transparent",padding:"9px 18px",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:400,transition:"all .15s",display:"flex",alignItems:"center",gap:6}}>
            {t.lbl}
            {t.badge > 0 && <span style={{background:"#ef4444",color:"#fff",borderRadius:"10px",padding:"2px 6px",fontSize:10,fontWeight:800}}>{t.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ⑦  PUANTAJ MODALLER                                       ║
 * ╚══════════════════════════════════════════════════════════════╝ *
 *  Puantaj tablosundan açılan yardımcı modallar.
 *   *  ──────────────────────────────────────────
 *   *    TakvimModal     → Personelin aylık takvim görünümü
 *   *    CokluBirimModal → Çoklu birim gün/saat girişi
 */

/* ── TakvimModal ─────────────────────────────────────── */
/* 🔧 Takvim hücre boyutu → padding:6px */
/* TAKVİM MODAL
═══════════════════════════════════════════════ */
function TakvimModal({p,row,yil,ay,onClose}){
  const days=dim(yil,ay),firstDow=dow(yil,ay,1);
  const weeks=[];let week=Array(firstDow).fill(null);
  for(let d=1;d<=days;d++){week.push(d);if(week.length===7){weeks.push(week);week=[];}}
  if(week.length>0){while(week.length<7)week.push(null);weeks.push(week);}
  return(
    <Modal title={`${p.ad} ${p.soyad} — ${AYLAR[ay]} ${yil} Takvimi`} onClose={onClose} width={520}>
      <div style={{marginBottom:10,display:"flex",gap:6,flexWrap:"wrap"}}>
        <Badge text={UNVAN_AD[p.unvan]} color="#0f4c81" bg="#dbeafe"/>
        <Badge text={CALISMA_AD[p.calisma]} color={p.calisma==="tam"?"#065f46":p.calisma==="yari"?"#1e40af":"#9d174d"} bg={p.calisma==="tam"?"#d1fae5":p.calisma==="yari"?"#dbeafe":"#fce7f3"}/>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr>{GK.map(g=><th key={g} style={{padding:6,textAlign:"center",background:"#0f4c81",color:"#fff",fontWeight:600}}>{g}</th>)}</tr></thead>
        <tbody>
          {weeks.map((wk,wi)=>(
            <tr key={wi}>
              {wk.map((d,di)=>{
                if(!d) return <td key={di} style={{padding:4,background:"#f9fafb",border:"1px solid #f3f4f6"}}/>;
                const {t,n}=dayInfo(yil,ay,d);const val=row[d]||"";const pv=parseVal(val);
                const bg={tatil:"#fff0f0",arefe:"#f2f2f2",hs:"#e8e8e8",is:"#fff"}[t];
                return(
                  <td key={di} style={{padding:6,textAlign:"center",background:bg,border:"1px solid #e5e7eb"}} title={n||""}>
                    <div style={{fontSize:10,fontWeight:700,color:"#9ca3af"}}>{d}</div>
                    {val&&<div style={{fontSize:11,fontWeight:700,color:pv?.type==="izin"?"#7c3aed":"#0f4c81"}}>{val}</div>}
                    {pv?.type==="v"&&<div style={{fontSize:9,color:"#9ca3af"}}>{pv.saat}s</div>}
                    {!val&&(t==="tatil"||t==="hs")&&<div style={{fontSize:9,color:t==="tatil"?"#dc2626":"#3b82f6"}}>—</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════

/* ── CokluBirimModal ─────────────────────────────────── */
/* 🔧 Gün limiti aşılırsa kayıt engellenir */
/* 🔧 topG + topA > maxG + arefeG ise hata */
/* ÇOKLU BİRİM MODAL
═══════════════════════════════════════════════ */
function CokluBirimModal({pAd,unvan,calisma,yil,ay,birimler,mevcut,onSave,onClose}){
  const [als,setAls]=useState(mevcut.length>0?mevcut:[{birimId:birimler[0]?.id||"",tamGun:0,arefe:0,izinGun:0}]);
  const [err,setErr]=useState("");
  const maxG=ayIsGunu(yil,ay);
  const arefeG=Array.from({length:dim(yil,ay)},(_,i)=>i+1).filter(d=>dayInfo(yil,ay,d).t==="arefe").length;
  const topG=als.reduce((s,a)=>s+(+a.tamGun||0),0);
  const topA=als.reduce((s,a)=>s+(+a.arefe||0),0);
  const zon=calcCokluZorunlu(unvan,calisma,als.map(a=>({...a,tamGun:+a.tamGun||0,arefe:+a.arefe||0,izinGun:+a.izinGun||0})));
  const setRow=(i,k,v)=>setAls(a=>a.map((r,j)=>j===i?{...r,[k]:v}:r));
  const save=()=>{
    if(topG+topA>maxG+arefeG){setErr(`Limit aşıldı! Toplam ${topG+topA} > Havuz ${maxG+arefeG} gün`);return;}
    setErr("");
    onSave(als.map(a=>({...a,tamGun:+a.tamGun||0,arefe:+a.arefe||0,izinGun:+a.izinGun||0,birimAd:birimler.find(b=>b.id===a.birimId)?.ad||""})));
  };
  return(
    <Modal title={`Çoklu Birim — ${pAd} — ${AYLAR[ay]} ${yil}`} onClose={onClose} width={620}>
      <div style={{marginBottom:10,padding:10,background:"#f0f9ff",borderRadius:5,fontSize:12,color:"#0369a1"}}>
        <strong>{AYLAR[ay]} {yil}</strong> iş günü havuzu: <strong>{maxG}</strong> gün + <strong>{arefeG}</strong> arefe = <strong>{maxG+arefeG}</strong> gün
      </div>
      {err&&<div style={{padding:"8px 12px",background:"#fee2e2",color:"#dc2626",borderRadius:5,marginBottom:10,fontSize:12,fontWeight:600}}>{err}</div>}
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:8}}>
        <thead><tr style={{background:"#f3f4f6"}}>{["Birim","Tam Gün","Arefe","İzin Günü","Çlş.Gereken",""].map((h,i)=><th key={i} style={{padding:"7px 8px",textAlign:"left",fontWeight:600,color:"#374151"}}>{h}</th>)}</tr></thead>
        <tbody>
          {als.map((al,i)=>{
            const base=unvan==="radyoloji"?7:8,db=calisma==="sut"?base-1.5:base;
            const cg=Math.max(0,(+al.tamGun||0)-(+al.izinGun||0));
            const rz=(cg*db+(+al.arefe||0)*5)*(calisma==="yari"?0.5:1);
            return(
              <tr key={i} style={{borderBottom:"1px solid #e5e7eb"}}>
                <td style={{padding:"5px 6px"}}><select value={al.birimId} onChange={e=>setRow(i,"birimId",e.target.value)} style={{...S.inp,padding:"4px 6px",width:120}}>{birimler.map(b=><option key={b.id} value={b.id}>{b.ad}</option>)}</select></td>
                <td style={{padding:"5px 6px"}}><input type="number" min={0} value={al.tamGun} onChange={e=>setRow(i,"tamGun",e.target.value)} style={{...S.inp,width:60,padding:"4px 6px",textAlign:"center"}}/></td>
                <td style={{padding:"5px 6px"}}><input type="number" min={0} value={al.arefe} onChange={e=>setRow(i,"arefe",e.target.value)} style={{...S.inp,width:60,padding:"4px 6px",textAlign:"center"}}/></td>
                <td style={{padding:"5px 6px"}}><input type="number" min={0} value={al.izinGun} onChange={e=>setRow(i,"izinGun",e.target.value)} style={{...S.inp,width:60,padding:"4px 6px",textAlign:"center"}}/></td>
                <td style={{padding:"5px 6px",textAlign:"center",fontWeight:700,color:"#0f4c81"}}>{rz.toFixed(1)}s</td>
                <td style={{padding:"5px 6px",textAlign:"center"}}>{als.length>1&&<button style={{...S.btnR,padding:"3px 8px",fontSize:11}} onClick={()=>setAls(a=>a.filter((_,j)=>j!==i))}>✕</button>}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{background:"#f9fafb",fontWeight:700}}>
            <td style={{padding:"6px 8px"}}>TOPLAM</td>
            <td style={{padding:"6px 8px",textAlign:"center",color:topG>maxG?"#dc2626":"#15803d"}}>{topG}</td>
            <td style={{padding:"6px 8px",textAlign:"center",color:topA>arefeG?"#dc2626":"#15803d"}}>{topA}</td>
            <td/>
            <td style={{padding:"6px 8px",textAlign:"center",color:"#0f4c81"}}>{zon!=null?zon.toFixed(1)+"s":"—"}</td>
            <td/>
          </tr>
        </tfoot>
      </table>
      <button style={{...S.btnG,fontSize:12}} onClick={()=>setAls(a=>[...a,{birimId:birimler[0]?.id||"",tamGun:0,arefe:0,izinGun:0}])}>+ Birim Ekle</button>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
        <button style={S.btnG} onClick={onClose}>İptal</button>
        <button style={S.btnR} onClick={()=>{onSave([]);onClose();}}>Sıfırla</button>
        <button style={S.btn} onClick={save}>Kaydet</button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ⑧  PRINT & İMZA                                           ║
 * ╚══════════════════════════════════════════════════════════════╝ *
 *  PDF çıktısı ve imza yönetimi bileşenleri.
 *   *  ────────────────────────────────────────────────────
 *   *    PrintView         → Sayfa bölmeli A4 yatay baskı
 *   *    ImzaAyarlariModal → 3 üst yönetici adı girişi
 *   *    ServisSorumluModal→ Birim sorumlu adı girişi
 *   *  ────────────────────────────────────────────────────
 *   *    🔧 Sayfa başına personel → PERSONEL_PER_PAGE = 20
 *   *    🔧 B&W renk paleti → BW objesi (gri tonları)
 *   *    🔧 Kağıt yönü → @page {{ size: A4 landscape }}
 */

/* YAZDIR / PDF ÇIKTI
═══════════════════════════════════════════════ */
const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 2mm; }
  html, body, #root { background: #fff !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: auto !important; display: block !important; position: static !important; overflow: visible !important; }
  body * { visibility: hidden !important; }
  .print-modal-wrapper, .print-modal-wrapper * { visibility: visible !important; }
  #nobetPrintArea, #nobetPrintArea * { visibility: visible !important; }
  .print-modal-wrapper { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: none !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; display: block !important; }
  #nobetPrintArea { position: static !important; width: 100% !important; max-width: none !important; background: #fff !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; display: block !important; }
  .no-print { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  table { border-collapse: collapse !important; page-break-inside: avoid; width: 100% !important; }
  td, th { border: 1px solid #000 !important; color: #000 !important; }
  tr { page-break-inside: avoid; }
  .puantaj-page { min-height: 0 !important; height: auto !important; padding: 2mm !important; margin-bottom: 0 !important; box-shadow: none !important; border: none !important; box-sizing: border-box; }
  .puantaj-page:not(:first-child) { page-break-before: always; }
  /* Siyah-beyaz net renkler */
  .bw-tatil { background: #f5c8c8 !important; color: #000 !important; }
  .bw-arefe { background: #eeeeee !important; color: #000 !important; }
  .bw-hafta { background: #d9d9d9 !important; color: #000 !important; }
  .bw-tatil { background: #d9d9d9 !important; color: #000 !important; }
  .bw-sendika { background: #e5e5e5 !important; background-image: repeating-linear-gradient(45deg, #999 0, #999 1px, transparent 0, transparent 4px) !important; color: #000 !important; }
  .bw-analik { background: #f5f5f5 !important; color: #000 !important; }
  .bw-sut1 { background: #ebebeb !important; color: #000 !important; }
  .bw-sut2 { background: #e0e0e0 !important; color: #000 !important; }
  /* Çıktı Alırken Kırpılmayı (Tek Sayfada Sıkışmayı) Önleyen Stiller */
  .print-reset { overflow: visible !important; height: auto !important; max-height: none !important; display: block !important; position: static !important; }
}
`;

// Siyah-Beyaz uyumlu gri tonlar (açıktan koyuya)
const BW = {
  normal:   {bg:"#ffffff", bdr:"#000", text:"#000"},  // Beyaz
  analik:   {bg:"#f5f5f5", bdr:"#000", text:"#000"},  // Çok açık gri
  sut1:     {bg:"#ebebeb", bdr:"#000", text:"#000"},  // Açık gri (ilk 6 ay)
  sendika:  {bg:"#e5e5e5", bdr:"#000", text:"#000"},  // Çizgili gri
  sut2:     {bg:"#e0e0e0", bdr:"#000", text:"#000"},  // Orta-açık gri (ikinci 6 ay)
  hafta:    {bg:"#d9d9d9", bdr:"#000", text:"#000"},  // Belirgin gri (Hafta sonu)
  arefe:    {bg:"#eeeeee", bdr:"#000", text:"#000"},  // Hafta sonundan 1-2 ton açık gri
  tatil:    {bg:"#d9d9d9", bdr:"#000", text:"#000"},  // Belirgin gri (Resmi tatil)
};

function PrintView({state,user,yil,ay,filtreBirim,onClose}){
  const [printBayram,setPrintBayram]=useState(false);
  const [printGereken,setPrintGereken]=useState(true);
  const personeller=state.personeller||[];
  const birimler=state.birimler||[];
  const puantaj=state.puantaj||{};
  const manuelFazla=state.manuelFazla||{};
  const cokluBirim=state.cokluBirim||{};
  const ciftBirimGun=state.ciftBirimGun||{};
  const efBirim=user.rol==="sorumlu"?user.birimId:(filtreBirim||"");
  const filtered=getFiltrelenmisPersonel(state, efBirim, yil, ay);
  const days=Array.from({length:dim(yil,ay)},(_,i)=>i+1);
  const pk=pid=>`${pid}_${yil}_${ay}`;
  const bAd=id=>birimler.find(b=>b.id===id)?.ad||"";
  const pkA=`${efBirim||"genel"}_${yil}_${ay}`;
  const aciklamaTxt = state.aciklamalar?.[pkA] || "";

  // [YENİ]: Yazdırılan A4 sayfada satırların ferahlaması ve alt tarafta "Açıklamalar" bölümüne yer kalması adına limit 16'ya düşürüldü.
  const PERSONEL_PER_PAGE=16;
  const sayfalar=[];
  for(let i=0;i<Math.max(1,filtered.length);i+=PERSONEL_PER_PAGE){
    sayfalar.push(filtered.slice(i,i+PERSONEL_PER_PAGE));
  }
  if(sayfalar.length===0) sayfalar.push([]);
  const toplamSayfa=sayfalar.length;

  const statOf=p=>{
    const row=puantaj[pk(p.id)]||{};
    const mf=manuelFazla[pk(p.id)];
    const cb=cokluBirim[pk(p.id)];
    const stats=calcRow(row,p.unvan,p.calisma,yil,ay,mf?.deger??null,p,state.idariIzinler?.[`${yil}_${ay}`]||[]);
    if(p.ciftBirim){
      const cbg=ciftBirimGun[pk(p.id)];
      const zon=cbg?cbg.hesap:0;
      const faz=mf!=null?mf.deger:Math.max(0,stats.cal-zon);
      const gM=p.calisma!=="sut"&&faz>0?Math.min(stats.gece,faz):0;
      return{...stats,zon,faz:p.calisma==="sut"?0:faz,gM,gnM:p.calisma==="sut"?0:Math.max(0,faz-gM)};
    }
    if(cb&&cb.length>0){
      const cbZ=calcCokluZorunlu(p.unvan,p.calisma,cb);
      if(cbZ!=null){const faz=mf!=null?mf.deger:Math.max(0,stats.cal-cbZ);const gM=p.calisma!=="sut"&&faz>0?Math.min(stats.gece,faz):0;return{...stats,zon:cbZ,faz:p.calisma==="sut"?0:faz,gM,gnM:p.calisma==="sut"?0:Math.max(0,faz-gM)};}
    }
    return stats;
  };

  const dBg=(d,p=null)=>{
    const {t}=dayInfo(yil,ay,d);
    if(t==="tatil") return BW.tatil;
    if(t==="arefe") return BW.arefe;
    if(t==="hs") return BW.hafta;
    if(p?.sendikaYku&&isSendikaGunu(p,yil,ay,d)) return BW.sendika;
    if(p?.calisma==="sut"){
      const don=getSutDonemi(p,yil,ay,d);
      if(don==="analik") return BW.analik;
      if(don==="sut1") return BW.sut1;
      if(don==="sut2") return BW.sut2;
    }
    return BW.normal;
  };

  const cellVal=(pid,d)=>puantaj[pk(pid)]?.[d]||"";

  const doPrint=()=>{
    const style=document.createElement("style");
    style.innerHTML=PRINT_CSS;
    document.head.appendChild(style);
    setTimeout(()=>{
      window.print();
      setTimeout(()=>{
        if(document.head.contains(style)) document.head.removeChild(style);
      },500);
    },100);
  };

  const birimLabel=efBirim?bAd(efBirim):"Tüm Birimler";
  const iy=state.imzaYetkilileri||{};
  const efBirimId=user.rol==="sorumlu"?user.birimId:efBirim;
  const servisSorumluAd=iy.servisSorumluBirim?.[efBirimId]||"";
  const imzaKutulari=[
    {unvan:"Servis Sorumlu\nHemşire / Ebe / Tekniker", ad:servisSorumluAd},
    {unvan:"Sağlık Bakım Hizmetleri\nBirim Sorumlusu", ad:iy.birimSorumlu||""},
    {unvan:"Sağlık Bakım Hizmetleri\nMüdür Yardımcısı", ad:iy.mudurYardimcisi||""},
    {unvan:"Sağlık Bakım Hizmetleri\nMüdürü", ad:iy.mudur||""},
  ];

  // Bir sayfa render eden fonksiyon
  const renderSayfa=(sayfaPers,sayfaNo)=>(
    <div key={sayfaNo} className="puantaj-page" style={{background:"#fff",padding:"8px 6px",fontFamily:"Arial,sans-serif",fontSize:8,minHeight:540,height:"auto",display:"flex",flexDirection:"column",marginBottom:20,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",borderRadius:4}}>
      {/* Başlık */}
      <div style={{textAlign:"center",marginBottom:2,borderBottom:"3px solid #000",paddingBottom:3}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:0.3,color:"#000"}}>RİZE RECEP TAYYİP ERDOĞAN ÜNİVERSİTESİ EĞİTİM ARAŞTIRMA HASTANESİ</div>
        <div style={{fontSize:9,fontWeight:700,marginTop:1,color:"#000"}}>NÖBET PUANTAJ CETVELİ</div>
        <div style={{fontSize:8,marginTop:1,display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap",color:"#000"}}>
          <span><strong>Birim:</strong> {birimLabel}</span>
          <span><strong>Dönem:</strong> {AYLAR[ay]} {yil}</span>
          <span><strong>Toplam:</strong> {filtered.length} personel</span>
          <span><strong>Sayfa:</strong> {sayfaNo}/{toplamSayfa}</span>
        </div>
      </div>

      {/* Puantaj Tablosu */}
      <div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:7}}>
          <thead>
            <tr>
              <th style={{padding:"4px 6px",textAlign:"left",minWidth:110,border:"2px solid #000",fontSize:8,fontWeight:800,background:"#fff",color:"#000"}}>Ad Soyad / Unvan</th>
              {days.map(d=>{
                const {t}=dayInfo(yil,ay,d);const dw=dow(yil,ay,d);
                const bwc={tatil:BW.tatil,arefe:BW.arefe,hs:BW.hafta,is:BW.normal}[t];
                return(
                  <th key={d} style={{padding:"2px 0",textAlign:"center",width:26,minWidth:26,border:"1px solid #000",background:bwc.bg,fontSize:6.5,color:bwc.text}}>
                    <div style={{fontWeight:800}}>{d}</div>
                    <div style={{fontSize:5.5,opacity:.9}}>{GK[dw]}</div>
                    {t==="tatil"&&<div style={{fontSize:5,fontWeight:700}}>T</div>}
                    {t==="arefe"&&<div style={{fontSize:5,fontWeight:700}}>A</div>}
                    {t==="hs"&&<div style={{fontSize:5,fontWeight:700}}>H</div>}
                  </th>
                );
              })}
              {["Çlş\nSaati","Gece\nMesai","Gündüz\nMesai"].map(h=>(
                <th key={h} style={{padding:"3px 3px",textAlign:"center",width:34,minWidth:34,border:"2px solid #000",fontSize:7,whiteSpace:"pre-line",lineHeight:1.2,background:"#fff",color:"#000",fontWeight:800}}>{h}</th>
              ))}
              {printBayram && <th style={{padding:"3px 3px",textAlign:"center",width:34,minWidth:34,border:"2px solid #000",fontSize:7,whiteSpace:"pre-line",lineHeight:1.2,background:"#fff",color:"#000",fontWeight:800}}>Bayram<br/>Mesaisi</th>}
              <th style={{padding:"3px 3px",textAlign:"center",width:34,minWidth:34,border:"2px solid #000",fontSize:7,whiteSpace:"pre-line",lineHeight:1.2,background:"#fff",color:"#000",fontWeight:800}}>Fazla<br/>Mesai</th>
              {printGereken && <th style={{padding:"3px 3px",textAlign:"center",width:34,minWidth:34,border:"2px solid #000",fontSize:7,whiteSpace:"pre-line",lineHeight:1.2,background:"#fff",color:"#000",fontWeight:800}}>Çlş.<br/>Gereken</th>}
            </tr>
          </thead>
          <tbody>
            {sayfaPers.length===0?(
              <tr><td colSpan={37} style={{padding:24,textAlign:"center",color:"#888",fontSize:9}}>Bu birimde personel bulunamadı</td></tr>
            ):sayfaPers.map((p,ri)=>{
              const stats=statOf(p);
              const rb=ri%2===0?"#fff":"#f0f0f0";
              return(
                <tr key={p.id} style={{background:rb,height:15}}>
                  <td style={{padding:"3px 5px",border:"1px solid #000",fontSize:8,fontWeight:700,background:rb,color:"#000"}}>
                    <div style={{color:"#000",fontWeight:800}}>{p.ad} {p.soyad}</div>
                    <div style={{fontSize:6.5,color:"#000",fontWeight:500,marginTop:1}}>{UNVAN_AD[p.unvan]} · {CALISMA_AD[p.calisma]}{p.sendikaYku && p.sendikaGun ?" · YKÜ("+p.sendikaGun.slice(0,3)+")":""}{p.ciftBirim?" · 🔀":""}</div>
                  </td>
                  {days.map(d=>{
                    const val=cellVal(p.id,d);
                    const pv=parseVal(val);
                    const bwc=dBg(d,p);
                    const diagonalStyle=bwc===BW.sendika?{backgroundImage:"repeating-linear-gradient(45deg,#999 0,#999 1px,transparent 0,transparent 50%)",backgroundSize:"4px 4px",backgroundColor:"#e0e0e0"}:{};
                    return(
                      <td key={d} style={{padding:"1px",textAlign:"center",border:`1px solid ${bwc.bdr}`,background:bwc.bg,...diagonalStyle,fontSize:6.5,width:26,minWidth:26,maxWidth:26,height:16}}>
                        {/* [YENİ]: whiteSpace:"nowrap" ve harf aralığı daraltması eklenerek 08-16 gibi saatlerin alt alta kırılması engellendi, tek satıra sığdırıldı */}
                        {val?<div style={{fontWeight:800,color:"#000",fontSize:pv?.type==="izin"?6.5:7.5,lineHeight:1.1,whiteSpace:"nowrap",letterSpacing:"-0.4px"}}>{val}</div>
                            :bwc===BW.analik?<div style={{fontSize:5.5,color:"#555",fontWeight:600}}>ANİ</div>:null}
                      </td>
                    );
                  })}
                  {[
                    {v:stats.cal,bg:"#fff",fw:600,show:true},
                    {v:stats.gM,bg:"#e8e8e8",fw:500,show:true},
                    {v:stats.gnM,bg:"#e8e8e8",fw:500,show:true},
                    {v:stats.artMesai||0,bg:"#f5f5f5",fw:600,show:printBayram},
                    {v:stats.faz,bg:stats.faz>0?"#bbb":"#fff",fw:700,show:true},
                    {v:stats.zon,bg:"#ddd",fw:700,bdr:"2px solid #333",show:printGereken},
                  ].filter(x=>x.show).map(({v,bg:cbg,fw,bdr:cbdr},si)=>(
                    <td key={si} style={{padding:"2px 3px",textAlign:"center",border:cbdr||"1px solid #444",fontSize:7.5,fontWeight:fw,background:cbg,width:34,minWidth:34,color:"#000"}}>
                      {v.toFixed(1)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* İzin Kodları Açıklaması */}
      <div style={{marginTop:2,padding:"2px 5px",border:"2px solid #000",borderRadius:2,fontSize:6.5,color:"#000"}}>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:2}}>
          <strong style={{fontSize:7}}>RENKLER:</strong>
          {[
            ["#fff","Normal İş Günü"],
            ["#ccc","Hafta Sonu (H)"],
            ["#c8c8c8","Arefe (A) 5s"],
            ["#f5c8c8","Resmi Tatil (T)"],
            ["#ddd","Sendika YKÜ (çizgili)"],
            ["#e8e8e8","Analık İzni"],
            ["#d0d0d0","Süt 1.Dönem"],
            ["#b8b8b8","Süt 2.Dönem"],
          ].map(([bg,lbl])=>(
            <span key={lbl} style={{display:"flex",alignItems:"center",gap:2}}>
              <span style={{width:10,height:10,background:bg,border:"1px solid #000",display:"inline-block",flexShrink:0}}/>
              <span style={{fontWeight:600}}>{lbl}</span>
            </span>
          ))}
        </div>
        <div style={{borderTop:"1px solid #666",paddingTop:2,marginTop:2}}>
          <strong>İZİN KODLARI: </strong>
          {IZIN_LIST.map(k=><span key={k} style={{marginRight:5}}><strong>{k}</strong>={IZIN_AD[k]}</span>)}
        </div>
      </div>

      {/* AÇIKLAMALAR (Sadece son sayfada) */}
      {/* [YENİ]: Sisteme eklenen "Açıklamalar" (Notlar) kısmının PDF çıktısında imzalardan hemen önce okunaklı şekilde yazdırılmasını sağlar */}
      {sayfaNo===toplamSayfa && aciklamaTxt && (
        <div style={{marginTop:2, padding:"2px 5px", border:"2px solid #000", borderRadius:2, fontSize:8.5, color:"#000", background:"#fff", whiteSpace:"pre-wrap", lineHeight:1.3}}>
           <strong style={{fontSize:9, textDecoration:"underline"}}>AÇIKLAMALAR / NOTLAR:</strong><br/>
           {aciklamaTxt}
        </div>
      )}

      {/* İmza Alanı (Her Sayfada) */}
      <div style={{marginTop:3,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
        {imzaKutulari.map((k,i)=>(
          <div key={i} style={{border:"2px solid #000",borderRadius:2,padding:"4px 9px",minHeight:60,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
            <div style={{fontSize:7,fontWeight:800,textAlign:"center",borderBottom:"2px solid #000",paddingBottom:3,marginBottom:4,whiteSpace:"pre-line",lineHeight:1.3,color:"#000",minHeight:22}}>
              {k.unvan}
            </div>
            <div style={{textAlign:"center",fontSize:8,fontWeight:700,color:"#000",minHeight:12,padding:"1px 0",textDecoration:k.ad?"underline":"none"}}>
              {k.ad||<span style={{color:"#999",fontStyle:"italic",fontWeight:400}}>—</span>}
            </div>
            <div style={{marginTop:"auto",paddingTop:8,borderTop:"2px solid #000",textAlign:"center",fontSize:7,color:"#000",letterSpacing:2,fontWeight:700}}>
              İ M Z A
            </div>
          </div>
        ))}
      </div>


    </div>
  );

  return(
    <div className="print-modal-wrapper" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8000,overflowY:"auto",padding:16}}>
      <div className="no-print" style={{display:"flex",gap:15,justifyContent:"center",alignItems:"center",marginBottom:12,position:"sticky",top:0,zIndex:1,background:"#1f2937",padding:10,borderRadius:8}}>
        <div style={{display:"flex",gap:15,marginRight:10}}>
          <label style={{color:"#fff",fontSize:13,display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
            <input type="checkbox" checked={printBayram} onChange={e=>setPrintBayram(e.target.checked)}/>
            Bayram Mesaisi Göster
          </label>
          <label style={{color:"#fff",fontSize:13,display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
            <input type="checkbox" checked={printGereken} onChange={e=>setPrintGereken(e.target.checked)}/>
            Çlş. Gereken Göster
          </label>
        </div>
        <button onClick={doPrint} style={{background:"#0f4c81",color:"#fff",border:"none",borderRadius:5,padding:"10px 24px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          🖨️ Yazdır / PDF Al ({toplamSayfa} sayfa)
        </button>
        <button onClick={onClose} style={{background:"#fff",color:"#374151",border:"1px solid #d1d5db",borderRadius:5,padding:"10px 20px",fontSize:14,cursor:"pointer"}}>
          ✕ Kapat
        </button>
      </div>

      <div id="nobetPrintArea" style={{maxWidth:1200,margin:"0 auto"}}>
        {sayfalar.map((sayfa,i)=>renderSayfa(sayfa,i+1))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════

/* ── ImzaAyarlariModal ───────────────────────────────── */
/* 🔧 İmza alanı başlıkları → alanlar dizisi */
/* İMZA YETKİLİLERİ AYAR MODAL
═══════════════════════════════════════════════ */
function ImzaAyarlariModal({mevcut,onSave,onClose}){
  const [form,setForm]=useState({
    birimSorumlu:mevcut?.birimSorumlu||"",
    mudurYardimcisi:mevcut?.mudurYardimcisi||"",
    mudur:mevcut?.mudur||"",
  });
  const alanlar=[
    {key:"birimSorumlu",   lbl:"Sağlık Bakım Hizmetleri Birim Sorumlusu"},
    {key:"mudurYardimcisi",lbl:"Sağlık Bakım Hizmetleri Müdür Yardımcısı"},
    {key:"mudur",          lbl:"Sağlık Bakım Hizmetleri Müdürü"},
  ];
  return(
    <Modal title="✍️ İmza Yetkilileri" onClose={onClose} width={480}>
      <p style={{fontSize:12,color:"#6b7280",margin:"0 0 16px",padding:"8px 12px",background:"#f0f9ff",borderRadius:5,borderLeft:"3px solid #93c5fd"}}>
        Girilen isimler tüm birimlerin PDF çıktısında imza kutucuklarına otomatik yazılır.
        Servis sorumlu adı her birim sorumlusu tarafından ayrıca girilir.
      </p>
      {alanlar.map(({key,lbl})=>(
        <Fld key={key} label={lbl}>
          <input style={S.inp} value={form[key]}
            onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
            placeholder="Ad Soyad giriniz..."/>
        </Fld>
      ))}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
        <button style={S.btnG} onClick={onClose}>İptal</button>
        <button style={S.btn} onClick={()=>{onSave({...mevcut,...form,servisSorumluBirim:mevcut?.servisSorumluBirim||{}});onClose();}}>Kaydet</button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════

/* ── ServisSorumluModal ──────────────────────────────── */
/* 🔧 Her birim sorumlusu kendi adını buradan girer */
/* SERVİS SORUMLU ADI MODAL (Birim Sorumlusu)
═══════════════════════════════════════════════ */
function ServisSorumluModal({birimId,birimAd,mevcut,onSave,onClose}){
  const [ad,setAd]=useState(mevcut||"");
  const [ok,setOk]=useState(false);
  const save=()=>{
    if(!ad.trim()){alert("Ad Soyad giriniz");return;}
    onSave(ad.trim());
    setOk(true);
    setTimeout(onClose,1000);
  };
  return(
    <Modal title="✍️ Servis Sorumlu Bilgisi" onClose={onClose} width={400}>
      {ok?(
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:36,marginBottom:8}}>✅</div>
          <div style={{fontSize:14,fontWeight:700,color:"#059669"}}>Kaydedildi!</div>
        </div>
      ):(
        <>
          <div style={{padding:"10px 14px",background:"#f0fdf4",borderRadius:6,marginBottom:16,fontSize:13,color:"#065f46",borderLeft:"3px solid #86efac"}}>
            <strong>Birim:</strong> {birimAd}<br/>
            <span style={{fontSize:11,color:"#6b7280",marginTop:2,display:"block"}}>
              Bu isim PDF çıktısında "Servis Sorumlu Hemşire/Ebe/Tekniker" kutusuna otomatik yazılacaktır.
            </span>
          </div>
          <Fld label="Ad Soyad">
            <input style={S.inp} value={ad} onChange={e=>setAd(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&save()}
              placeholder="Adınızı ve soyadınızı girin..." autoFocus/>
          </Fld>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
            <button style={S.btnG} onClick={onClose}>İptal</button>
            <button style={S.btn} onClick={save}>Kaydet</button>
          </div>
        </>
      )}
    </Modal>
  );
}


/* ═══════════════════════════════════════════════


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ⑨  ÇİFT BİRİM SİSTEMİ                                     ║
 * ╚══════════════════════════════════════════════════════════════╝ *
 *  İki farklı birimde çalışan personel yönetimi.
 *   *  ────────────────────────────────────────────────────
 *   *    CiftBirimGunModal  → Gün & saat manuel girişi
 *   *    CiftBirimBakisModal→ Yönetici özet tablosu
 *   *  ────────────────────────────────────────────────────
 *   *    🔧 Gün havuzu = ayIsGunu(yil,ay) + arefe günleri
 *   *    🔧 Hesap = (tamGun × günlükSaat) + (arefe × 5)
 */

/* ── CiftBirimGunModal ───────────────────────────────── */
/* 🔧 Gün fazlaysa kayıt engellenir, eksikse uyarı */
/* ÇİFT BİRİM GÜN GİRİŞ MODAL
═══════════════════════════════════════════════ */
function CiftBirimGunModal({p,yil,ay,mevcut,onSave,onClose}){
  const [tamGun,setTamGun]=useState(mevcut?.tamGun??0);
  const [arefeGun,setArefeGun]=useState(mevcut?.arefeGun??0);
  const base=p.unvan==="radyoloji"?7:8;
  const db=p.calisma==="sut"?base-1.5:p.calisma==="yari"?base/2:base;
  const maxGun=ayIsGunu(yil,ay);
  const arefeMax=Array.from({length:dim(yil,ay)},(_,i)=>i+1).filter(d=>dayInfo(yil,ay,d).t==="arefe").length;
  const hesap=(+tamGun||0)*db+(+arefeGun||0)*5;
  const toplamGun=(+tamGun||0)+(+arefeGun||0);
  const durum=toplamGun>maxGun?"fazla":toplamGun<maxGun?"eksik":"tamam";

  return(
    <Modal title={`🔀 Çift Birim Gün Girişi — ${p.ad} ${p.soyad}`} onClose={onClose} width={440}>
      <div style={{padding:"8px 12px",background:"#e0e7ff",borderRadius:6,marginBottom:16,fontSize:12,color:"#3730a3"}}>
        <strong>{AYLAR[ay]} {yil}</strong> · {UNVAN_AD[p.unvan]} · {CALISMA_AD[p.calisma]}<br/>
        <span style={{fontSize:11,opacity:.8}}>Günlük hedef: {db}s · İş günü havuzu: {maxGun} gün + {arefeMax} arefe</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div style={{background:"#f9fafb",borderRadius:7,padding:"12px",border:"1px solid #e5e7eb"}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>Hafta İçi Tam Gün</label>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setTamGun(v=>Math.max(0,v-1))}
              style={{width:28,height:28,borderRadius:5,border:"1px solid #d1d5db",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <input type="number" min={0} value={tamGun} onChange={e=>setTamGun(+e.target.value||0)}
              style={{width:60,textAlign:"center",border:"2px solid #6366f1",borderRadius:5,padding:"4px",fontSize:16,fontWeight:700}}/>
            <button onClick={()=>setTamGun(v=>v+1)}
              style={{width:28,height:28,borderRadius:5,border:"1px solid #d1d5db",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
          <div style={{fontSize:11,color:"#6b7280",marginTop:6,textAlign:"center"}}>{tamGun} × {db}s = <strong>{(+tamGun||0)*db}s</strong></div>
        </div>
        <div style={{background:"#fffbeb",borderRadius:7,padding:"12px",border:"1px solid #fde68a"}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"#92400e",marginBottom:6}}>Arefe Günü</label>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setArefeGun(v=>Math.max(0,v-1))}
              style={{width:28,height:28,borderRadius:5,border:"1px solid #fde68a",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <input type="number" min={0} max={arefeMax} value={arefeGun} onChange={e=>setArefeGun(+e.target.value||0)}
              style={{width:60,textAlign:"center",border:"2px solid #f59e0b",borderRadius:5,padding:"4px",fontSize:16,fontWeight:700}}/>
            <button onClick={()=>setArefeGun(v=>Math.min(arefeMax,v+1))}
              style={{width:28,height:28,borderRadius:5,border:"1px solid #fde68a",background:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
          <div style={{fontSize:11,color:"#92400e",marginTop:6,textAlign:"center"}}>{arefeGun} × 5s = <strong>{(+arefeGun||0)*5}s</strong></div>
        </div>
      </div>

      {/* Hesap Özeti */}
      <div style={{padding:"12px 16px",background:durum==="tamam"?"#f0fdf4":durum==="fazla"?"#fee2e2":"#fffbeb",border:`2px solid ${durum==="tamam"?"#86efac":durum==="fazla"?"#fca5a5":"#fde68a"}`,borderRadius:7,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:durum==="tamam"?"#15803d":durum==="fazla"?"#dc2626":"#92400e"}}>
              {durum==="tamam"?"✅ Toplam doğru":durum==="fazla"?"❌ Gün havuzu aşıldı":"⚠️ Eksik gün var"}
            </div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>
              Girilen: {toplamGun} gün · Havuz: {maxGun+arefeMax} gün
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"#6b7280"}}>Çalışması Gereken</div>
            <div style={{fontSize:22,fontWeight:800,color:"#0f4c81"}}>{hesap.toFixed(1)}<span style={{fontSize:12}}>s</span></div>
            <div style={{fontSize:10,color:"#6b7280"}}>= {tamGun}×{db} + {arefeGun}×5</div>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button style={S.btnG} onClick={onClose}>İptal</button>
        <button style={{...S.btnR,fontSize:12}} onClick={()=>{onSave(null);onClose();}}>Sıfırla</button>
        <button style={S.btn} onClick={()=>{
          if(durum==="fazla"){alert(`Gün havuzu aşıldı! Max: ${maxGun+arefeMax} gün`);return;}
          onSave({tamGun:+tamGun||0,arefeGun:+arefeGun||0,hesap});
          onClose();
        }}>Kaydet</button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════

/* ── CiftBirimBakisModal ─────────────────────────────── */
/* 🔧 Sadece yönetici görür → personeller.some(p=>p.ciftBirim) */
/* ÇİFT BİRİM GENEL BAKIŞ MODAL
═══════════════════════════════════════════════ */
function CiftBirimBakisModal({state,yil,ay,onClose}){
  const {personeller,birimler,ciftBirimGun}=state;
  const ciftler=personeller.filter(p=>p.ciftBirim);
  const maxGun=ayIsGunu(yil,ay);
  const arefeMax=Array.from({length:dim(yil,ay)},(_,i)=>i+1).filter(d=>dayInfo(yil,ay,d).t==="arefe").length;
  const pk=pid=>`${pid}_${yil}_${ay}`;
  const bAd=id=>birimler.find(b=>b.id===id)?.ad||"-";

  return(
    <Modal title={`🔀 Çift Birimde Çalışan Personel — ${AYLAR[ay]} ${yil}`} onClose={onClose} width={700}>
      {ciftler.length===0?(
        <div style={{textAlign:"center",padding:24,color:"#9ca3af"}}>
          Çift birimli personel bulunmuyor.<br/>
          <span style={{fontSize:12}}>Personel eklerken "Birden Fazla Birimde Çalışıyor" seçeneğini işaretleyin.</span>
        </div>
      ):(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#0f4c81",color:"#fff"}}>
                {["Personel","Unvan","Birim","Tam Gün","Arefe","Çlş.Gereken","Toplam Gün","Durum"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ciftler.map((p,i)=>{
                const veri=ciftBirimGun[pk(p.id)];
                const base=p.unvan==="radyoloji"?7:8;
                const db=p.calisma==="sut"?base-1.5:p.calisma==="yari"?base/2:base;
                const tamGun=veri?.tamGun??0;
                const arefeGun=veri?.arefeGun??0;
                const hesap=tamGun*db+arefeGun*5;
                const topGun=tamGun+arefeGun;
                const mxGun=maxGun+arefeMax;
                const durum=!veri?"girilmedi":topGun>mxGun?"fazla":topGun<mxGun?"eksik":"tamam";
                const durumRenk={tamam:"#15803d",eksik:"#d97706",fazla:"#dc2626",girilmedi:"#9ca3af"};
                const durumEtk={tamam:"✅ Tamam",eksik:"⚠️ Eksik",fazla:"❌ Fazla",girilmedi:"— Girilmedi"};
                return(
                  <tr key={p.id} style={{background:i%2===0?"#fff":"#fafafa",borderBottom:"1px solid #e5e7eb"}}>
                    <td style={{padding:"8px 10px",fontWeight:700}}>{p.ad} {p.soyad}</td>
                    <td style={{padding:"8px 10px"}}><Badge text={UNVAN_AD[p.unvan]} color="#0f4c81" bg="#dbeafe"/></td>
                    <td style={{padding:"8px 10px"}}><Badge text={bAd(getPersonelBirimId(state,p.id,yil,ay))} color="#fff" bg={BRENK[birimler.findIndex(b=>b.id===getPersonelBirimId(state,p.id,yil,ay))%BRENK.length]}/></td>
                    <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700}}>{veri?tamGun:"—"}</td>
                    <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700}}>{veri?arefeGun:"—"}</td>
                    <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700,color:"#0f4c81"}}>{veri?hesap.toFixed(1)+"s":"—"}</td>
                    <td style={{padding:"8px 10px",textAlign:"center"}}>
                      {veri?(
                        <span style={{fontWeight:700,color:topGun>mxGun?"#dc2626":topGun<mxGun?"#d97706":"#15803d"}}>
                          {topGun}/{mxGun}
                        </span>
                      ):"—"}
                    </td>
                    <td style={{padding:"8px 10px"}}>
                      <span style={{fontWeight:700,color:durumRenk[durum]}}>{durumEtk[durum]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{marginTop:12,padding:"8px 12px",background:"#f9fafb",borderRadius:5,fontSize:11,color:"#6b7280",borderLeft:"3px solid #d1d5db"}}>
            <strong>{AYLAR[ay]} {yil}</strong> — İş günü havuzu: <strong>{maxGun}</strong> gün + <strong>{arefeMax}</strong> arefe = <strong>{maxGun+arefeMax}</strong> gün
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}>
        <button style={S.btnG} onClick={onClose}>Kapat</button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ⑩  SEKMELER                                               ║
 * ╚══════════════════════════════════════════════════════════════╝ *
 *  Uygulamanın 4 ana sekmesi.
 *   *  ────────────────────────────────────────────────────
 *   *    PuantajTablosu     → Ana nöbet tablosu
 *   *    PersonelYonetimi   → Personel ekleme / silme
 *   *    BirimlerYonetimi   → Birim ekleme / silme
 *   *    KullanicilarYonetimi→ Kullanıcı yönetimi
 *   *  ────────────────────────────────────────────────────
 *   *    🔧 Birim filtresi → filtreBirim state
 *   *    🔧 Sütun sırası → sumTh çağrıları
 *   *    🔧 Özet sütun renkleri → stats cells map
 */

/* ── PuantajTablosu ──────────────────────────────────── */
/* 🔧 Hücre düzenleme yetkisi → canEdit(p) fonksiyonu   */
/* 🔧 Satır başına renk → ri%2===0?"#fff":"#fafafa"     */
/* 🔧 Özet sütun sırası → [cal, gM, gnM, faz, zon]     */
/* PUANTAJ TABLOSU
═══════════════════════════════════════════════ */
/* [AÇIKLAMA]: Yönetici ve Sorumluların gördüğü ana Puantaj Tablosu bileşenidir.
 * - Sorumlular sadece kendi birimini görürken, yöneticiler 'Tüm Birimler' filtresini kullanabilir.
 * - Her satırda personelin o ayki nöbet hücreleri (Cell) ve mesai özetleri (statOf) hesaplanarak çizilir.
 * - Ayrıca yazdırma, idari izin ve açıklama notları gibi işlemlerin menüleri bu bileşenin başlığında yer alır. */
function PuantajTablosu({state,update,user,yil,ay}){
  const [filtreBirim,setFiltreBirim]=useState("");
  const personeller=state.personeller||[];const birimler=state.birimler||[];const puantaj=state.puantaj||{};const manuelFazla=state.manuelFazla||{};const cokluBirim=state.cokluBirim||{};const ciftBirimGun=state.ciftBirimGun||{};
  const [editFazla,setEditFazla]=useState(null);
  const [fazlaForm,setFazlaForm]=useState({deger:"",not:""});
  const [takvimP,setTakvimP]=useState(null);
  const [cokluM,setCokluM]=useState(null);
  const [showPrint,setShowPrint]=useState(false);
  const [showImzaAyar,setShowImzaAyar]=useState(false);
  const [showServisAd,setShowServisAd]=useState(false);
  const [ciftGunModal,setCiftGunModal]=useState(null); // personel obj
  const [showCiftBakis,setShowCiftBakis]=useState(false);
  const [showAciklama,setShowAciklama]=useState(false);

  const [aciklamaForm,setAciklamaForm]=useState("");
  const efBirim=user.rol==="sorumlu"?user.birimId:filtreBirim;
  const days=Array.from({length:dim(yil,ay)},(_,i)=>i+1);
  const filtered=getFiltrelenmisPersonel(state, efBirim, yil, ay);
  const pk=pid=>`${pid}_${yil}_${ay}`;
  const setCell=(pid,d,val)=>{
    const k=pk(pid);
    update(s=>{const cur=s.puantaj[k]||{},next={...cur};if(val)next[d]=val;else delete next[d];return{...s,puantaj:{...s.puantaj,[k]:next}};});
  };
  const canEdit=p=>user.rol==="yonetici"||user.birimId===p.birimId;
  const bRenk=id=>{const i=birimler.findIndex(b=>b.id===id);return BRENK[i%BRENK.length]||"#6b7280";};
  const bAd=id=>birimler.find(b=>b.id===id)?.ad||"-";
  const statOf=p=>{
    const row=puantaj[pk(p.id)]||{};
    const mf=manuelFazla[pk(p.id)];
    const cb=cokluBirim[pk(p.id)];
    const stats=calcRow(row,p.unvan,p.calisma,yil,ay,mf?.deger??null,p,state.idariIzinler?.[`${yil}_${ay}`]||[]);
    // Çift birim: manuel gün girişine göre zorunlu saat
    if(p.ciftBirim){
      const cbg=ciftBirimGun[pk(p.id)];
      const zon=cbg?cbg.hesap:0;
      const faz=mf!=null?mf.deger:Math.max(0,stats.cal-zon);
      const gM=p.calisma!=="sut"&&faz>0?Math.min(stats.gece,faz):0;
      return{...stats,zon,faz:p.calisma==="sut"?0:faz,gM,gnM:p.calisma==="sut"?0:Math.max(0,faz-gM)};
    }
    if(cb&&cb.length>0){
      const cbZ=calcCokluZorunlu(p.unvan,p.calisma,cb);
      if(cbZ!=null){
        const faz=mf!=null?mf.deger:Math.max(0,stats.cal-cbZ);
        const gM=p.calisma!=="sut"&&faz>0?Math.min(stats.gece,faz):0;
        return{...stats,zon:cbZ,faz:p.calisma==="sut"?0:faz,gM,gnM:p.calisma==="sut"?0:Math.max(0,faz-gM),coklu:true};
      }
    }
    return stats;
  };
  const sumTh=lbl=>(
    <th style={{padding:"6px 4px",background:"#1e3a5f",color:"#fff",textAlign:"center",minWidth:64,fontSize:10,whiteSpace:"pre-line",lineHeight:1.3,position:"sticky",top:0,zIndex:5}}>{lbl}</th>
  );
  return(
    <div className="print-reset" style={{padding:16,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div>
          <h2 style={{margin:0,fontSize:17,color:"#0f4c81",fontWeight:800}}>{AYLAR[ay]} {yil} Puantajı</h2>
          {user.rol==="sorumlu"&&<span style={{fontSize:12,color:"#6b7280"}}>Birim: {bAd(user.birimId)}</span>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {user.rol==="yonetici"&&(
            <select value={filtreBirim} onChange={e=>setFiltreBirim(e.target.value)} style={{...S.inp,width:170,padding:"6px 8px"}}>
              <option value="">Tüm Birimler</option>
              {birimler.map(b=><option key={b.id} value={b.id}>{b.ad}</option>)}
            </select>
          )}
          {user.rol==="yonetici"&&(
            <button onClick={()=>setShowImzaAyar(true)}
              style={{background:"#f3f4f6",color:"#374151",border:"1px solid #d1d5db",borderRadius:5,padding:"7px 12px",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
              ✍️ İmza Yetkilileri
            </button>
          )}
          {user.rol==="yonetici"&&personeller.some(p=>p.ciftBirim)&&(
            <button onClick={()=>setShowCiftBakis(true)}
              style={{background:"#ede9fe",color:"#3730a3",border:"1px solid #c4b5fd",borderRadius:5,padding:"7px 12px",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
              🔀 Çift Birim Bakış
            </button>
          )}
          {user.rol==="sorumlu"&&(
            <button onClick={()=>setShowServisAd(true)}
              style={{background:state.imzaYetkilileri?.servisSorumluBirim?.[user.birimId]?"#f0fdf4":"#fff7ed",color:state.imzaYetkilileri?.servisSorumluBirim?.[user.birimId]?"#065f46":"#92400e",border:`1px solid ${state.imzaYetkilileri?.servisSorumluBirim?.[user.birimId]?"#86efac":"#fcd34d"}`,borderRadius:5,padding:"7px 12px",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:5}}
              title={state.imzaYetkilileri?.servisSorumluBirim?.[user.birimId]?"İmza adınız: "+state.imzaYetkilileri.servisSorumluBirim[user.birimId]:"İmza adınızı girin"}>
              ✍️ {state.imzaYetkilileri?.servisSorumluBirim?.[user.birimId]?"Adım: "+state.imzaYetkilileri.servisSorumluBirim[user.birimId]:"Servis Sorumlu Adım"}
            </button>
          )}

          {/* [YENİ]: Kullanıcının puantaja özel not ekleyebilmesi için oluşturulan "Açıklamalar" modülü butonu */}
          <button onClick={()=>{
            const pkA=`${efBirim||"genel"}_${yil}_${ay}`;
            setAciklamaForm(state.aciklamalar?.[pkA]||"");
            setShowAciklama(true);
          }}
            style={{background:"#10b981",color:"#fff",border:"none",borderRadius:5,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
            📝 Açıklamalar
          </button>
          <button onClick={()=>setShowPrint(true)}
            style={{background:"#0f4c81",color:"#fff",border:"none",borderRadius:5,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
            🖨️ Yazdır / PDF
          </button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",fontSize:11,padding:"7px 12px",background:"#f9fafb",borderRadius:5,border:"1px solid #e5e7eb",alignItems:"center"}}>
        {[["#e8e8e8","Hafta Sonu"],["#f2f2f2","Arefe (5s)"],["#fff0f0","Bayram/Resmi Tatil"],["#fde8d8","Sendika YKÜ"],["#f3e8ff","Analık İzni"],["#dbeafe","Süt 1.Dönem (3s) — İlk 6 Ay"],["#dcfce7","Süt 2.Dönem (1.5s) — İkinci 6 Ay"]].map(([bg,lbl])=>(
          <span key={lbl} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,background:bg,border:"1px solid #d1d5db",borderRadius:2,display:"inline-block"}}/>{lbl}</span>
        ))}
        <span style={{color:"#7c3aed",fontWeight:600}}>Mor = İzin kodu</span>
      </div>
      <div style={{flex:1,overflow:"auto",borderRadius:7,border:"1px solid #e5e7eb",boxShadow:"0 2px 8px rgba(0,0,0,.07)",minHeight:0}}>
        <table style={{borderCollapse:"collapse",fontSize:11,whiteSpace:"nowrap"}}>
          <thead>
            <tr>
              <th style={{minWidth:155,padding:"8px 10px",background:"#0f4c81",color:"#fff",textAlign:"left",position:"sticky",left:0,zIndex:10,top:0}}>Ad Soyad / Unvan</th>
              {user.rol==="yonetici"&&<th style={{width:76,padding:"6px 4px",background:"#0f4c81",color:"#fff",textAlign:"center",position:"sticky",top:0,zIndex:5}}>Birim</th>}
              {days.map(d=>{
                const {t,n}=dayInfo(yil,ay,d);const dw=dow(yil,ay,d);
                const clr={tatil:"#dc2626",arefe:"#666666",hs:"#555555",is:"#374151"}[t];
                const bg={tatil:"#fff0f0",arefe:"#f2f2f2",hs:"#e8e8e8",is:"#f8fafc"}[t];
                return(
                  <th key={d} title={n||""} style={{background:bg,padding:"2px 0",textAlign:"center",width:54,minWidth:54,borderLeft:"1px solid #e5e7eb",position:"sticky",top:0,zIndex:5}}>
                    <div style={{fontSize:10,fontWeight:800,color:clr}}>{d}</div>
                    <div style={{fontSize:9,color:clr,opacity:.8}}>{GK[dw]}</div>
                  </th>
                );
              })}
              {sumTh("Çalışma\nSaati")}
              {sumTh("Gece\nMesai")}
              {sumTh("Gündüz\nMesai")}
              {sumTh("Bayram\nMesaisi")}
              {sumTh("Fazla\nMesai")}
              {sumTh("Çlş.\nGereken")}
              {user.rol==="yonetici"&&<th style={{padding:"6px 4px",background:"#1e3a5f",color:"#fff",textAlign:"center",minWidth:52,fontSize:10,position:"sticky",top:0,zIndex:5}}>İşlem</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={50} style={{textAlign:"center",padding:28,color:"#9ca3af"}}>{user.rol==="sorumlu"?"Biriminizde henüz personel bulunmuyor":"Personel bulunamadı"}</td></tr>
            ):filtered.map((p,ri)=>{
              const row=puantaj[pk(p.id)]||{};const mf=manuelFazla[pk(p.id)];const cb=cokluBirim[pk(p.id)];
              const stats=statOf(p);const rb=ri%2===0?"#fff":"#fafafa";
              return(
                <tr key={p.id}>
                  <td style={{padding:"5px 10px",position:"sticky",left:0,background:rb,zIndex:2,borderRight:"2px solid #e5e7eb",minWidth:155}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#111827"}}>{p.ad} {p.soyad}</div>
                    <div style={{fontSize:10,color:"#6b7280"}}>{UNVAN_AD[p.unvan]}</div>
                    <div style={{display:"flex",gap:3,marginTop:2,flexWrap:"wrap"}}>
                      <Badge text={CALISMA_AD[p.calisma]} color={p.calisma==="tam"?"#065f46":p.calisma==="yari"?"#1e40af":"#9d174d"} bg={p.calisma==="tam"?"#d1fae5":p.calisma==="yari"?"#dbeafe":"#fce7f3"}/>
                      {cb&&cb.length>0&&<Badge text="Çoklu" color="#92400e" bg="#fef3c7"/>}
                      {mf&&<Badge text="M" color="#92400e" bg="#fff7ed"/>}
                      {p.sendikaYku&&<Badge text={"🔴 "+p.sendikaGun} color="#c2410c" bg="#fff7ed"/>}
                      {p.ciftBirim&&(
                        <button onClick={()=>setCiftGunModal(p)}
                          style={{fontSize:9,padding:"2px 6px",background:ciftBirimGun[pk(p.id)]?"#ede9fe":"#fef3c7",border:`1px solid ${ciftBirimGun[pk(p.id)]?"#a5b4fc":"#fcd34d"}`,borderRadius:4,cursor:"pointer",color:ciftBirimGun[pk(p.id)]?"#3730a3":"#92400e",fontWeight:600}}>
                          🔀 {ciftBirimGun[pk(p.id)]?ciftBirimGun[pk(p.id)].hesap.toFixed(0)+"s":"Gün Gir"}
                        </button>
                      )}
                    </div>
                  </td>
                  {user.rol==="yonetici"&&(
                    <td style={{padding:"4px",textAlign:"center",background:rb}}>
                      {/* [AÇIKLAMA]: Uzun birim adlarının (örn: ANESTEZİ YOĞUN BAKIM) tabloyu sağa doğru genişletmesini önlemek amacıyla;
                          whiteSpace:"normal", display:"inline-block" ve maxWidth:70 eklendi.
                          Böylece kelimeler yan yana sığmadığında otomatik olarak alt satıra geçer. */}
                      <span style={{fontSize:10,padding:"4px 6px",borderRadius:8,background:bRenk(getPersonelBirimId(state,p.id,yil,ay)),color:"#fff",fontWeight:700,display:"inline-block",whiteSpace:"normal",lineHeight:1.2,maxWidth:70}}>{bAd(getPersonelBirimId(state,p.id,yil,ay))}</span>
                    </td>
                  )}
                  {days.map(d=>(
                    <Cell key={d} val={row[d]||""} prevVal={row[d-1]||""} nextVal={row[d+1]||""} dt={dayInfo(yil,ay,d).t} editable={canEdit(p)} unvan={p.unvan} onSave={val=>setCell(p.id,d,val)} sutDon={p.calisma==="sut"?getSutDonemi(p,yil,ay,d):null} sendika={isSendikaGunu(p,yil,ay,d)}/>
                  ))}
                  {[
                    {v:stats.cal,bg:rb,hl:false},
                    {v:stats.gM,bg:stats.gM>0?"#f0fdf4":rb,hl:stats.gM>0},
                    {v:stats.gnM,bg:stats.gnM>0?"#f0fdf4":rb,hl:stats.gnM>0},
                    {v:stats.artMesai||0,bg:(stats.artMesai||0)>0?"#fff7ed":rb,hl:(stats.artMesai||0)>0,color:"#9a3412"},
                    {v:stats.faz,bg:stats.faz>0?"#ecfdf5":rb,hl:stats.faz>0},
                    {v:stats.zon,bg:p.ciftBirim&&!ciftBirimGun[pk(p.id)]?"#fef9c3":"#f8fafc",hl:false,last:true},
                  ].map(({v,bg,hl,last,color},si)=>(
                    <td key={si} style={{padding:"4px 6px",textAlign:"center",background:bg,color:color?color:(hl?"#15803d":last?"#0f4c81":"#374151"),fontWeight:si===3&&v>0?700:si===4&&v>0?700:last?600:500,fontSize:11,minWidth:64,borderLeft:last?"2px solid #93c5fd":"1px solid #e5e7eb",borderRight:last?"2px solid #93c5fd":"none"}}>
                      {last&&p.ciftBirim&&!ciftBirimGun[pk(p.id)]
                        ?<span style={{fontSize:9,color:"#d97706",fontWeight:700}}>⚠️ Gir</span>
                        :<>{v.toFixed(1)}<span style={{fontSize:9,color:"#9ca3af"}}>s</span></>}
                      {p.calisma==="sut"&&si>=1&&si<=2&&<div style={{fontSize:8,color:"#be185d"}}>🍼</div>}
                    </td>
                  ))}
                  {user.rol==="yonetici"&&(
                    <td style={{padding:"4px",textAlign:"center",background:rb,borderLeft:"1px solid #e5e7eb"}}>
                      <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
                        <button title="Manuel Fazla Mesai" onClick={()=>{const k=pk(p.id);const mv=manuelFazla[k];setFazlaForm({deger:mv?.deger!=null?String(mv.deger):"",not:mv?.not||""});setEditFazla({pid:p.id,k});}}
                          style={{fontSize:9,padding:"2px 5px",background:mf?"#fef3c7":"#f3f4f6",border:"1px solid #d1d5db",borderRadius:3,cursor:"pointer",color:mf?"#92400e":"#6b7280"}}>
                          {mf?"✏️M":"✏️FM"}
                        </button>
                        <button title="Çoklu Birim" onClick={()=>setCokluM({pid:p.id,pAd:`${p.ad} ${p.soyad}`,unvan:p.unvan,calisma:p.calisma})}
                          style={{fontSize:9,padding:"2px 5px",background:cb&&cb.length>0?"#fef3c7":"#f3f4f6",border:"1px solid #d1d5db",borderRadius:3,cursor:"pointer",color:cb&&cb.length>0?"#92400e":"#6b7280"}}>
                          🏥ÇB
                        </button>
                        <button title="Takvim" onClick={()=>setTakvimP(p)}
                          style={{fontSize:9,padding:"2px 5px",background:"#f3f4f6",border:"1px solid #d1d5db",borderRadius:3,cursor:"pointer",color:"#374151"}}>
                          📅
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:10,padding:10,background:"#f9fafb",borderRadius:5,border:"1px solid #e5e7eb",fontSize:11}}>
        <strong style={{color:"#374151",display:"block",marginBottom:5}}>İzin Kodları:</strong>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {IZIN_LIST.map(k=>(
            <span key={k} style={{padding:"2px 7px",background:"#ede9fe",color:"#5b21b6",borderRadius:4,fontWeight:600}}>{k} <span style={{fontWeight:400,color:"#6b7280"}}>= {IZIN_AD[k]}</span></span>
          ))}
        </div>
        <div style={{fontSize:10,color:"#9ca3af",marginTop:5}}>Hücreye tıklayın → saat (08-15, 08-14:30, 08:30-14:30, 15:30-08, 08-08) veya izin kodu · Enter kaydet · Escape iptal</div>
      </div>
      {editFazla&&(
        <Modal title="Manuel Fazla Mesai" onClose={()=>setEditFazla(null)} width={360}>
          <p style={{fontSize:13,color:"#6b7280",margin:"0 0 14px"}}>Boş bırakırsanız sistem otomatik hesaplar.</p>
          <Fld label="Fazla Mesai (saat)"><input type="number" style={S.inp} value={fazlaForm.deger} onChange={e=>setFazlaForm(f=>({...f,deger:e.target.value}))} placeholder="Boş = otomatik" step="0.5" min="0"/></Fld>
          <Fld label="Not"><input style={S.inp} value={fazlaForm.not} onChange={e=>setFazlaForm(f=>({...f,not:e.target.value}))} placeholder="Opsiyonel..."/></Fld>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
            <button style={S.btnG} onClick={()=>setEditFazla(null)}>İptal</button>
            <button style={S.btnR} onClick={()=>{update(s=>{const n={...s.manuelFazla};delete n[editFazla.k];return{...s,manuelFazla:n}});setEditFazla(null);}}>Sıfırla</button>
            <button style={S.btn} onClick={()=>{const deger=fazlaForm.deger.trim()===""?null:parseFloat(fazlaForm.deger);update(s=>({...s,manuelFazla:{...s.manuelFazla,[editFazla.k]:deger!=null?{deger,not:fazlaForm.not}:undefined}}));setEditFazla(null);}}>Kaydet</button>
          </div>
        </Modal>
      )}
      {cokluM&&(
        <CokluBirimModal pAd={cokluM.pAd} unvan={cokluM.unvan} calisma={cokluM.calisma} yil={yil} ay={ay} birimler={birimler}
          mevcut={cokluBirim[pk(cokluM.pid)]||[]}
          onSave={data=>{update(s=>({...s,cokluBirim:{...s.cokluBirim,[pk(cokluM.pid)]:data}}));setCokluM(null);}}
          onClose={()=>setCokluM(null)}/>
      )}
      {takvimP&&<TakvimModal p={takvimP} row={puantaj[pk(takvimP.id)]||{}} yil={yil} ay={ay} onClose={()=>setTakvimP(null)}/>}
      {showPrint&&<PrintView state={state} user={user} yil={yil} ay={ay} filtreBirim={filtreBirim} onClose={()=>setShowPrint(false)}/>}
      {ciftGunModal&&(
        <CiftBirimGunModal
          p={ciftGunModal} yil={yil} ay={ay}
          mevcut={ciftBirimGun[pk(ciftGunModal.id)]}
          onSave={veri=>{
            const k=pk(ciftGunModal.id);
            update(s=>{const n={...s.ciftBirimGun};if(veri)n[k]=veri;else delete n[k];return{...s,ciftBirimGun:n};});
          }}
          onClose={()=>setCiftGunModal(null)}
        />
      )}
      {showCiftBakis&&(
        <CiftBirimBakisModal state={state} yil={yil} ay={ay} onClose={()=>setShowCiftBakis(false)}/>
      )}
      {showImzaAyar&&(
        <ImzaAyarlariModal
          mevcut={state.imzaYetkilileri}
          onSave={data=>update(s=>({...s,imzaYetkilileri:data}))}
          onClose={()=>setShowImzaAyar(false)}
        />
      )}
      {showServisAd&&(
        <ServisSorumluModal
          birimId={user.birimId}
          birimAd={state.birimler.find(b=>b.id===user.birimId)?.ad||""}
          mevcut={state.imzaYetkilileri?.servisSorumluBirim?.[user.birimId]||""}
          onSave={ad=>update(s=>({
            ...s,
            imzaYetkilileri:{
              ...s.imzaYetkilileri,
              servisSorumluBirim:{
                ...(s.imzaYetkilileri?.servisSorumluBirim||{}),
                [user.birimId]:ad
              }
            }
          }))}
          onClose={()=>setShowServisAd(false)}
        />
      )}
      {showAciklama&&(
        <Modal title={`${AYLAR[ay]} ${yil} - Açıklamalar / Notlar`} onClose={()=>setShowAciklama(false)} width={480}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:10,lineHeight:1.4}}>
            Bu alana yazdığınız notlar, yazdırma/PDF çıktısı aldığınızda tablonun <strong>en son sayfasında</strong> imza alanının hemen üstünde yer alacaktır. (Örn: X personeli ayın 15'inde işe başladı vs.)
          </div>
          <textarea
             rows={8}
             style={{...S.inp, width:"100%", padding:10, resize:"vertical", boxSizing:"border-box", fontSize:14}}
             value={aciklamaForm}
             onChange={e=>setAciklamaForm(e.target.value)}
             placeholder="Puantaj ile ilgili açıklamaları buraya yazabilirsiniz..."
          />
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
            <button style={S.btnG} onClick={()=>setShowAciklama(false)}>İptal</button>
            <button style={S.btn} onClick={()=>{
              const pkA=`${efBirim||"genel"}_${yil}_${ay}`;
              update(s=>({...s,aciklamalar:{...(s.aciklamalar||{}),[pkA]:aciklamaForm}}));
              setShowAciklama(false);
            }}>Kaydet</button>
          </div>
        </Modal>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════

/* ── PersonelYonetimi ────────────────────────────────── */
/* 🔧 Çalışma türü seçimi → radio butonlar              */
/* 🔧 Süt izni formu → form.calisma==="sut" koşulu      */
/* 🔧 Sendika YKÜ checkbox → sendikaYku state           */
/* PERSONEL YÖNETİMİ
═══════════════════════════════════════════════ */
function PersonelYonetimi({state,update,user,yil,ay}){
  const personeller=state.personeller||[];const birimler=state.birimler||[];
  const isSorumlu=user.rol==="sorumlu";
  const [show,setShow]=useState(false);const [editP,setEditP]=useState(null);
  const [showHavuz,setShowHavuz]=useState(false);
  const blank={ad:"",soyad:"",unvan:"hemsire",calisma:"tam",birimId:isSorumlu?user.birimId:(birimler[0]?.id||""),sutBaslangic:"",gebeligTipi:"YTekil",sendikaYku:false,sendikaGun:"Pazartesi",ciftBirim:false};
  const [form,setForm]=useState(blank);
  const [fUnvan,setFUnvan]=useState("");const [fBirim,setFBirim]=useState(isSorumlu?user.birimId:"");
  const openAdd=()=>{setForm({...blank});setEditP(null);setShow(true);};
  const openEdit=p=>{setForm({ad:p.ad,soyad:p.soyad,unvan:p.unvan,calisma:p.calisma,birimId:p.birimId,sutBaslangic:p.sutBaslangic||"",gebeligTipi:p.gebeligTipi||"YTekil",sendikaYku:p.sendikaYku||false,sendikaGun:p.sendikaGun||"Pazartesi",ciftBirim:p.ciftBirim||false});setEditP(p);setShow(true);};
  const save=()=>{
    if(!form.ad.trim()||!form.soyad.trim()) return alert("Ad ve soyad zorunludur");
    const bid = form.birimId;
    const k = `${bid}_${yil}_${ay}`;
    if(editP) {
      update(s=>({...s,personeller:s.personeller.map(p=>p.id===editP.id?{...p,...form}:p)}));
    } else {
      const nid = "p"+Date.now();
      update(s=>{
        let liste = s.aylikListe?.[k] || s.personeller.filter(p=>p.birimId===bid).map(p=>p.id);
        return {...s, personeller:[...s.personeller,{id:nid,...form}], aylikListe:{...(s.aylikListe||{}), [k]: [...liste, nid]}};
      });
    }
    setShow(false);
  };
  const del=id=>{
    if(!window.confirm("Bu personeli bu ayın listesinden çıkarmak istiyor musunuz? Geçmiş puantajları etkilenmez."))return;
    const ef = isSorumlu ? user.birimId : fBirim;
    if(!ef) return alert("Lütfen önce birim seçiniz!");
    const k = `${ef}_${yil}_${ay}`;
    update(s=>{
      let liste = s.aylikListe?.[k] || s.personeller.filter(p=>p.birimId===ef).map(p=>p.id);
      liste = liste.filter(x => x !== id);
      return {...s, aylikListe:{...(s.aylikListe||{}), [k]:liste}};
    });
  };
  const addToRoster=id=>{
    const ef = isSorumlu ? user.birimId : fBirim;
    if(!ef) return alert("Lütfen önce birim seçiniz!");
    const k = `${ef}_${yil}_${ay}`;
    update(s=>{
      let liste = s.aylikListe?.[k] || s.personeller.filter(p=>p.birimId===ef).map(p=>p.id);
      if(!liste.includes(id)) liste.push(id);
      return {...s, aylikListe:{...(s.aylikListe||{}), [k]:liste}};
    });
    setShowHavuz(false);
  };
  const bAd=id=>birimler.find(b=>b.id===id)?.ad||"-";
  const filtered = getFiltrelenmisPersonel(state, isSorumlu ? user.birimId : fBirim, yil, ay).filter(p=>{
    if(fUnvan&&p.unvan!==fUnvan) return false;
    return true;
  });
  
  const havuz = personeller.filter(p => !filtered.some(f => f.id === p.id));
  return(
    <div style={{padding:20,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <h2 style={{margin:0,fontSize:18,color:"#0f4c81",fontWeight:800}}>{AYLAR[ay]} {yil} Personel Listesi</h2>
          {isSorumlu&&<span style={{fontSize:12,color:"#6b7280"}}>Birim: {bAd(user.birimId)} · Sadece {AYLAR[ay]} ayındaki kendi listenizi yönetebilirsiniz</span>}
        </div>
        <div style={{display:"flex",gap:8}}>
          {(isSorumlu||fBirim)&&<button style={S.btnG} onClick={()=>setShowHavuz(true)}>Sistemden Çek (Havuz)</button>}
          <button style={S.btn} onClick={openAdd}>+ Yeni Personel</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <select value={fUnvan} onChange={e=>setFUnvan(e.target.value)} style={{...S.inp,width:160,padding:"6px 8px"}}>
          <option value="">Tüm Unvanlar</option>
          {Object.entries(UNVAN_AD).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        {!isSorumlu&&(
          <select value={fBirim} onChange={e=>setFBirim(e.target.value)} style={{...S.inp,width:160,padding:"6px 8px"}}>
            <option value="">Tüm Birimler</option>
            {birimler.map(b=><option key={b.id} value={b.id}>{b.ad}</option>)}
          </select>
        )}
        <div style={{marginLeft:"auto",padding:"5px 12px",background:"#f0f9ff",borderRadius:5,fontSize:12,color:"#0369a1",fontWeight:600}}>{filtered.length} personel</div>
      </div>
      <div style={{flex:1,overflow:"auto",borderRadius:7,border:"1px solid #e5e7eb",boxShadow:"0 1px 4px rgba(0,0,0,.06)",minHeight:0}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"#0f4c81",color:"#fff"}}>
              {["Ad Soyad","Unvan","Çalışma Türü","Birim","İşlemler"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,position:"sticky",top:0,zIndex:5}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={5} style={{textAlign:"center",padding:28,color:"#9ca3af"}}>{isSorumlu?"Biriminizde henüz personel bulunmuyor":"Personel bulunamadı"}</td></tr>
            ):filtered.map((p,i)=>(
              <tr key={p.id} style={{background:i%2===0?"#fff":"#fafafa"}}>
                <td style={{padding:"9px 12px",fontWeight:700}}>{p.ad} {p.soyad}</td>
                <td style={{padding:"9px 12px"}}><Badge text={UNVAN_AD[p.unvan]} color="#0f4c81" bg="#dbeafe"/></td>
                <td style={{padding:"9px 12px"}}>
                  <Badge text={CALISMA_AD[p.calisma]} color={p.calisma==="tam"?"#065f46":p.calisma==="yari"?"#1e40af":"#9d174d"} bg={p.calisma==="tam"?"#d1fae5":p.calisma==="yari"?"#dbeafe":"#fce7f3"}/>
                  {p.calisma==="sut"&&p.sutBaslangic&&(()=>{
                    const oz=sutOzet(p);if(!oz)return null;
                    return <div style={{fontSize:10,color:"#7c3aed",marginTop:3}}>🍼 {GEBELIK[p.gebeligTipi||"YTekil"]?.hafta}hf · İzin: {fmtTarih(oz.bas)}</div>;
                  })()}
                  {p.sendikaYku&&<div style={{fontSize:10,color:"#c2410c",marginTop:2,fontWeight:600}}>🔴 Sendika YKÜ · {p.sendikaGun}</div>}
                  {p.ciftBirim&&<div style={{fontSize:10,color:"#3730a3",marginTop:2,fontWeight:600}}>🔀 Çift Birim</div>}
                </td>
                <td style={{padding:"9px 12px"}}><Badge text={bAd(getPersonelBirimId(state,p.id,yil,ay))} color="#fff" bg={BRENK[birimler.findIndex(b=>b.id===getPersonelBirimId(state,p.id,yil,ay))%BRENK.length]}/></td>
                <td style={{padding:"9px 12px"}}>
                  <button style={{...S.btnG,marginRight:6,padding:"5px 10px",fontSize:12}} onClick={()=>openEdit(p)}>✏️ Düzenle</button>
                  <button style={{...S.btnR,padding:"5px 10px",fontSize:12}} onClick={()=>del(p.id)}>❌ Bu Aydan Çıkar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show&&(
        <Modal title={editP?"Personel Düzenle":"Personel Ekle"} onClose={()=>setShow(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Fld label="Ad"><input style={S.inp} value={form.ad} onChange={e=>setForm(f=>({...f,ad:e.target.value}))} autoFocus/></Fld>
            <Fld label="Soyad"><input style={S.inp} value={form.soyad} onChange={e=>setForm(f=>({...f,soyad:e.target.value}))}/></Fld>
          </div>
          <Fld label="Unvan">
            <select style={S.inp} value={form.unvan} onChange={e=>setForm(f=>({...f,unvan:e.target.value}))}>
              {Object.entries(UNVAN_AD).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </Fld>
          <Fld label="Çalışma Türü">
            <div style={{display:"flex",gap:8}}>
              {Object.entries(CALISMA_AD).map(([k,v])=>(
                <label key={k} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px 4px",border:`2px solid ${form.calisma===k?"#0f4c81":"#e5e7eb"}`,borderRadius:6,cursor:"pointer",background:form.calisma===k?"#eff6ff":"#fff"}}>
                  <input type="radio" value={k} checked={form.calisma===k} onChange={()=>setForm(f=>({...f,calisma:k}))} style={{margin:0}}/>
                  <span style={{fontSize:12,fontWeight:form.calisma===k?700:400,color:form.calisma===k?"#0f4c81":"#374151"}}>{v}</span>
                </label>
              ))}
            </div>
          </Fld>
          {form.calisma==="sut"&&(
            <div style={{background:"#fdf4ff",border:"1px solid #e9d5ff",borderRadius:7,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:"#7c3aed",marginBottom:10}}>🍼 Süt İzni Detayları</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                <Fld label="İzne Ayrılış Tarihi">
                  <input type="date" style={S.inp} value={form.sutBaslangic||""} onChange={e=>setForm(f=>({...f,sutBaslangic:e.target.value}))}/>
                </Fld>
                <Fld label="Gebelik Tipi">
                  <select style={S.inp} value={form.gebeligTipi||"YTekil"} onChange={e=>setForm(f=>({...f,gebeligTipi:e.target.value}))}>
                    {Object.entries(GEBELIK).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Fld>
              </div>
              {form.sutBaslangic&&(()=>{
                const oz=sutOzet({sutBaslangic:form.sutBaslangic,gebeligTipi:form.gebeligTipi||"YTekil"});
                if(!oz) return null;
                return(
                  <div style={{fontSize:11,display:"flex",flexDirection:"column",gap:4,marginTop:4}}>
                    <span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,background:"#f3e8ff",border:"1px solid #d8b4fe",borderRadius:2,display:"inline-block"}}/>🟣 Analık İzni: {fmtTarih(oz.bas)} → {fmtTarih(oz.analikBitis)} ({(GEBELIK[form.gebeligTipi||"YTekil"]?.hafta)} hafta)</span>
                    <span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,background:"#dbeafe",border:"1px solid #93c5fd",borderRadius:2,display:"inline-block"}}/>🔵 Süt 1.Dönem (3s): {fmtTarih(oz.analikBitis)} → {fmtTarih(oz.sut1Bitis)}</span>
                    <span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,background:"#dcfce7",border:"1px solid #86efac",borderRadius:2,display:"inline-block"}}/>🟢 Süt 2.Dönem (1.5s): {fmtTarih(oz.sut1Bitis)} → {fmtTarih(oz.sut2Bitis)}</span>
                  </div>
                );
              })()}
            </div>
          )}
          <Fld label="Birim">
            {isSorumlu
              ?<div style={{...S.inp,background:"#f9fafb",color:"#374151",cursor:"not-allowed",border:"1px solid #e5e7eb"}}>{bAd(user.birimId)} <span style={{fontSize:11,color:"#9ca3af"}}>(otomatik)</span></div>
              :<select style={S.inp} value={form.birimId} onChange={e=>setForm(f=>({...f,birimId:e.target.value}))}>{birimler.map(b=><option key={b.id} value={b.id}>{b.ad}</option>)}</select>
            }
          </Fld>
          {/* Sendika YKÜ */}
          <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:7,padding:"12px 14px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:form.sendikaYku?10:0}}>
              <input type="checkbox" id="sendikaChk" checked={form.sendikaYku||false}
                onChange={e=>setForm(f=>({...f,sendikaYku:e.target.checked}))}
                style={{width:16,height:16,cursor:"pointer",accentColor:"#c2410c"}}/>
              <label htmlFor="sendikaChk" style={{fontSize:13,fontWeight:700,color:"#92400e",cursor:"pointer"}}>
                🔴 Sendika YKÜ Üyesi
              </label>
            </div>
            {form.sendikaYku&&(
              <div style={{marginTop:8}}>
                <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Haftalık İzin Günü</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {HAFTAICI_GUNLER.map(g=>(
                    <label key={g} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:`2px solid ${form.sendikaGun===g?"#c2410c":"#e5e7eb"}`,borderRadius:5,cursor:"pointer",background:form.sendikaGun===g?"#fff7ed":"#fff",fontSize:12,fontWeight:form.sendikaGun===g?700:400,color:form.sendikaGun===g?"#c2410c":"#374151"}}>
                      <input type="radio" value={g} checked={form.sendikaGun===g} onChange={()=>setForm(f=>({...f,sendikaGun:g}))} style={{margin:0}}/>
                      {g}
                    </label>
                  ))}
                </div>
                <div style={{fontSize:11,color:"#92400e",marginTop:6,padding:"4px 8px",background:"#fef3c7",borderRadius:4}}>
                  Her <strong>{form.sendikaGun}</strong> → Çlş. Gereken saatten düşülür ({form.unvan==="radyoloji"?7:8}s/gün)
                </div>
              </div>
            )}
          </div>
          {/* Çift Birim */}
          <div style={{background:"#f0f4ff",border:"1px solid #c7d2fe",borderRadius:7,padding:"10px 14px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="checkbox" id="ciftBirimChk" checked={form.ciftBirim||false}
                onChange={e=>setForm(f=>({...f,ciftBirim:e.target.checked}))}
                style={{width:16,height:16,cursor:"pointer",accentColor:"#4f46e5"}}/>
              <label htmlFor="ciftBirimChk" style={{fontSize:13,fontWeight:700,color:"#3730a3",cursor:"pointer"}}>
                🔀 Birden Fazla Birimde Çalışıyor
              </label>
            </div>
            {form.ciftBirim&&(
              <div style={{marginTop:8,fontSize:11,color:"#4f46e5",padding:"6px 10px",background:"#e0e7ff",borderRadius:5,lineHeight:1.5}}>
                Bu personel için puantaj tablosunda <strong>"✏️ Gün Gir"</strong> butonu çıkar.<br/>
                Çalışması gereken saat, girilen hafta içi tam gün ve arefe sayısına göre hesaplanır.
              </div>
            )}
          </div>
          <div style={{padding:"10px 12px",background:"#f0f9ff",borderRadius:5,fontSize:12,color:"#0369a1",marginBottom:12}}>
            <strong>Günlük hedef:</strong> {form.unvan==="radyoloji"?7:8}s{form.calisma==="sut"?" (1,5s süt izni düşülür)":form.calisma==="yari"?" (aylık zorunlu saatin yarısı)":""}<span style={{fontSize:10,color:"#9ca3af",marginLeft:6}}>{form.unvan==="anestezi"?"(Hemşire/Ebe ile aynı)":form.unvan==="radyoloji"?"(Rad.Tekniker)":""}</span>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={S.btnG} onClick={()=>setShow(false)}>İptal</button>
            <button style={S.btn} onClick={save}>Kaydet</button>
          </div>
        </Modal>
      )}
      {showHavuz&&(
        <Modal title="Sistemden Personel Çek (Havuz)" onClose={()=>setShowHavuz(false)} width={600}>
          <div style={{fontSize:13,color:"#4b5563",marginBottom:14}}>
            Hastanede tanımlı olup şu anki filtrelenmiş listenizde olmayan personeller aşağıdadır.<br/>
            Eğer bir personelin tamamen sistemde kayıtlı olmadığını düşünüyorsanız "Yeni Personel" butonunu kullanın.
          </div>
          <div style={{maxHeight:400,overflowY:"auto",border:"1px solid #e5e7eb",borderRadius:5}}>
            {havuz.length===0?<div style={{padding:16,textAlign:"center",color:"#9ca3af",fontSize:13}}>Havuzda eklenecek personel yok.</div>:
              havuz.map(p=>(
                <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:"1px solid #e5e7eb",background:"#f9fafb"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#111827"}}>{p.ad} {p.soyad}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
                      <Badge text={UNVAN_AD[p.unvan]} color="#0f4c81" bg="#dbeafe"/>
                      <span style={{marginLeft:6}}>Kayıtlı Birim: <strong>{bAd(p.birimId)}</strong></span>
                    </div>
                  </div>
                  <button style={{...S.btnGrn,padding:"6px 14px",fontSize:12}} onClick={()=>addToRoster(p.id)}>+ Listeme Ekle</button>
                </div>
              ))
            }
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════

/* ── BirimlerYonetimi ────────────────────────────────── */
/* 🔧 Birim renkler → BRENK[bi%BRENK.length]            */
/* BİRİMLER YÖNETİMİ
═══════════════════════════════════════════════ */
function BirimlerYonetimi({state,update}){
  const birimler=state.birimler||[];const users=state.users||[];const personeller=state.personeller||[];
  const [show,setShow]=useState(false);const [editB,setEditB]=useState(null);const [form,setForm]=useState({ad:""});
  const save=()=>{if(!form.ad.trim())return alert("Birim adı zorunludur");editB?update(s=>({...s,birimler:s.birimler.map(b=>b.id===editB.id?{...b,...form}:b)})):update(s=>({...s,birimler:[...s.birimler,{id:"b"+Date.now(),...form}]}));setShow(false);};
  const del=id=>{if(personeller.some(p=>p.birimId===id))return alert("Bu birimde personel var. Önce personeli taşıyın.");if(!window.confirm("Sil?"))return;update(s=>({...s,birimler:s.birimler.filter(b=>b.id!==id)}));};
  return(
    <div style={{padding:20,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:18,color:"#0f4c81",fontWeight:800}}>Birim Yönetimi</h2>
        <button style={S.btn} onClick={()=>{setForm({ad:""});setEditB(null);setShow(true);}}>+ Birim Ekle</button>
      </div>
      <div style={{flex:1,overflow:"auto",minHeight:0}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
          {birimler.map((b,bi)=>(
            <div key={b.id} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:16,borderTop:`4px solid ${BRENK[bi%BRENK.length]}`,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#111827"}}>{b.ad}</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:6}}>👥 {personeller.filter(p=>p.birimId===b.id).length} personel</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>👤 {users.filter(u=>u.birimId===b.id&&u.rol==="sorumlu").map(u=>u.ad).join(", ")||"Sorumlu atanmamış"}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button style={{...S.btnG,padding:"5px 8px",fontSize:12}} onClick={()=>{setForm({ad:b.ad});setEditB(b);setShow(true);}}>✏️</button>
                  <button style={{...S.btnR,padding:"5px 8px",fontSize:12}} onClick={()=>del(b.id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {show&&(
        <Modal title={editB?"Birim Düzenle":"Birim Ekle"} onClose={()=>setShow(false)} width={340}>
          <Fld label="Birim Adı"><input style={S.inp} value={form.ad} onChange={e=>setForm({ad:e.target.value})} autoFocus onKeyDown={e=>e.key==="Enter"&&save()}/></Fld>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
            <button style={S.btnG} onClick={()=>setShow(false)}>İptal</button>
            <button style={S.btn} onClick={save}>Kaydet</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════

/* ── KullanicilarYonetimi ────────────────────────────── */
/* 🔧 Admin hesabı (u0) silinemez → id==="u0" kontrolü  */
/* KULLANICI YÖNETİMİ
═══════════════════════════════════════════════ */
function KullanicilarYonetimi({state,update}){
  const users=state.users||[];const birimler=state.birimler||[];
  const [show,setShow]=useState(false);const [editU,setEditU]=useState(null);
  const [form,setForm]=useState({ad:"",user:"",pass:"",rol:"sorumlu",birimId:""});
  const save=()=>{
    if(!form.ad.trim()||!form.user.trim()||!form.pass.trim())return alert("Tüm alanlar zorunludur");
    if(!editU&&users.find(u=>u.user===form.user))return alert("Bu kullanıcı adı zaten kullanılıyor");
    editU?update(s=>({...s,users:s.users.map(u=>u.id===editU.id?{...u,...form}:u)})):update(s=>({...s,users:[...s.users,{id:"u"+Date.now(),...form}]}));
    setShow(false);
  };
  const del=id=>{if(id==="u0")return alert("Ana yönetici silinemez");if(!window.confirm("Sil?"))return;update(s=>({...s,users:s.users.filter(u=>u.id!==id)}));};
  return(
    <div style={{padding:20,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:18,color:"#0f4c81",fontWeight:800}}>Kullanıcı Yönetimi</h2>
        <button style={S.btn} onClick={()=>{setForm({ad:"",user:"",pass:"",rol:"sorumlu",birimId:birimler[0]?.id||""});setEditU(null);setShow(true);}}>+ Kullanıcı Ekle</button>
      </div>
      <div style={{flex:1,overflow:"auto",borderRadius:7,border:"1px solid #e5e7eb",boxShadow:"0 1px 4px rgba(0,0,0,.06)",minHeight:0}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:"#0f4c81",color:"#fff"}}>{["Ad Soyad","Kullanıcı Adı","Rol","Birim","İşlemler"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,position:"sticky",top:0,zIndex:5}}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.id} style={{background:i%2===0?"#fff":"#fafafa"}}>
                <td style={{padding:"9px 12px",fontWeight:700}}>{u.ad}</td>
                <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#0f4c81"}}>{u.user}</td>
                <td style={{padding:"9px 12px"}}><Badge text={u.rol==="yonetici"?"👔 Yönetici":"👩‍⚕️ Sorumlu"} color={u.rol==="yonetici"?"#dc2626":"#065f46"} bg={u.rol==="yonetici"?"#fee2e2":"#d1fae5"}/></td>
                <td style={{padding:"9px 12px"}}>{birimler.find(b=>b.id===u.birimId)?.ad||"—"}</td>
                <td style={{padding:"9px 12px"}}>
                  <button style={{...S.btnG,marginRight:6,padding:"5px 10px",fontSize:12}} onClick={()=>{setForm({ad:u.ad,user:u.user,pass:u.pass,rol:u.rol,birimId:u.birimId||""});setEditU(u);setShow(true);}}>✏️ Düzenle</button>
                  {u.id!=="u0"&&<button style={{...S.btnR,padding:"5px 10px",fontSize:12}} onClick={()=>del(u.id)}>🗑 Sil</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show&&(
        <Modal title={editU?"Kullanıcı Düzenle":"Kullanıcı Ekle"} onClose={()=>setShow(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Fld label="Ad Soyad"><input style={S.inp} value={form.ad} onChange={e=>setForm(f=>({...f,ad:e.target.value}))} autoFocus/></Fld>
            <Fld label="Kullanıcı Adı"><input style={S.inp} value={form.user} onChange={e=>setForm(f=>({...f,user:e.target.value}))}/></Fld>
          </div>
          <Fld label="Şifre"><input style={S.inp} value={form.pass} onChange={e=>setForm(f=>({...f,pass:e.target.value}))}/></Fld>
          <Fld label="Rol">
            <div style={{display:"flex",gap:8}}>
              {[["yonetici","👔 Yönetici"],["sorumlu","👩‍⚕️ Sorumlu"]].map(([k,lbl])=>(
                <label key={k} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px 4px",border:`2px solid ${form.rol===k?"#0f4c81":"#e5e7eb"}`,borderRadius:6,cursor:"pointer",background:form.rol===k?"#eff6ff":"#fff"}}>
                  <input type="radio" value={k} checked={form.rol===k} onChange={()=>setForm(f=>({...f,rol:k,birimId:k==="yonetici"?"":f.birimId}))} style={{margin:0}}/>
                  <span style={{fontSize:12,fontWeight:form.rol===k?700:400,color:form.rol===k?"#0f4c81":"#374151"}}>{lbl}</span>
                </label>
              ))}
            </div>
          </Fld>
          {form.rol==="sorumlu"&&(
            <Fld label="Birim">
              <select style={S.inp} value={form.birimId} onChange={e=>setForm(f=>({...f,birimId:e.target.value}))}>
                <option value="">Seçiniz</option>
                {birimler.map(b=><option key={b.id} value={b.id}>{b.ad}</option>)}
              </select>
            </Fld>
          )}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
            <button style={S.btnG} onClick={()=>setShow(false)}>İptal</button>
            <button style={S.btn} onClick={save}>Kaydet</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Mesaj Kutusu ────────────────────────────────────── */
function MesajKutusu({state,update,user}){
  const mesajlar=state.mesajlar||[];
  const birimler=state.birimler||[];
  const [mesajTxt,setMesajTxt]=useState("");
  const [hedefBirim,setHedefBirim]=useState("tumu");

  const gonder=()=>{
    if(!mesajTxt.trim())return alert("Lütfen mesaj girin");
    const yeniMesaj = {
      id:"msg_"+Date.now(),
      gonderenId:user.id,
      gonderenAd:user.ad,
      aliciBirimId:hedefBirim,
      metin:mesajTxt,
      tarih:new Date().toISOString()
    };
    update(s=>({...s,mesajlar:[yeniMesaj, ...(s.mesajlar||[])]}));
    setMesajTxt("");
    alert("Mesaj başarıyla gönderildi!");
  };

  const formatTarih=(iso)=>{
    try{
      const d=new Date(iso);
      return d.toLocaleDateString("tr-TR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
    }catch(e){return iso;}
  };

  const myMessages=user.rol==="yonetici" ? mesajlar : mesajlar.filter(m=>m.aliciBirimId==="tumu" || m.aliciBirimId===user.birimId);

  return(
    <div style={{padding:20,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",height:"100%",boxSizing:"border-box"}}>
      <h2 style={{margin:0,fontSize:18,color:"#0f4c81",fontWeight:800,marginBottom:16}}>✉️ Mesajlar</h2>
      
      {user.rol==="yonetici" && (
        <div style={{background:"#fff",padding:16,borderRadius:8,border:"1px solid #e5e7eb",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
          <h3 style={{marginTop:0,marginBottom:12,fontSize:14,color:"#374151"}}>Yeni Mesaj Gönder</h3>
          <div style={{display:"flex",gap:12,marginBottom:12}}>
            <select style={{...S.inp,width:200}} value={hedefBirim} onChange={e=>setHedefBirim(e.target.value)}>
              <option value="tumu">Tüm Birimler</option>
              {birimler.map(b=><option key={b.id} value={b.id}>{b.ad}</option>)}
            </select>
          </div>
          <textarea style={{...S.inp,minHeight:80,resize:"vertical"}} placeholder="Mesajınızı buraya yazın..." value={mesajTxt} onChange={e=>setMesajTxt(e.target.value)} />
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
            <button style={{...S.btn,padding:"8px 24px"}} onClick={gonder}>Gönder</button>
          </div>
        </div>
      )}

      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        {myMessages.length===0 && (
          <div style={{textAlign:"center",color:"#6b7280",marginTop:40,fontSize:14}}>Henüz bir mesaj bulunmuyor.</div>
        )}
        {myMessages.map(m=>{
          const isGiden=user.rol==="yonetici";
          const bAd=m.aliciBirimId==="tumu"?"Tüm Birimler":birimler.find(b=>b.id===m.aliciBirimId)?.ad||"Silinmiş Birim";
          return(
            <div key={m.id} style={{background:"#fff",borderLeft:isGiden?"4px solid #93c5fd":"4px solid #10b981",padding:14,borderRadius:"0 8px 8px 0",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:isGiden?"#0f4c81":"#065f46"}}>
                  {isGiden ? `Kime: ${bAd}` : `Gönderen: ${m.gonderenAd}`}
                </div>
                <div style={{fontSize:11,color:"#6b7280"}}>{formatTarih(m.tarih)}</div>
              </div>
              <div style={{fontSize:14,color:"#374151",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.metin}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Dashboard (Özet Ekranı) ─────────────────────────── */
function DashboardPaneli({state,user,yil,ay}){
  const [filtreBirim,setFiltreBirim]=useState("");
  const efBirim = user.rol==="sorumlu" ? user.birimId : filtreBirim;
  const filtered = getFiltrelenmisPersonel(state, efBirim, yil, ay);
  const days = Array.from({length:dim(yil,ay)},(_,i)=>i+1);
  const birimler = state.birimler||[];

  const puantaj = state.puantaj||{};
  const manuelFazla = state.manuelFazla||{};
  const cokluBirim = state.cokluBirim||{};
  const ciftBirimGun = state.ciftBirimGun||{};
  const pk = pid => `${pid}_${yil}_${ay}`;

  const statOf = p => {
    const row = puantaj[pk(p.id)] || {};
    const mf = manuelFazla[pk(p.id)];
    const cb = cokluBirim[pk(p.id)];
    const stats = calcRow(row, p.unvan, p.calisma, yil, ay, mf?.deger ?? null, p, state.idariIzinler?.[`${yil}_${ay}`]||[]);
    if (p.ciftBirim) {
      const cbg = ciftBirimGun[pk(p.id)];
      const zon = cbg ? cbg.hesap : 0;
      const faz = mf != null ? mf.deger : Math.max(0, stats.cal - zon);
      return { ...stats, zon, faz: p.calisma === "sut" ? 0 : faz };
    }
    if (cb && cb.length > 0) {
      const cbZ = calcCokluZorunlu(p.unvan, p.calisma, cb);
      if (cbZ != null) {
        const faz = mf != null ? mf.deger : Math.max(0, stats.cal - cbZ);
        return { ...stats, zon: cbZ, faz: p.calisma === "sut" ? 0 : faz };
      }
    }
    return stats;
  };

  let totalYI = 0, totalR = 0, totalDiger = 0;
  let totalCal = 0, totalFaz = 0;
  const personelIzinler = [];
  const fazlaCalisanlar = [];

  filtered.forEach(p => {
    const row = puantaj[pk(p.id)] || {};
    let yi=0, r=0, diger=0;
    
    for(let d=1; d<=days.length; d++){
      const pv = parseVal(row[d]);
      if(pv && pv.type==="izin"){
        if(pv.kod==="Yİ") yi++;
        else if(pv.kod==="R") r++;
        else diger++;
      }
    }
    
    totalYI += yi;
    totalR += r;
    totalDiger += diger;

    if(yi>0 || r>0 || diger>0) {
      personelIzinler.push({ad: p.ad, unvan: p.unvan, birim: birimler.find(b=>b.id===p.birimId)?.ad, yi, r, diger});
    }

    const s = statOf(p);
    totalCal += s.cal;
    totalFaz += s.faz;

    if(s.faz > 0) {
      fazlaCalisanlar.push({ad: p.ad, unvan: p.unvan, birim: birimler.find(b=>b.id===p.birimId)?.ad, cal: s.cal, zon: s.zon, faz: s.faz});
    }
  });

  const ortalamaCal = filtered.length > 0 ? (totalCal / filtered.length).toFixed(1) : 0;
  const ortalamaFaz = filtered.length > 0 ? (totalFaz / filtered.length).toFixed(1) : 0;

  return (
    <div style={{padding:20,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",height:"100%",boxSizing:"border-box",overflow:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8}}>
        <div>
          <h2 style={{margin:0,fontSize:20,color:"#0f4c81",fontWeight:800}}>📊 Dashboard</h2>
          <div style={{fontSize:13,color:"#6b7280",marginTop:4}}>{AYLAR[ay]} {yil} İstatistikleri</div>
        </div>
        {user.rol==="yonetici" && (
          <select value={filtreBirim} onChange={e=>setFiltreBirim(e.target.value)} style={{...S.inp,width:200}}>
            <option value="">Tüm Birimler</option>
            {birimler.map(b=><option key={b.id} value={b.id}>{b.ad}</option>)}
          </select>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16,marginBottom:24}}>
        <div style={{background:"#fff",padding:20,borderRadius:10,boxShadow:"0 2px 6px rgba(0,0,0,.04)",borderLeft:"4px solid #3b82f6",display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:13,color:"#6b7280",fontWeight:600}}>Personel Sayısı</span>
          <span style={{fontSize:28,color:"#1e40af",fontWeight:800,marginTop:6}}>{filtered.length}</span>
        </div>
        <div style={{background:"#fff",padding:20,borderRadius:10,boxShadow:"0 2px 6px rgba(0,0,0,.04)",borderLeft:"4px solid #8b5cf6",display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:13,color:"#6b7280",fontWeight:600}}>Ortalama Çalışma Saati</span>
          <span style={{fontSize:28,color:"#5b21b6",fontWeight:800,marginTop:6}}>{ortalamaCal} Saat</span>
        </div>
        <div style={{background:"#fff",padding:20,borderRadius:10,boxShadow:"0 2px 6px rgba(0,0,0,.04)",borderLeft:"4px solid #f97316",display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:13,color:"#6b7280",fontWeight:600}}>Ortalama Fazla Mesai</span>
          <span style={{fontSize:28,color:"#c2410c",fontWeight:800,marginTop:6}}>{ortalamaFaz} Saat</span>
        </div>
        <div style={{background:"#fff",padding:20,borderRadius:10,boxShadow:"0 2px 6px rgba(0,0,0,.04)",borderLeft:"4px solid #10b981",display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:13,color:"#6b7280",fontWeight:600}}>Toplam Yıllık İzin (Yİ)</span>
          <span style={{fontSize:28,color:"#065f46",fontWeight:800,marginTop:6}}>{totalYI} Gün</span>
        </div>
        <div style={{background:"#fff",padding:20,borderRadius:10,boxShadow:"0 2px 6px rgba(0,0,0,.04)",borderLeft:"4px solid #ef4444",display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:13,color:"#6b7280",fontWeight:600}}>Toplam Rapor (R)</span>
          <span style={{fontSize:28,color:"#991b1b",fontWeight:800,marginTop:6}}>{totalR} Gün</span>
        </div>
        <div style={{background:"#fff",padding:20,borderRadius:10,boxShadow:"0 2px 6px rgba(0,0,0,.04)",borderLeft:"4px solid #f59e0b",display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:13,color:"#6b7280",fontWeight:600}}>Diğer İzinler</span>
          <span style={{fontSize:28,color:"#92400e",fontWeight:800,marginTop:6}}>{totalDiger} Gün</span>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:20}}>
        <div>
          <h3 style={{fontSize:16,color:"#374151",marginBottom:12,fontWeight:700}}>📋 Bu Ay İzin Kullananlar</h3>
          <div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,.06)",overflow:"hidden",border:"1px solid #e5e7eb"}}>
            {personelIzinler.length === 0 ? (
              <div style={{padding:20,textAlign:"center",color:"#6b7280",fontSize:14}}>Bu ay için kayıtlı izin bulunmamaktadır.</div>
            ) : (
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#f8fafc",borderBottom:"1px solid #e5e7eb"}}>
                    <th style={{padding:"12px 16px",textAlign:"left",color:"#475569",fontWeight:600}}>Personel</th>
                    {user.rol==="yonetici" && <th style={{padding:"12px 16px",textAlign:"left",color:"#475569",fontWeight:600}}>Birim</th>}
                    <th style={{padding:"12px 16px",textAlign:"center",color:"#475569",fontWeight:600}}>Yİ</th>
                    <th style={{padding:"12px 16px",textAlign:"center",color:"#475569",fontWeight:600}}>R</th>
                    <th style={{padding:"12px 16px",textAlign:"center",color:"#475569",fontWeight:600}}>Mİ</th>
                  </tr>
                </thead>
                <tbody>
                  {personelIzinler.map((pi,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"10px 16px"}}>
                        <div style={{fontWeight:700,color:"#1e293b"}}>{pi.ad}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{pi.unvan}</div>
                      </td>
                      {user.rol==="yonetici" && <td style={{padding:"10px 16px",color:"#475569"}}>{pi.birim}</td>}
                      <td style={{padding:"10px 16px",textAlign:"center",fontWeight:pi.yi>0?700:400,color:pi.yi>0?"#10b981":"#cbd5e1"}}>{pi.yi || "-"}</td>
                      <td style={{padding:"10px 16px",textAlign:"center",fontWeight:pi.r>0?700:400,color:pi.r>0?"#ef4444":"#cbd5e1"}}>{pi.r || "-"}</td>
                      <td style={{padding:"10px 16px",textAlign:"center",fontWeight:pi.diger>0?700:400,color:pi.diger>0?"#f59e0b":"#cbd5e1"}}>{pi.diger || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h3 style={{fontSize:16,color:"#374151",marginBottom:12,fontWeight:700}}>⏱️ Fazla Mesai Yapanlar</h3>
          <div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,.06)",overflow:"hidden",border:"1px solid #e5e7eb"}}>
            {fazlaCalisanlar.length === 0 ? (
              <div style={{padding:20,textAlign:"center",color:"#6b7280",fontSize:14}}>Fazla mesai yapan personel bulunmamaktadır.</div>
            ) : (
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#f8fafc",borderBottom:"1px solid #e5e7eb"}}>
                    <th style={{padding:"12px 16px",textAlign:"left",color:"#475569",fontWeight:600}}>Personel</th>
                    {user.rol==="yonetici" && <th style={{padding:"12px 16px",textAlign:"left",color:"#475569",fontWeight:600}}>Birim</th>}
                    <th style={{padding:"12px 16px",textAlign:"center",color:"#475569",fontWeight:600}}>Çalışma</th>
                    <th style={{padding:"12px 16px",textAlign:"center",color:"#475569",fontWeight:600}}>Fazla</th>
                  </tr>
                </thead>
                <tbody>
                  {fazlaCalisanlar.sort((a,b)=>b.faz-a.faz).map((fz,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"10px 16px"}}>
                        <div style={{fontWeight:700,color:"#1e293b"}}>{fz.ad}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{fz.unvan}</div>
                      </td>
                      {user.rol==="yonetici" && <td style={{padding:"10px 16px",color:"#475569"}}>{fz.birim}</td>}
                      <td style={{padding:"10px 16px",textAlign:"center",color:"#475569"}}>{fz.cal}</td>
                      <td style={{padding:"10px 16px",textAlign:"center",fontWeight:700,color:"#ea580c"}}>+{fz.faz}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════


/* ╔══════════════════════════════════════════════════════════════╗
 * ║  ⑪  ANA UYGULAMA                                           ║
 * ╚══════════════════════════════════════════════════════════════╝ *
 *  React uygulamasının kök bileşeni.
 *   *  ────────────────────────────────────────────────────
 *   *    useState  → uygulama verisi (state)
 *   *    useEffect → storage'dan yükleme
 *   *    update()  → state + storage güncelleme
 *   *  ────────────────────────────────────────────────────
 *   *    🔧 Storage anahtarı → "nobet_v3"
 *   *    🔧 Yıl değişince → puantaj sekmesine dön
 *   *    🔧 Çıkış yapınca → state sıfırlanmaz, sadece user
 */

/* ANA UYGULAMA
═══════════════════════════════════════════════ */
export default function App(){
  const [state,setState]=useState(INIT);
  const [user,setUser]=useState(null);
  const [tab,setTab]=useState("puantaj");
  const [yil,setYil]=useState(2026);
  const [ay,setAy]=useState(new Date().getMonth()+1);
  const [loading,setLoading]=useState(true);

  const isSorumlu = user?.rol === "sorumlu";
  const myMessages = isSorumlu ? (state.mesajlar||[]).filter(m=>m.aliciBirimId==="tumu" || m.aliciBirimId===user.birimId) : [];
  const sonOkuma = state.sonOkumaZamani?.[user?.id] || "1970-01-01T00:00:00.000Z";
  const unreadCount = myMessages.filter(m => m.gonderenId !== user?.id && m.tarih > sonOkuma).length;

  useEffect(()=>{
    if(tab==="mesajlar" && unreadCount > 0 && user?.id) {
      const now = new Date().toISOString();
      setState(prev=>{
        const next = {...prev, sonOkumaZamani:{...(prev.sonOkumaZamani||{}), [user.id]: now}};
        try{ window.storage.set("nobet_v3",JSON.stringify(next)).catch(()=>{}); }catch(e){}
        try{ localStorage.setItem("nobet_v3",JSON.stringify(next)); }catch(e){}
        return next;
      });
    }
  }, [tab, unreadCount, user?.id]);
  
  // [AÇIKLAMA]: Uygulamanın görünüm (zoom) boyutunu ayarlar ve tarayıcı hafızasında saklar.
  const [appZoom,setAppZoom]=useState(()=>{
    try{ const z=localStorage.getItem("app_zoom"); return z?parseInt(z,10):100; }catch(e){ return 100; }
  });
  
  useEffect(()=>{
    try{ localStorage.setItem("app_zoom", appZoom); }catch(e){}
    document.body.style.zoom = appZoom + "%";
  },[appZoom]);
  /* [AÇIKLAMA]: Uygulama ilk açıldığında LocalStorage veya IndexedDB üzerinden son kaydedilen (offline) veriyi yükler.
   * Bu sayede internet kesilse veya sayfa yenilense bile girilen puantaj verileri kaybolmaz. */
  useEffect(()=>{
    const load=async()=>{
      try{
        let raw=null;
        try{ const r=await window.storage.get("nobet_v3"); if(r?.value) raw=r.value; }
        catch(e){ raw=localStorage.getItem("nobet_v3"); }
        if(raw){
          const loaded=JSON.parse(raw);
          // Eski kayıtlarla uyumluluk için INIT ile birleştir
          setState({
            ...INIT,
            ...loaded,
            imzaYetkilileri:{...INIT.imzaYetkilileri,...(loaded.imzaYetkilileri||{}),servisSorumluBirim:{...(loaded.imzaYetkilileri?.servisSorumluBirim||{})}},
            ciftBirimGun:loaded.ciftBirimGun||{},
            cokluBirim:loaded.cokluBirim||{},
            manuelFazla:loaded.manuelFazla||{},
            puantaj:loaded.puantaj||{},
            aylikListe:loaded.aylikListe||{},
          });
        }
      }catch(e){console.error("Load error:",e);}
      setLoading(false);
    };
    load();
  },[]);
  const update=useCallback(updater=>{
    setState(prev=>{
      const next=typeof updater==="function"?updater(prev):{...prev,...updater};
      try{ window.storage.set("nobet_v3",JSON.stringify(next)).catch(()=>{}); }catch(e){}
      try{ localStorage.setItem("nobet_v3",JSON.stringify(next)); }catch(e){}
      return next;
    });
  },[]);
  if(loading) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f4c81",fontFamily:"system-ui"}}>
      <div style={{color:"#fff",fontSize:18,fontWeight:600,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:28}}>🏥</span> Yükleniyor...</div>
    </div>
  );
  if(!user) return <LoginScreen users={state.users} onLogin={setUser}/>;
  const props={state,update,user,yil,ay};
  return(
    // [YENİ]: 100vh ve flex-direction:column ile sayfanın aşağı doğru taşması ve scroll sırasında tablo başlıklarının verilerle çakışması (overlap) hatası önlendi.
    <div className="print-reset" style={{height:"100vh",background:"#f1f5f9",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <Header user={user} tab={tab} setTab={setTab} yil={yil} ay={ay}
        appZoom={appZoom} setAppZoom={setAppZoom}
        setYil={y=>{setYil(y);setTab("puantaj");}} setAy={m=>{setAy(m);setTab("puantaj");}}
        onLogout={()=>{setUser(null);setTab("puantaj");}}
        onSifreDegistir={(uid,pwd)=>{
          update(s=>({...s,users:s.users.map(u=>u.id===uid?{...u,pass:pwd}:u)}));
          setUser(u=>({...u,pass:pwd}));
        }}
        birimler={state.birimler}
        unreadCount={unreadCount}/>
      <div className="print-reset" style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab==="puantaj"&&<PuantajTablosu {...props}/>}
        {tab==="dashboard"&&<DashboardPaneli {...props}/>}
        {tab==="personel"&&<PersonelYonetimi {...props}/>}
        {tab==="birimler"&&user.rol==="yonetici"&&<BirimlerYonetimi {...props}/>}
        {tab==="kullanicilar"&&user.rol==="yonetici"&&<KullanicilarYonetimi {...props}/>}
        {tab==="mesajlar"&&<MesajKutusu {...props}/>}
      </div>
    </div>
  );
}