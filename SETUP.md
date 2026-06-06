# Am Fels – Bewerbungs-App Setup

## 1. Firebase-Projekt einrichten

1. Gehe zu https://console.firebase.google.com
2. Neues Projekt erstellen (oder bestehendes nutzen)
3. **Firestore Database** aktivieren → "Production mode"
4. **Storage** aktivieren
5. **Authentication** → E-Mail/Passwort aktivieren
6. Einen Admin-User anlegen: Authentication → "Add user" → `restaurant.amfels@web.de` + Passwort

## 2. Firebase-Config eintragen

In **`index.html`** und **`admin.html`** den Block ersetzen:

```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "DEIN_PROJEKT.firebaseapp.com",
  projectId:         "DEIN_PROJEKT_ID",
  storageBucket:     "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "...",
  appId:             "..."
};
```

Die Werte findest du in Firebase Console → Projekteinstellungen → Deine Apps → Web-App.

## 3. GitHub Pages deployen

```bash
cd /Users/leonrajic/Desktop/amfels-bewerbung
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Amfels98/amfels-bewerbung.git
git push -u origin main
```

Dann in GitHub → Settings → Pages → Branch: main → / (root) → Save.

Die App ist dann erreichbar unter: `https://amfels98.github.io/amfels-bewerbung/`

## 4. Cloud Functions deployen (E-Mail + Push)

```bash
npm install -g firebase-tools
firebase login
firebase use DEIN_PROJEKT_ID

# E-Mail-Passwort setzen (web.de SMTP)
firebase functions:config:set email.user="restaurant.amfels@web.de" email.pass="DEIN_PASSWORT"
firebase functions:config:set site.url="https://amfels98.github.io/amfels-bewerbung/admin.html"

cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules,storage
```

## 5. Admin-Dashboard

Öffne: `https://amfels98.github.io/amfels-bewerbung/admin.html`

Login mit: `restaurant.amfels@web.de` + Passwort aus Schritt 1

## Zusammenfassung

| Feature | Status |
|---|---|
| Zweisprachiges Formular (DE/HR) | ✅ |
| Küche / Service Auswahl | ✅ |
| 6-stufiges Formular mit Fortschrittsanzeige | ✅ |
| Foto-Upload mit Komprimierung | ✅ |
| Lebenslauf-Upload (optional, PDF) | ✅ |
| DSGVO-Checkbox | ✅ |
| Firebase Firestore Backend | ✅ |
| Firebase Storage (Fotos + CVs) | ✅ |
| Sofort-E-Mail bei neuer Bewerbung | ✅ (nach Cloud Function Deploy) |
| Web-Push-Benachrichtigung | ✅ (nach Cloud Function Deploy) |
| Admin Dashboard | ✅ |
| Filter nach Bereich / Status | ✅ |
| Samstag-Verfügbarkeit farblich | ✅ |
| Status setzen (Neu/Interessant/...) | ✅ |
| PDF-Export | ✅ |
| PWA (installierbar) | ✅ |
| Firestore Security Rules | ✅ |
