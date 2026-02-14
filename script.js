// Firebase configuration (replace with your project details)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Login functionality
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            window.location.href = "dashboard.html"; // Example redirect
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
});

// Forgot Password functionality
document.getElementById('forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    if (email) {
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                alert("Password reset email sent!");
            })
            .catch((error) => {
                alert("Error: " + error.message);
            });
    } else {
        alert("Please enter your email first.");
    }
});

// Register functionality (example: redirect to registration page)
document.getElementById('register').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = "register.html"; // Redirect to registration page
});