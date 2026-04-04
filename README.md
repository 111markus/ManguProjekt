# 🎯 AimTrainer 3D

Jõudlusrikas 3D sihtimistreeningu mäng, mis on loodud Reacti, Three.js-i ja A-Frame'i abil. Sobib suurepäraselt sihtimise täpsuse ja reaktsioonikiiruse arendamiseks.

## 🚀 Funktsioonid

- **Interaktiivne 3D mängukeskkond** – kaasahaarav 3D maailm A-Frame'i toel
- **Reaalajas HUD** – skoori, tabamuste, möödalaskude ja taimeri jälgimine
- **Heliefektid** – tabamuste ja ümberlaadimise jaoks loodud heliline tagasiside
- **Edetabeli süsteem** – globaalne tulemuste jälgimine andmebaasi integratsiooniga
- **Seadete menüü** – heli, tundlikkuse ja teiste mänguparameetrite kohandamine
- **Tulemuste salvestamine** – salvesta ja vaata oma mängutulemusi

## 📁 Projekti struktuur

```
ManguProjekt/
├── client/                 # Reacti esiosa
│   ├── src/
│   │   ├── components/     # Reacti komponendid
│   │   │   ├── AimTrainer.js      # Põhimängu komponent
│   │   │   ├── HomePage.js        # Avaleht
│   │   │   └── Leaderboard.js     # Edetabeli vaade
│   │   ├── context/        # Reacti kontekst
│   │   │   └── GameContext.js     # Mängu oleku haldus
│   │   ├── images/         # Pildifailid
│   │   ├── App.js          # Rakenduse põhikomponent
│   │   ├── App.css         # Globaalsed stiilid
│   │   └── index.js        # Sisenemispunkt
│   └── public/             # Staatilised failid
│       └── models/         # 3D mudelid ja helifailid
├── server/                 # Node.js taustarakendus
│   ├── index.js            # Expressi server
│   └── scores.json         # Edetabeli andmed
└── package.json            # Projekti sõltuvused
```

## 🛠️ Tehnoloogiavirn

- **Esiosa**: React, Three.js, A-Frame, CSS3
- **Taust**: Node.js, Express
- **Andmebaas**: JSON (scores.json)
- **Kujundus**: kohandatud CSS klaasimorfismi efektidega
- **3D-graafika**: Three.js ja A-Frame'i objektid

## 📦 Paigaldamine

### Eeltingimused

- Node.js (versioon 14 või uuem)
- npm või yarn

### Seadistamine

1. **Klooni hoidla**

   ```bash
   git clone https://github.com/111markus/ManguProjekt.git
   cd ManguProjekt
   ```

2. **Paigalda juurkausta sõltuvused**

   ```bash
   npm install
   ```

3. **Paigalda kliendirakenduse sõltuvused**

   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Paigalda serveri sõltuvused**
   ```bash
   cd server
   npm install
   cd ..
   ```

## ▶️ Projekti käivitamine

### Arendusrežiimis

1. **Käivita taustaserver**

   ```bash
   npm run server
   ```

   Server käivitub aadressil `http://localhost:5000`

2. **Käivita teises terminalis Reacti rakendus**
   ```bash
   cd client
   npm start
   ```
   Rakendus käivitub aadressil `http://localhost:3000`

### Tootmisversiooni ehitamine

```bash
cd client
npm run build
cd ..
```

## 🎮 Kuidas mängida

1. Sisesta avalehel oma nimi
2. Vali mängu kestus (30 s, 60 s, 90 s või 120 s)
3. Klõpsa nuppu START, et alustada
4. Sihti ja klõpsa 3D keskkonnas olevaid sihtmärke
5. Jälgi oma skoori reaalajas HUD-il
6. Vaata tulemusi mängu lõpu ekraanilt
7. Kontrolli edetabelit, et näha parimaid tulemusi

## 🎛️ Juhtnupud

- **Hiire liigutamine** – sihtimine
- **Hiireklõps** – laskmine
- **ESC** – ava seadete menüü
- **SPACE** – jätka mängu
- **R** – taaskäivita tase

## 📊 Edetabeli funktsioonid

- Vaata mängijate parimaid tulemusi globaalses edetabelis
- Filtreeri tulemusi mängija nime järgi
- Vaata tulemuste kuupäevi ja kellaaegu
- Kustuta isiklikke tulemusi
- Reaalajas uuenevad tulemused

## ⚙️ Seaded

Kohanda mängukogemust:

- **Heli** – lülita heliefektid sisse või välja
- **Tundlikkus** – kohanda sihtimise tundlikkust
- **Sihiku suurus** – muuda sihtimismärgi suurust ja välimust

## 🎨 Kasutajaliidese disain

- Kaasaegne klaasimorfismi efekt
- Tume teema punaste aktsentidega
- Sujuvad animatsioonid ja üleminekud
- Responsiivne paigutus eri ekraanisuurustele

**Head Sihtimist! 🎯**
