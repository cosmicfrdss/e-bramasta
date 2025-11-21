// =========================================
// LOGIN & LOGOUT
// =========================================
const loginForm = document.getElementById("loginForm");
const guestBtn = document.getElementById("guestBtn");
const logoutBtn = document.getElementById("logout"); 

// Logika Session Check Sederhana
const checkLoginStatus = () => {
    const isLoggedIn = localStorage.getItem("loggedIn") === "true";
    const isGuest = localStorage.getItem("guest") === "true";
    const isLoginPage = window.location.pathname.includes('login.html');

    if (isLoggedIn || isGuest) {
        if (isLoginPage) {
            window.location.href = "index.html";
        }
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        if (!isLoginPage) {
            window.location.href = "login.html";
        }
    }
};
checkLoginStatus();


// LOGIKA LOGIN DENGAN EMAIL & PASSWORD (FIREBASE AUTH)
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById("email").value; 
    const passwordInput = document.getElementById("password").value; 
    
    const loginButton = loginForm.querySelector('button[type="submit"]');

    if (typeof firebase !== 'undefined' && firebase.auth) {
        
        loginButton.textContent = "Memproses...";
        loginButton.disabled = true;

        firebase.auth().signInWithEmailAndPassword(emailInput, passwordInput)
            .then((userCredential) => {
                const user = userCredential.user;
                const userName = user.displayName || emailInput.split('@')[0]; 

                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("userName", userName); 
                localStorage.removeItem("guest");
                
                window.location.href = "index.html"; 
            })
            .catch((error) => {
                alert("Login Gagal! Cek Email dan Password Anda. Pesan Error: " + error.message);
                
                loginButton.textContent = "Masuk";
                loginButton.disabled = false;
            });

    } else {
        alert("Sistem autentikasi belum siap. Coba refresh halaman.");
    }
  });
}

// Guest Login Logic
if (guestBtn) {
  guestBtn.addEventListener("click", () => {
    localStorage.setItem("guest", "true");
    localStorage.setItem("userName", "Tamu Angkatan"); 
    localStorage.removeItem("loggedIn");
    
    window.location.href = "index.html";
  });
}

// Logout Logic
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        firebase.auth().signOut().then(() => {
             console.log("Firebase signed out successfully.");
        }).catch((error) => {
             console.error("Error signing out: ", error);
        });
    }

    localStorage.removeItem("loggedIn");
    localStorage.removeItem("guest");
    localStorage.removeItem("userName"); 
    window.location.href = "login.html";
  });
}


// ============================
// RANDOM QUOTES (Tema Bramasta)
// ============================
const quoteEl = document.getElementById("quote");
if (quoteEl) {
  const quotes = [
    "Abhiseva... Jaya, Jaya, Jaya.",
    "Muden",
    "LeleBaik",
  ];
  quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}


// =======================================================
// FIREBASE CONFIGURATION (START)
// =======================================================
const firebaseConfig = {
    apiKey: "AIzaSyD5uf8Vmpodhq2c0KMjXuhahUWNELERoTM", 
    authDomain: "bramasta.firebaseapp.com",
    projectId: "bramasta",
};

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // ============================
    // LOGIKA FORUM.HTML (CHAT REALTIME)
    // ============================
    const forumList = document.getElementById("forumList");
    const sendForumBtn = document.getElementById("sendForum");
    const forumCommentForm = document.getElementById("forumCommentForm"); 
    const forumCollection = db.collection('bramasta_forum'); 
    
    const isGuestUser = localStorage.getItem("guest") === "true";

    if (forumCommentForm) {
        if (isGuestUser) {
            forumCommentForm.style.display = 'none';
            const messageDiv = document.createElement('div');
            messageDiv.className = 'card';
            messageDiv.style.textAlign = 'center';
            messageDiv.innerHTML = '<p style="color: #ffc300;">Anda masuk sebagai **Tamu**. Hanya bisa membaca komentar.</p>';
            
            if (forumList.parentNode) {
                forumList.parentNode.insertBefore(messageDiv, forumList.nextSibling); 
            }
        } else {
            forumCommentForm.style.display = 'block';
        }
    }

    if (forumList) {
        forumCollection.orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
            forumList.innerHTML = ''; 
            
            let docs = [];
            snapshot.docChanges().forEach(change => {
                docs.push(change.doc.data());
            });
            docs.reverse(); 

            docs.forEach(data => {
                const time = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString() : 'Unknown';
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${data.topic || 'Diskusi Umum'} <small style="float: right; font-weight: normal; color: #aaa;">${time}</small></h3>
                    <p><strong>${data.name}:</strong> ${data.message}</p>
                `;
                forumList.appendChild(card);
            });
            forumList.scrollTop = forumList.scrollHeight;
        }, error => {
            console.error("Error setting up forum listener: ", error);
            forumList.innerHTML = '<h2>Error: memuat pesan forum. Cek koneksi Anda.</h2>';
        });
    }

    if (sendForumBtn && !isGuestUser) {
        sendForumBtn.addEventListener("click", () => {
            const name = localStorage.getItem("userName") || "Anggota (Nama Hilang)"; 
            const topic = document.getElementById("topic").value || "Diskusi Umum";
            const message = document.getElementById("message").value.trim();

            if (!message) {
                alert("Pesan tidak boleh kosong!");
                return;
            }

            forumCollection.add({
                name: name,
                topic: topic,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById("message").value = ""; 
            }).catch(error => {
                alert("Gagal mengirim pesan: " + error.message);
            });
        });
    }


} else if (document.getElementById('forumList')) {
    document.getElementById('forumList').innerHTML = '<h2>[Error]: Pastikan CDN SDK Firebase ada di file forum.html.</h2>';
}
// =======================================================
// FIREBASE CONFIGURATION (END)
// =======================================================


// ============================
// SARAN → Kirim ke Email (mailto)
// ============================
const sendSaran = document.getElementById("sendSaran");
if (sendSaran) {
  sendSaran.addEventListener("click", () => {
    const nama = document.getElementById("nama").value || "Anonim";
    const isi = document.getElementById("isi").value.trim();

    if (!isi) {
      alert("Isi semua kolom terlebih dahulu!");
      return;
    }

    const emailTujuan = "cosmicfrdss@gmail.com"; 
    const subject = encodeURIComponent(`Saran dari ${nama} (Bramasta)`);
    const body = encodeURIComponent(isi);
    const mailtoLink = `mailto:${emailTujuan}?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;

    alert(`Terima kasih, ${nama}! Saran Anda telah dikirim.`);
    document.getElementById("isi").value = "";
    document.getElementById("nama").value = "";
  });
}


// ============================
// PWA SERVICE WORKER
// ============================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then(() => {
      console.log("Service Worker registered successfully.");
    }).catch((err) => {
      console.error("Service Worker registration failed: ", err);
    });
  });
}


// ===================================================
// LOGIKA PUSTAKA.HTML (2 KOLOM, TOGGLE & MODAL UPLOAD)
// ===================================================
// Pastikan blok ini selalu di bagian paling bawah
if (window.location.pathname.includes('pustaka.html')) {

    // 1. Ambil semua elemen yang diperlukan
    const artikelBtn = document.getElementById('artikelBtn');
    const bukuBtn = document.getElementById('bukuBtn');
    const searchArea = document.getElementById('pustaka-search-area');
    const bukuContent = document.getElementById('buku-content');
    const uploadBtn = document.getElementById('uploadArtikelBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeBtn = document.querySelector('.close-btn');
    const uploadForm = document.getElementById('uploadForm');
    const artikelList = document.getElementById('artikelList'); 

    if (artikelBtn && bukuBtn && searchArea && bukuContent) {
        
        // Cek Status Login (untuk tombol upload)
        const isLoggedIn = localStorage.getItem("loggedIn") === "true"; 
        const isGuest = localStorage.getItem("guest") === "true"; // Perbaikan: Ambil status Guest

        // Logika Tombol Upload: Muncul jika LoggedIn ATAU Guest (untuk kemudahan testing)
        if (isLoggedIn || isGuest) { 
            if (uploadBtn) {
                uploadBtn.style.display = 'block'; 
            }
        }
        
        // 2. Fungsi Toggle Konten (Buku vs Artikel)
        const toggleContent = (activeBtn, inactiveBtn, activeContent, inactiveContent) => {
            activeBtn.classList.add('active');
            inactiveBtn.classList.remove('active');
            activeContent.style.display = 'block';
            inactiveContent.style.display = 'none';
        };

        artikelBtn.addEventListener('click', () => {
            toggleContent(artikelBtn, bukuBtn, searchArea, bukuContent);
        });

        bukuBtn.addEventListener('click', () => {
            toggleContent(bukuBtn, artikelBtn, bukuContent, searchArea);
        });

        // 3. Logika Pencarian (Placeholder)
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const searchTerm = document.getElementById('searchInput').value;
                alert(`Mencari artikel dengan kata kunci: "${searchTerm}"`);
                // TODO: Hubungkan ke fungsi pencarian Firebase
            });
        }

        // 4. Logika Modal Upload (Non-Firebase)
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                uploadModal.style.display = 'block';
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                uploadModal.style.display = 'none';
            });
        }
        window.addEventListener('click', (event) => {
            if (event.target == uploadModal) {
                uploadModal.style.display = 'none';
            }
        });
    }

    // ==============================================
    // IMPLEMENTASI FIREBASE UNTUK PUSTAKA.HTML (TANPA STORAGE)
    // ==============================================
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        
        const db = firebase.firestore();
        const articlesCollection = db.collection('bramasta_articles');

        // FUNGSI A: MENAMPILKAN ARTIKEL (REALTIME LISTENER)
        const loadArticles = () => {
            articlesCollection.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
                // Hapus contoh artikel statis di HTML
                artikelList.innerHTML = ''; 

                if (snapshot.empty) {
                    artikelList.innerHTML = '<p style="text-align: center; color: #aaa;">Belum ada artikel yang diunggah.</p>';
                    return;
                }

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown';
                    
                    const item = document.createElement('div');
                    item.className = 'artikel-item';
                    item.innerHTML = `
                        <h4> ${data.title}</h4>
                        <p style="font-size: 0.9em; color: #aaa; margin: 5px 0;">${data.author} | ${date}</p>
                        <p>${data.summary}</p>
                        <a href="${data.fileUrl}" target="_blank" class="btn btn-small">Baca Selengkapnya</a>
                    `;
                    artikelList.appendChild(item);
                });
            }, error => {
                console.error("Error loading articles: ", error);
                artikelList.innerHTML = '<p style="text-align: center; color: red;">Error memuat artikel. Cek koneksi Firebase.</p>';
            });
        };

        // Panggil fungsi untuk memuat artikel saat halaman dimuat
        loadArticles(); 


        // FUNGSI B: LOGIKA SUBMIT FORM UPLOAD (MODIFIKASI: MENGGUNAKAN LINK URL MANUAL)
        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const title = document.getElementById('judulArtikel').value;
                const author = document.getElementById('penulisArtikel').value;
                const summary = document.getElementById('ringkasanArtikel').value;
                const fileUrl = document.getElementById('fileUrlArtikel').value; 
                
                // Tampilkan status loading
                document.getElementById('uploadStatus').style.display = 'block';
                document.getElementById('submitArtikelBtn').disabled = true;

                try {
                    // Simpan Metadata ke Firestore
                    await articlesCollection.add({
                        title: title,
                        author: author,
                        summary: summary,
                        fileUrl: fileUrl, 
                        fileName: "External Link", 
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Sukses
                    alert("Artikel berhasil diunggah! Pastikan link file sudah diatur publik.");
                    uploadModal.style.display = 'none';
                    uploadForm.reset();

                } catch (error) {
                    console.error("Error saat mengunggah artikel: ", error);
                    alert("Gagal mengunggah artikel: " + error.message);
                } finally {
                    // Sembunyikan status loading
                    document.getElementById('uploadStatus').style.display = 'none';
                    document.getElementById('submitArtikelBtn').disabled = false;
                }
            });
        }
    } else if (window.location.pathname.includes('pustaka.html')) {
        artikelList.innerHTML = '<h2>[Error Firebase]: Pastikan CDN SDK Firebase (App dan Firestore) ada di file pustaka.html.</h2>';
    }
}
