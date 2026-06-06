const functions  = require('firebase-functions');
const admin      = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ── EMAIL CONFIG ────────────────────────────────────────────────────
// Set these via:  firebase functions:config:set email.user="restaurant.amfels@web.de" email.pass="DEIN_PASSWORT"
// Then redeploy:  firebase deploy --only functions
const EMAIL_USER = functions.config().email.user;
const EMAIL_PASS = functions.config().email.pass;
const NOTIFY_TO  = 'restaurant.amfels@web.de';
const SITE_URL   = functions.config().site ? functions.config().site.url : 'https://YOUR_GITHUB_PAGES_URL/admin.html';

const transporter = nodemailer.createTransport({
  host: 'smtp.web.de',
  port: 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

// ── TRIGGER: neue Bewerbung in Firestore ─────────────────────────────
exports.onNewApplication = functions
  .region('europe-west1')
  .firestore.document('bewerbungen/{appId}')
  .onCreate(async (snap, context) => {
    const data  = snap.data();
    const appId = context.params.appId;

    const name   = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const area   = data.area === 'kitchen' ? '👨‍🍳 Küche' : '🍷 Service';
    const ts     = new Date().toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

    // Saturday highlight for service
    let satLine = '';
    if (data.area === 'service' && data.service) {
      const satMap = { every: '✅ Ja, jeden Samstag', mostly: '🟡 Ja, meistens', sometimes: '🟠 Nur gelegentlich', no: '🔴 Nein' };
      satLine = `<tr><td><b>Samstag</b></td><td style="font-weight:bold">${satMap[data.service.saturday] || '–'}</td></tr>`;
    }

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:580px;margin:0 auto">
        <div style="background:#4a3230;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:white;margin:0">🆕 Neue Bewerbung eingegangen!</h2>
          <p style="color:rgba(255,255,255,.7);margin:4px 0 0">Restaurant Am Fels – ${ts}</p>
        </div>
        <div style="background:#f5efe8;padding:24px;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse;font-size:15px">
            <tr><td style="padding:6px 0;color:#888;width:140px">Name</td><td><b>${name}</b></td></tr>
            <tr><td style="padding:6px 0;color:#888">Bereich</td><td>${area}</td></tr>
            <tr><td style="padding:6px 0;color:#888">Telefon</td><td>${data.phone || '–'}</td></tr>
            <tr><td style="padding:6px 0;color:#888">E-Mail</td><td>${data.email || '–'}</td></tr>
            <tr><td style="padding:6px 0;color:#888">Eintritt</td><td>${data.startDate || '–'}</td></tr>
            <tr><td style="padding:6px 0;color:#888">Umfang</td><td>${data.workType || '–'}</td></tr>
            ${satLine}
          </table>
          ${data.photoUrl ? `<div style="margin-top:16px"><img src="${data.photoUrl}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #4a3230"></div>` : ''}
          <div style="margin-top:20px">
            <a href="${SITE_URL}#${appId}" style="background:#4a3230;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">
              📋 Vollständige Bewerbung öffnen
            </a>
          </div>
        </div>
      </div>`;

    // Send email
    await transporter.sendMail({
      from:    `"Am Fels Bewerbungen" <${EMAIL_USER}>`,
      to:      NOTIFY_TO,
      subject: `🆕 Neue Bewerbung: ${name} (${data.area === 'kitchen' ? 'Küche' : 'Service'})`,
      html:    htmlBody
    });

    // Push notification to all subscribed admin tokens
    try {
      const tokensSnap = await admin.firestore().collection('fcmTokens').get();
      const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
      if (tokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: `🆕 Neue Bewerbung: ${name}`,
            body:  `${area} · ${data.phone || ''}`
          },
          webpush: {
            notification: { icon: '/logo.png', badge: '/logo.png' },
            fcmOptions: { link: `${SITE_URL}#${appId}` }
          }
        });
      }
    } catch (e) {
      console.log('Push failed:', e.message);
    }

    console.log(`Notification sent for application ${appId} by ${name}`);
    return null;
  });
