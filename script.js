    // Firebase Initialization (Existing Config)
    const firebaseConfig = { 
        apiKey: "AIzaSyAh1s75e5uKhyAb0YtlK5zFw9fna9-UyHw", 
        authDomain: "saharaj-paid.firebaseapp.com", 
        databaseURL: "https://saharaj-paid-default-rtdb.firebaseio.com", 
        projectId: "saharaj-paid", 
        storageBucket: "saharaj-paid.firebasestorage.app", 
        appId: "1:39526305282:android:e0562119c2e9a2612ea11b" 
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database(); 
    const auth = firebase.auth();

    let uData = { n: "", b: 0 }; 
    let currentUID = null, hasBet = false, selectedSide = null, betAmount = 0, adminUPI = "";

    // ADMIN SETTINGS SYNC
    db.ref('admin_settings').on('value', snap => { 
        const s = snap.val(); 
        if(s) { 
            adminUPI = s.upi_id; 
            document.getElementById('admin-upi-id').innerText = s.upi_id; 
            document.getElementById('admin-qr-img').src = s.qr_link; 
        } 
    });

    // WITHDRAW FUNCTION (WITH AUTO-DEDUCTION & LIMIT)
    function submitWithdraw() {
        const amt = parseInt(document.getElementById('wit-amount').value);
        const upi = document.getElementById('wit-upi').value;

        if(amt < 100 || amt > 2000) return alert("Withdraw limit is 100 to 2000!");
        if(amt > uData.b) return alert("Insufficient balance!");
        if(!upi) return alert("Please provide payout details!");

        // 1. Balance Deduct from Firebase
        const newBalance = uData.b - amt;
        db.ref('users/' + currentUID).update({ balance: newBalance }).then(() => {
            // 2. Send Details to WhatsApp
            const msg = `Withdraw Request!%0A--------------------%0AUser ID: ${uData.n}%0AAmount: ₹${amt}%0AInfo: ${upi}%0ANew Balance: ₹${newBalance.toFixed(2)}`;
            window.open(`https://wa.me/918100311244?text=${msg}`, '_blank');
            
            alert("Success! Funds deducted and request sent to Admin.");
            closeAllModals();
        }).catch(err => alert("Error: " + err.message));
    }

    // DEPOSIT & MODAL CONTROLS
    function openDepositAmount() { document.getElementById('dep-amount-modal').style.display = 'block'; }
    function proceedToQR() { 
        const amt = document.getElementById('dep-input-amount').value;
        if(amt < 100) return alert("Min Deposit 100 TK");
        document.getElementById('dep-amount-modal').style.display = 'none'; 
        document.getElementById('deposit-modal').style.display = 'block'; 
    }
    function openWithdrawModal() { document.getElementById('withdraw-modal').style.display = 'block'; }
    function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
    function copyUPI() { navigator.clipboard.writeText(adminUPI); alert("UPI ID Copied!"); }

    // GAME LOOP (TIMER & SPIN)
    setInterval(() => {
        const now = new Date(), sec = now.getSeconds(), rem = 60 - sec;
        const timerEl = document.getElementById('timer-display');
        const spinEl = document.getElementById('spin-container');
        document.getElementById('period-display').innerText = `${now.getFullYear()}${now.getMonth()+1}${now.getDate()}${now.getHours()}${now.getMinutes()}`;

        if (rem > 5) { 
            timerEl.style.display = 'block'; spinEl.style.display = 'none'; 
            timerEl.innerText = rem - 5;
            if (rem - 5 <= 10) timerEl.className = "timer-text timer-red"; else timerEl.className = "timer-text timer-blue";
            if (rem - 5 <= 5) { closeAllModals(); document.querySelectorAll('.bet-btn').forEach(b => b.disabled = true); } 
            else if(!hasBet) { document.querySelectorAll('.bet-btn').forEach(b => b.disabled = false); }
        } else { 
            timerEl.style.display = 'none'; spinEl.style.display = 'block'; 
        }
        if (sec === 0) checkResult();
    }, 1000);

    // RESULT CHECKING
    function checkResult() {
        db.ref('game_history').limitToLast(1).once('value', s => {
            s.forEach(c => {
                const res = c.val().result;
                if(hasBet && selectedSide) {
                    const win = selectedSide === res;
                    const winAmt = (betAmount * 1.92).toFixed(2);
                    if(win) db.ref('users/' + currentUID + '/balance').transaction(b => (b || 0) + parseFloat(winAmt));
                    showResultPopup(win, win ? winAmt : betAmount, res);
                }
                resetRound();
            });
        });
    }

    function showResultPopup(w, a, resSide) {
        const p = document.getElementById('result-popup');
        document.getElementById('pop-status').innerText = w ? "WINNER!" : "LOST!";
        document.getElementById('pop-status').style.color = w ? "var(--success)" : "var(--danger)";
        document.getElementById('pop-amount').innerText = w ? "+ ₹" + a : "- ₹" + a;
        document.getElementById('pop-result-side').innerText = "Result: " + resSide;
        p.style.display = 'block'; 
        setTimeout(() => p.style.display = 'none', 6000);
    }

    // BETTING FUNCTIONS
    function openBetSelector(s) { if(hasBet) return; selectedSide = s; document.getElementById('bet-selector').style.display = 'block'; }
    function setChip(a) { document.getElementById('custom-bet-amt').value = a; }
    function confirmBet() { 
        const a = parseFloat(document.getElementById('custom-bet-amt').value); 
        if(a >= 10 && a <= uData.b) { 
            betAmount = a; hasBet = true; 
            db.ref('users/' + currentUID).update({ balance: uData.b - a }); 
            document.getElementById('btn-' + selectedSide).classList.add('active-bet'); 
            document.getElementById('tag-' + selectedSide).innerText = "₹" + a;
            closeAllModals(); 
        } else { alert("Insufficient Balance or Invalid Amount!"); }
    }

    // SYSTEM LOGIC
    function resetRound() { 
        if (currentUID) db.ref('current_bets/' + currentUID).remove(); 
        hasBet = false; selectedSide = null; 
        document.querySelectorAll('.bet-btn').forEach(b => { b.classList.remove('active-bet'); b.disabled = false; }); 
        document.querySelectorAll('.bet-amount-tag').forEach(t => t.innerText = ""); 
        loadHistory(); 
    }

    function login() { 
        const e = document.getElementById('login-email').value, p = document.getElementById('login-pass').value; 
        auth.signInWithEmailAndPassword(e, p).catch(err => alert("Login Failed: " + err.message)); 
    }

    auth.onAuthStateChanged(user => { 
        if (user) { 
            currentUID = user.uid; 
            document.getElementById('auth-section').style.display='none'; 
            document.getElementById('game-interface').style.display='block'; 
            db.ref('users/' + user.uid).on('value', snap => { 
                const v = snap.val(); 
                if(v){ uData.n=v.uid; uData.b=v.balance || 0; document.getElementById('user-balance').innerText = uData.b.toFixed(2); } 
            }); 
            loadHistory(); 
        } else {
            document.getElementById('auth-section').style.display='flex'; 
            document.getElementById('game-interface').style.display='none';
        }
    });

    function loadHistory() { 
        db.ref('game_history').limitToLast(10).once('value', s => { 
            const l = document.getElementById('history-data-list'); l.innerHTML = ""; 
            let items = []; s.forEach(c => items.push(c.val())); 
            items.reverse().forEach(h => { 
                l.innerHTML += `<div class="history-item"><span>${h.period}</span><span style="color:${h.result === 'Big' ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${h.result.toUpperCase()}</span></div>`; 
            }); 
        }); 
    }

    function signOutUser() { if(confirm("Logout?")) auth.signOut().then(() => location.reload()); }
    function sendHelpMessage() { window.open(`https://wa.me/918100311244?text=Support Needed for ID: ${uData.n}`, '_blank'); }
    function closePopup() { document.getElementById('result-popup').style.display = 'none'; }
