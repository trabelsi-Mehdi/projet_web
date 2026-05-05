/* ============================================== */
/* ===== AUTHENTIFICATION (connexion.html) ====== */
/* ============================================== */

function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('actif'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('actif'));
    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('actif');
        document.getElementById('form-login').classList.add('actif');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('actif');
        document.getElementById('form-register').classList.add('actif');
    }
}

function sInscrire() {
    const pseudo = document.getElementById('reg-pseudo').value.trim();
    const email  = document.getElementById('reg-email').value.trim();
    const mdp    = document.getElementById('reg-mdp').value;
    const mdp2   = document.getElementById('reg-mdp2').value;

    if (!pseudo || !email || !mdp || !mdp2) {
        alert('Remplis tous les champs !');
        return;
    }
    if (pseudo.length < 3) {
        alert('Le pseudo doit faire au moins 3 caractères.');
        return;
    }
    if (!email.includes('@')) {
        alert('Adresse email invalide.');
        return;
    }
    if (mdp.length < 6) {
        alert('Le mot de passe doit faire au moins 6 caractères.');
        return;
    }
    if (mdp !== mdp2) {
        alert('Les mots de passe ne correspondent pas.');
        return;
    }

    const comptes = JSON.parse(localStorage.getItem('cs2_comptes') || '{}');

    if (comptes[pseudo]) {
        alert('Ce pseudo est déjà utilisé !');
        return;
    }

    comptes[pseudo] = {
        email: email,
        mdp: mdp,
        parties: Math.floor(Math.random() * 200) + 10,
        wins: Math.floor(Math.random() * 100) + 5,
        kd: (Math.random() * 2 + 0.5).toFixed(2),
        aim_score: 0,
        aim_precision: 0,
        date_inscription: new Date().toLocaleDateString('fr-FR')
    };
    localStorage.setItem('cs2_comptes', JSON.stringify(comptes));

    alert('Compte créé ! Tu peux te connecter.');
    document.getElementById('reg-pseudo').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-mdp').value = '';
    document.getElementById('reg-mdp2').value = '';
    switchTab('login');
}

function seConnecter() {
    const pseudo = document.getElementById('login-pseudo').value.trim();
    const mdp    = document.getElementById('login-mdp').value;

    if (!pseudo || !mdp) {
        alert('Remplis tous les champs !');
        return;
    }

    const comptes = JSON.parse(localStorage.getItem('cs2_comptes') || '{}');

    if (!comptes[pseudo]) {
        alert('Pseudo introuvable. Inscris-toi d\'abord !');
        return;
    }

    if (comptes[pseudo].mdp !== mdp) {
        alert('Mot de passe incorrect !');
        return;
    }

    alert('Connexion réussie ! Bienvenue ' + pseudo + ' 🎯');
    localStorage.setItem('cs2_session', pseudo);
    afficherProfil(pseudo);
}

function afficherProfil(pseudo) {
    const comptes = JSON.parse(localStorage.getItem('cs2_comptes') || '{}');
    const compte = comptes[pseudo];
    if (!compte) return;

    const authBox = document.getElementById('auth-box');
    const profilBox = document.getElementById('profil-box');
    if (!authBox || !profilBox) return;

    authBox.style.display = 'none';
    profilBox.style.display = 'block';
    document.getElementById('profil-avatar').textContent = pseudo[0].toUpperCase();
    document.getElementById('profil-pseudo').textContent = pseudo;
    document.getElementById('profil-email').textContent = compte.email;
    document.getElementById('stat-parties').textContent = compte.parties;
    document.getElementById('stat-wins').textContent = compte.wins;
    document.getElementById('stat-kd').textContent = compte.kd;

    // Affichage du score aim trainer si élément présent
    const statAim = document.getElementById('stat-aim');
    if (statAim) statAim.textContent = compte.aim_score || 0;
}

function seDeconnecter() {
    localStorage.removeItem('cs2_session');
    document.getElementById('auth-box').style.display = 'block';
    document.getElementById('profil-box').style.display = 'none';
    alert('Tu es déconnecté !');
}

/* ============================================== */
/* ============= CONTACT ======================== */
/* ============================================== */

function envoyerMessage() {
    const pseudo  = document.getElementById('pseudo').value.trim();
    const email   = document.getElementById('email').value.trim();
    const sujet   = document.getElementById('sujet').value;
    const message = document.getElementById('message').value.trim();

    if (!pseudo || !email || !sujet || !message) {
        alert('Remplis tous les champs avant d\'envoyer !');
        return;
    }
    if (!email.includes('@')) {
        alert('Adresse email invalide !');
        return;
    }

    const messages = JSON.parse(localStorage.getItem('cs2_messages') || '[]');
    messages.push({
        pseudo: pseudo,
        email: email,
        sujet: sujet,
        message: message,
        date: new Date().toLocaleString('fr-FR')
    });
    localStorage.setItem('cs2_messages', JSON.stringify(messages));

    document.getElementById('pseudo').value = '';
    document.getElementById('email').value = '';
    document.getElementById('sujet').value = '';
    document.getElementById('message').value = '';

    document.getElementById('msg-succes').style.display = 'block';
    setTimeout(() => {
        document.getElementById('msg-succes').style.display = 'none';
    }, 4000);
}

/* ============================================== */
/* ============= MINI-JEU AIM TRAINER =========== */
/* ============================================== */

let jeuActif = false;
let scoreJeu = 0;
let tempsJeu = 30;
let comboJeu = 0;
let comboMax = 0;
let hitsJeu = 0;
let missJeu = 0;
let timerInterval = null;
let spawnInterval = null;

const DUREE_PARTIE = 30;

function demarrerJeu() {
    if (jeuActif) return;

    jeuActif = true;
    scoreJeu = 0;
    tempsJeu = DUREE_PARTIE;
    comboJeu = 0;
    comboMax = 0;
    hitsJeu = 0;
    missJeu = 0;

    document.getElementById('game-overlay').style.display = 'none';
    document.getElementById('game-result').classList.add('hidden');
    nettoyerCibles();
    majAffichageJeu();

    timerInterval = setInterval(() => {
        tempsJeu--;
        document.getElementById('game-time').textContent = tempsJeu;
        if (tempsJeu <= 0) {
            finJeu();
        }
    }, 1000);

    // Spawn rate qui s'accélère avec le temps
    planifierSpawn();

    // Click dans le vide = miss
    const area = document.getElementById('game-area');
    area.addEventListener('mousedown', surClicArea);
}

function planifierSpawn() {
    if (!jeuActif) return;
    spawnerCible();
    // Le spawn s'accélère au fil du temps
    const ratio = (DUREE_PARTIE - tempsJeu) / DUREE_PARTIE;
    const delai = 950 - ratio * 500; // de 950ms à 450ms
    setTimeout(planifierSpawn, delai);
}

function spawnerCible() {
    if (!jeuActif) return;

    const area = document.getElementById('game-area');
    const w = area.clientWidth;
    const h = area.clientHeight;

    // La taille diminue avec le temps (60 -> 35 px)
    const ratio = (DUREE_PARTIE - tempsJeu) / DUREE_PARTIE;
    const taille = Math.max(35, Math.floor(60 - ratio * 25));

    const margeH = 50;
    const x = Math.random() * (w - taille - 20) + 10;
    const y = Math.random() * (h - taille - margeH) + margeH;

    const cible = document.createElement('div');
    cible.className = 'cible';
    cible.style.left = x + 'px';
    cible.style.top = y + 'px';
    cible.style.width = taille + 'px';
    cible.style.height = taille + 'px';

    const tete = document.createElement('div');
    tete.className = 'cible-tete';
    cible.appendChild(tete);

    cible.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        // Si on clique sur la tête : bonus
        if (e.target === tete) {
            ajouterScore(25, 'tete', x + taille/2, y);
        } else {
            ajouterScore(10, 'corps', x + taille/2, y + taille/2);
        }
        cible.remove();
    });

    area.appendChild(cible);

    // Disparition après 2 secondes (1.4s en fin de partie)
    const dureeVie = Math.max(1400, 2200 - ratio * 800);
    setTimeout(() => {
        if (cible.parentNode) {
            cible.remove();
        }
    }, dureeVie);
}

function ajouterScore(pts, type, popX, popY) {
    comboJeu++;
    comboMax = Math.max(comboMax, comboJeu);
    hitsJeu++;
    const mult = 1 + Math.floor(comboJeu / 5) * 0.5;
    const gain = Math.floor(pts * mult);
    scoreJeu += gain;
    afficherPopup('+' + gain + (type === 'tete' ? ' HEADSHOT' : ''), popX, popY, type);
    majAffichageJeu();
}

function surClicArea(e) {
    // Click direct sur la zone de jeu = raté
    if (e.target.id === 'game-area' || e.target === e.currentTarget) {
        comboJeu = 0;
        missJeu++;
        const rect = document.getElementById('game-area').getBoundingClientRect();
        afficherPopup('MISS', e.clientX - rect.left, e.clientY - rect.top, 'miss');
        majAffichageJeu();
    }
}

function afficherPopup(texte, x, y, type) {
    const popup = document.createElement('div');
    popup.className = 'popup-score ' + (type || '');
    popup.textContent = texte;
    popup.style.left = (x - 20) + 'px';
    popup.style.top = (y - 10) + 'px';
    document.getElementById('game-area').appendChild(popup);
    setTimeout(() => popup.remove(), 700);
}

function majAffichageJeu() {
    document.getElementById('game-score').textContent = scoreJeu;
    const mult = 1 + Math.floor(comboJeu / 5) * 0.5;
    document.getElementById('game-combo').textContent = 'x' + mult.toFixed(1);
    const total = hitsJeu + missJeu;
    const precision = total > 0 ? Math.round((hitsJeu / total) * 100) : 0;
    document.getElementById('game-precision').textContent = precision + '%';
}

function nettoyerCibles() {
    document.querySelectorAll('.cible, .popup-score').forEach(c => c.remove());
}

function finJeu() {
    jeuActif = false;
    clearInterval(timerInterval);
    if (spawnInterval) clearInterval(spawnInterval);
    nettoyerCibles();

    const area = document.getElementById('game-area');
    area.removeEventListener('mousedown', surClicArea);

    const total = hitsJeu + missJeu;
    const precision = total > 0 ? Math.round((hitsJeu / total) * 100) : 0;

    document.getElementById('final-score').textContent = scoreJeu;
    document.getElementById('final-precision').textContent = precision + '%';
    document.getElementById('final-combo').textContent = 'x' + comboMax;

    // Sauvegarde du score si connecté
    const session = localStorage.getItem('cs2_session');
    const saveStatus = document.getElementById('save-status');

    if (session) {
        const comptes = JSON.parse(localStorage.getItem('cs2_comptes') || '{}');
        if (comptes[session]) {
            const oldScore = comptes[session].aim_score || 0;
            if (scoreJeu > oldScore) {
                comptes[session].aim_score = scoreJeu;
                comptes[session].aim_precision = precision;
                localStorage.setItem('cs2_comptes', JSON.stringify(comptes));
                saveStatus.className = 'save-status succes';
                saveStatus.innerHTML = '🎯 NOUVEAU RECORD ! Score sauvegardé sur ton compte.';
            } else {
                saveStatus.className = 'save-status info';
                saveStatus.innerHTML = `Pas de record cette fois (meilleur : ${oldScore})`;
            }
        }
    } else {
        saveStatus.className = 'save-status warn';
        saveStatus.innerHTML = '⚠ Connecte-toi pour sauvegarder ton score et apparaître au classement !';
    }

    document.getElementById('game-result').classList.remove('hidden');

    // Scroll vers les résultats
    document.getElementById('game-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function rejouerJeu() {
    document.getElementById('game-result').classList.add('hidden');
    document.getElementById('game-overlay').style.display = 'flex';
}

/* ============================================== */
/* ============= CLASSEMENT ===================== */
/* ============================================== */

let triActuel = 'aim_score';

const TRIS_LABELS = {
    'aim_score': 'Aim Score',
    'wins': 'Victoires',
    'kd':   'K/D Ratio',
    'parties': 'Parties jouées'
};

function changerTri(critere) {
    triActuel = critere;
    document.querySelectorAll('.tri-btn').forEach(b => b.classList.remove('actif'));
    const btn = document.querySelector(`.tri-btn[data-tri="${critere}"]`);
    if (btn) btn.classList.add('actif');
    afficherClassement();
}

function afficherClassement() {
    const comptes = JSON.parse(localStorage.getItem('cs2_comptes') || '{}');
    const session = localStorage.getItem('cs2_session');

    let joueurs = Object.keys(comptes).map(pseudo => ({
        pseudo: pseudo,
        parties: comptes[pseudo].parties || 0,
        wins: comptes[pseudo].wins || 0,
        kd: parseFloat(comptes[pseudo].kd) || 0,
        aim_score: comptes[pseudo].aim_score || 0,
        aim_precision: comptes[pseudo].aim_precision || 0
    }));

    joueurs.sort((a, b) => b[triActuel] - a[triActuel]);

    const podiumDiv = document.getElementById('podium');
    const tableBody = document.getElementById('classement-body');
    const videDiv   = document.getElementById('classement-vide');
    const titreCrit = document.getElementById('critere-actuel');

    if (titreCrit) titreCrit.textContent = TRIS_LABELS[triActuel];

    // Aucun joueur
    if (joueurs.length === 0) {
        if (podiumDiv) podiumDiv.classList.add('hidden');
        if (tableBody) tableBody.innerHTML = '';
        if (videDiv) videDiv.classList.remove('hidden');
        return;
    }

    if (videDiv) videDiv.classList.add('hidden');

    // Podium top 3
    if (podiumDiv) {
        podiumDiv.classList.remove('hidden');
        podiumDiv.innerHTML = '';
        const medailles = ['or', 'argent', 'bronze'];
        const emojis    = ['🥇', '🥈', '🥉'];

        for (let i = 0; i < Math.min(3, joueurs.length); i++) {
            const j = joueurs[i];
            const div = document.createElement('div');
            div.className = 'podium-place ' + medailles[i];
            div.innerHTML = `
                <div class="podium-medaille">${emojis[i]}</div>
                <div class="podium-pseudo">${escapeHTML(j.pseudo)}</div>
                <div class="podium-stat">
                    ${TRIS_LABELS[triActuel]}<br>
                    <span class="podium-stat-val">${formatStat(j[triActuel], triActuel)}</span>
                </div>
            `;
            podiumDiv.appendChild(div);
        }
    }

    // Tableau complet
    if (tableBody) {
        tableBody.innerHTML = '';
        joueurs.forEach((j, idx) => {
            const tr = document.createElement('tr');
            if (j.pseudo === session) tr.className = 'row-actuel';
            tr.innerHTML = `
                <td class="classement-rang">#${idx + 1}</td>
                <td>${escapeHTML(j.pseudo)}${j.pseudo === session ? ' <span class="badge">TOI</span>' : ''}</td>
                <td>${j.parties}</td>
                <td>${j.wins}</td>
                <td>${j.kd.toFixed(2)}</td>
                <td>${j.aim_score}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function formatStat(val, critere) {
    if (critere === 'kd') return val.toFixed(2);
    return val;
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ============================================== */
/* ============= INITIALISATION ================= */
/* ============================================== */

window.addEventListener('load', function() {
    // Reconnexion auto sur la page connexion
    const session = localStorage.getItem('cs2_session');
    if (session && document.getElementById('auth-box')) {
        afficherProfil(session);
    }

    // Affichage auto du classement
    if (document.getElementById('classement-body')) {
        afficherClassement();
    }
});
