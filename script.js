let currentUser = null, balance = 0, myBet = { active: false }, isLocked = false;
let bigPool = 0, smallPool = 0, adminMonitorInterval;

// --- 🧠 Anti-Loss & Result System ---
function processResult() {
    // Anti-Loss: যেদিকে কম টাকা, সেদিক উইন
    let win = bigPool <= smallPool ? "BIG" : "SMALL";
    
    if(myBet.active && myBet.side === win) {
        balance += myBet.amt * 1.95;
    }
    
    // রিসেট এবং ইন্টারফেস আপডেট
    document.getElementById('bet-display-big').innerText = "";
    document.getElementById('bet-display-small').innerText = "";
    myBet = { active: false };
    updateUI();
    document.getElementById('bet-panel').classList.remove('full-lock');
}

// --- 👑 Admin Functions ---
function openAdmin() {
    const pass = prompt("Enter Master Password:");
    if(pass === "SAHARAJ8100") {
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadAdminData();
        adminMonitorInterval = setInterval(() => {
            document.getElementById('admin-live-big').innerText = "₹" + Math.floor(bigPool);
            document.getElementById('admin-live-small').innerText = "₹" + Math.floor(smallPool);
        }, 1000);
    }
}

function showUserDetails(key) {
    let userData = JSON.parse(localStorage.getItem(key));
    selectedUserKey = key;
    document.getElementById('admin-user-list-view').style.display = 'none';
    document.getElementById('user-detail-modal').style.display = 'block';
    document.getElementById('detail-uid').innerText = "UID: " + userData.uid;
    document.getElementById('detail-balance').innerText = "₹" + userData.balance.toFixed(2);
    
    // লোড ট্রানজাকশন হিস্ট্রি
    let txData = JSON.parse(localStorage.getItem('tx_' + userData.phone)) || [];
    let histDiv = document.getElementById('detail-tx-history');
    histDiv.innerHTML = txData.map(t => `<p>${t.type}: ₹${t.amt} (${t.date})</p>`).join('');
}

function editUserBalanceFromDetail() {
    let userData = JSON.parse(localStorage.getItem(selectedUserKey));
    let newAmt = prompt("Set New Balance for " + userData.phone, userData.balance);
    if(newAmt) {
        userData.balance = parseFloat(newAmt);
        localStorage.setItem(selectedUserKey, JSON.stringify(userData));
        showUserDetails(selectedUserKey);
        alert("Balance Updated!");
    }
}
