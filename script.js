// ==========================================
// ARMY SAHARAJ - COMPLETE PLAYER ENGINE
// ==========================================

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAh1s75e5uKhyAb0YtlK5zFw9fna9-UyHw",
    authDomain: "saharaj-paid.firebaseapp.com",
    databaseURL: "https://saharaj-paid-default-rtdb.firebaseio.com",
    projectId: "saharaj-paid",
    storageBucket: "saharaj-paid.firebasestorage.app",
    appId: "1:39526305282:android:e0562119c2e9a2612ea11b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

let currentUID = null;
let selectedType = "";

// 2. Navigation Control (Switch between Login, Register, Forget)
function showCard(name) {
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('register-card').classList.add('hidden');
    document.getElementById('forget-card').classList.add('hidden');
    document.getElementById(name + '-card').classList.remove('hidden');
}

// 3. Auth Actions (Login, Register, Forget Password)
function login() {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    if(!e || !p) return alert("Please fill all fields");
    auth.signInWithEmailAndPassword(e, p).catch(err => alert(err.message));
}

function register() {
    const uid = document.getElementById('reg-uid').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    if(!uid || !email || !pass) return alert("Please fill all fields");

    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        // Create user profile in Database linked with Admin Controller
        db.ref('users/' + res.user.uid).set({
            uid: uid,
            email: email,
            balance: 0,
            isBanned: false,
            createdAt: Date.now()
        });
        alert("Account Created Successfully!");
    }).catch(err => alert(err.message));
}

function forgetPassword() {
    const email = document.getElementById('forget-email').value;
    if(!email) return alert("Enter your email");
    auth.sendPasswordResetEmail(email).then(() => {
        alert("Password reset link sent to your email!");
        showCard('login');
    }).catch(err => alert(err.message));
}

// 4. Session & Security Sync (Real-time with Admin)
auth.onAuthStateChanged(user => {
    if (user) {
        currentUID = user.uid;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('game-interface').style.display = 'block';
        
        // Watch Balance & Ban Status (Synced with Admin Panel)
        db.ref('users/' + user.uid).on('value', snap => {
            const d = snap.val();
            if(d) {
                if(d.isBanned) { 
                    alert("Your account is BANNED by Admin!"); 
                    auth.signOut(); 
                }
                document.getElementById('user-balance').innerText = d.balance.toFixed(2);
            }
        });
        loadHistory();
    } else {
        document.getElementById('auth-section').style.display = 'flex';
        document.getElementById('game-interface').style.display = 'none';
        showCard('login');
    }
});

// 5. High-Speed Timer Engine
setInterval(() => {
    const now = new Date();
    const sec = now.getSeconds();
    const pId = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
    
    document.getElementById('timer-display').innerText = `00:${(60-sec).toString().padStart(2, '0')}`;
    document.getElementById('period-display').innerText = pId;

    // Refresh history immediately at 00 second
    if (sec === 0) loadHistory();
}, 1000);

// 6. Betting Actions (Linked to Admin Anti-Loss Engine)
function openBet(type) { 
    selectedType = type; 
    document.getElementById('modal-title').innerText = "Join " + type; 
    document.getElementById('bet-modal').style.display = 'block'; 
}

function closeModal() { 
    document.getElementById('bet-modal').style.display = 'none'; 
    document.getElementById('bet-amount').value = "";
}

function confirmOrder() {
    const amt = parseFloat(document.getElementById('bet-amount').value);
    if(!amt || amt < 10) return alert("Minimum bet is ₹10");

    db.ref('users/' + currentUID).once('value', s => {
        const bal = s.val().balance || 0;
        if(bal < amt) return alert("Insufficient Wallet Balance!");

        // Deduct from Player Wallet
        db.ref('users/' + currentUID).update({ balance: bal - amt });
        
        // Update Live Pool for Admin Control
        db.ref('live_bets/' + selectedType).transaction(c => (c || 0) + amt);
        
        alert("Order Placed on " + selectedType);
        closeModal();
    });
}

// 7. Record History Loader (Last 10 Records)
function loadHistory() {
    db.ref('game_history').limitToLast(10).on('value', snap => {
        const list = document.getElementById('history-list');
        list.innerHTML = "";
        let data = [];
        snap.forEach(c => data.push(c.val()));
        
        // Reverse to show latest result on top
        data.reverse().forEach(h => {
            list.innerHTML += `
                <div class="history-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #334155;">
                    <span>${h.period}</span>
                    <span style="font-weight:bold; color:${h.result === 'Big' ? '#10b981' : '#ef4444'}">${h.result}</span>
                </div>`;
        });
    });
}
