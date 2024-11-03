// public/js/auth.js 

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const logoutForm = document.getElementById('logout-form'); 

    // Handle Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : '';
            const csrfToken = document.querySelector('input[name="_csrf"]').value; // Get CSRF token

            // Basic Frontend Validation
            if (confirmPassword && password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters.');
                return;
            }

            try {
                // Create user with Firebase Authentication
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update display name
                await user.updateProfile({ displayName: name });

                // Get ID token
                const idToken = await user.getIdToken();

                // Send idToken and name to server to create a local user record and establish a session
                const response = await fetch('/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken // Include CSRF token in headers
                    },
                    body: JSON.stringify({
                        idToken: idToken,
                        name: name,
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.success);
                    window.location.href = '/auth/login';
                } else {
                    alert(data.error || 'Signup failed.');
                }
            } catch (error) {
                console.error('Error during signup:', error);
                alert(error.message || 'An error occurred during signup.');
            }
        });
    }

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const csrfToken = document.querySelector('input[name="_csrf"]').value; // Get CSRF token

            try {
                // Sign in with Firebase Authentication
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Get ID token
                const idToken = await user.getIdToken();

                // Send the idToken to the server to establish a session
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken // Include CSRF token in headers
                    },
                    body: JSON.stringify({ 
                        idToken: idToken
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.success);
                    window.location.href = '/'; // Redirect to home page after login
                } else {
                    alert(data.error || 'Login failed.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert(error.message || 'An error occurred during login.');
            }
        });
    }

    // Handle Logout (Optional)
    if (logoutForm) {
        logoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                // Get CSRF token from the logout form
                const csrfToken = document.querySelector('input[name="_csrf"]').value;
                // Send a POST request to logout
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    // Sign out from Firebase
                    await firebase.auth().signOut();
                    alert(data.success);
                    window.location.href = '/auth/login';
                } else {
                    alert(data.error || 'Logout failed.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }
});
