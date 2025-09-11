// ===== STORAGE HELPERS =====
function saveUser(user) { localStorage.setItem("user", JSON.stringify(user)); }
function getUser() { return JSON.parse(localStorage.getItem("user")); }
function clearUser() { localStorage.removeItem("user"); }

// ===== NAVBAR =====
function updateNavbar() {
  const navContainer = document.querySelector(".navbar-container");
  if (!navContainer) return;

  fetch("navbar.html")
    .then(res => res.text())
    .then(html => {
      navContainer.innerHTML = html;
      const user = getUser();

      const signInBtn = navContainer.querySelector(".nav-signin");
      const signUpBtn = navContainer.querySelector(".nav-signup");
      const profileLink = navContainer.querySelector(".nav-profile");
      let signOutBtn = navContainer.querySelector(".nav-signout");

      if (user) {
        if (signInBtn) signInBtn.remove();
        if (signUpBtn) signUpBtn.remove();
        if (profileLink) profileLink.style.display = "inline-block";

        if (!signOutBtn) {
          signOutBtn = document.createElement("button");
          signOutBtn.textContent = "Sign Out";
          signOutBtn.className = "nav-signout";
          signOutBtn.style.marginLeft = "10px";
          signOutBtn.onclick = () => {
            clearUser();
            alert("Signed out successfully!");
            updateNavbar();
            window.location.href = "index.html";
          };
          navContainer.appendChild(signOutBtn);
        }
      } else {
        if (signInBtn) signInBtn.style.display = "inline-block";
        if (signUpBtn) signUpBtn.style.display = "inline-block";
        if (profileLink) profileLink.style.display = "none";
        if (signOutBtn) signOutBtn.remove();
      }

      // Homepage CTA
      const ctaSection = document.querySelector(".cta");
      if (ctaSection) {
        if (user) {
          ctaSection.innerHTML = `<p>🌿 Welcome back, <b>${user.name}</b>!</p>`;
        } else {
          ctaSection.innerHTML = `
            <p>✨ Join now to unlock your personal plant health assistant! ✨</p>
            <a href="signup.html" class="btn">Sign Up Free</a>
          `;
        }
      }
    });
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
  handleHomepageButtons();
});

// ===== HOMEPAGE BUTTONS =====
function handleHomepageButtons() {
  const user = getUser();
  const homepageButtons = document.querySelectorAll("main .card button");
  homepageButtons.forEach(btn => {
    if (user) {
      btn.textContent = "Check Out";
      btn.disabled = false;
      const cardTitle = btn.closest(".card").querySelector("h2").textContent;
      if (cardTitle.includes("Dashboard")) btn.onclick = () => window.location.href = "dashboard.html";
      if (cardTitle.includes("Chatbot")) btn.onclick = () => window.location.href = "chatbot.html";
    } else {
      btn.textContent = "Sign in to Access";
      btn.disabled = true;
    }
  });
}

// ===== SIGNUP =====
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("su-name").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const pw = document.getElementById("su-password").value.trim();
    const confirmPw = document.getElementById("su-confirm-password").value.trim();

    if (!name || !email || !pw || !confirmPw) return alert("Fill all fields!");
    if (pw !== confirmPw) return alert("Passwords don’t match!");

    try {
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, pw })
      });
      const data = await res.json();
      if (data.success) {
        alert("Signup successful! Please sign in.");
        window.location.href = "signin.html";
      } else alert("Signup failed: " + data.error);
    } catch {
      alert("Error connecting to server.");
    }
  });
}

// ===== SIGNIN =====
const signinForm = document.getElementById("signin-form");
if (signinForm) {
  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("si-email").value.trim();
    const pw = document.getElementById("si-password").value.trim();

    try {
      const res = await fetch("http://localhost:3000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pw })
      });
      const data = await res.json();
      if (data.success) {
        saveUser(data.user);
        alert("Sign in successful!");
        window.location.href = "profile.html";
      } else alert(data.message || "Invalid email or password.");
    } catch {
      alert("Error connecting to server.");
    }
  });
}

// ===== GOOGLE LOGIN =====
window.handleGoogleCredential = async (response) => {
  try {
    const credential = response.credential;
    const res = await fetch("http://localhost:3000/google-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (data.success) {
      saveUser(data.user);
      alert(`🌿 Welcome, ${data.user.name}!`);
      window.location.href = "index.html";
    } else {
      alert(data.error || "Google sign-in failed.");
    }
  } catch (err) {
    console.error("Google login error:", err);
    alert("Error with Google sign-in.");
  }
};

// ===== AUTH GUARD =====
const authPages = ["profile.html", "dashboard.html", "chatbot.html"];
if (authPages.some(p => window.location.pathname.includes(p))) {
  if (!getUser()) window.location.href = "signin.html";
}

// ===== PROFILE FORM =====
const profileForm = document.getElementById("profile-form");
if (profileForm) {
  const user = getUser();
  if (!user) window.location.href = "signin.html";

  document.getElementById("pf-name").value = user.name;
  document.getElementById("pf-email").value = user.email;

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("pf-name").value.trim();
    const email = document.getElementById("pf-email").value.trim();
    const pw = document.getElementById("pf-password")?.value.trim();
    const avatarFile = document.getElementById("pf-avatar").files[0];

    let avatar = null;
    if (avatarFile) {
      avatar = await fileToBase64(avatarFile);
    }

    const payload = { name, email };
    if (pw) payload.pw = pw;
    if (avatar) payload.avatar = avatar;

    try {
      const res = await fetch("http://localhost:3000/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        saveUser(data.user);
        alert("Profile updated successfully!");
        window.location.reload();
      } else alert("Update failed: " + data.error);
    } catch {
      alert("Error connecting to server.");
    }
  });
}

// ===== HELPER =====
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========== DASHBOARD (PLANTS) ==========
const plantsList = document.getElementById("plants-list");
if (plantsList) {
  const user = getUser();
  if (!user) window.location.href = "signin.html";

  async function loadPlants() {
    try {
      const res = await fetch(`http://localhost:3000/plants/${user.id}`);
      const plants = await res.json();

      plantsList.innerHTML = plants.map(p => `
        <div class="plant-card">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" class="plant-card-img"/>` : ""}
          <h3>${p.name} (${p.species})</h3>
          <p><b>Status:</b> ${p.status}</p>
          <p><b>Disease:</b> ${p.disease}</p>
          <p><b>Description:</b> ${p.description || "N/A"}</p>
          <p><small>Saved: ${p.date}</small></p>
          <button onclick="chatAboutPlant(${p.id})">Chat</button>
          <button onclick="deletePlant(${p.id})">Delete</button>
        </div>
      `).join("");
    } catch {
      plantsList.innerHTML = "<p>Error loading plants.</p>";
    }
  }

  loadPlants();

  window.chatAboutPlant = (id) => {
    localStorage.setItem("chatPlantId", id);
    window.location.href = "chatbot.html";
  };

  window.deletePlant = async (id) => {
    if (!confirm("Delete this plant?")) return;
    await fetch(`http://localhost:3000/plants/${id}`, { method: "DELETE" });
    loadPlants();
  };
}

// ========== CHATBOT ==========
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");

if (chatWindow) {
  const user = getUser();
  if (!user) window.location.href = "signin.html";

  const plantId = localStorage.getItem("chatPlantId");
  if (!plantId) window.location.href = "dashboard.html";

  let chats = [];

  async function loadChats() {
    const res = await fetch(`http://localhost:3000/chats/${plantId}`);
    chats = await res.json();
    renderChats();
  }

  function renderChats() {
    chatWindow.innerHTML = chats.map(c => `
      <div class="chat-msg ${c.sender}">
        <div class="chat-bubble">
          <p>${c.text}</p>
          <small>${c.time}</small>
        </div>
      </div>
    `).join("");
  }

  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-input");
      const text = input.value.trim();
      if (!text) return;

      const chat = {
        plant_id: plantId,
        sender: "user",
        text,
        time: new Date().toLocaleTimeString()
      };

      const res = await fetch("http://localhost:3000/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chat)
      });
      const saved = await res.json();

      chats.push(saved);
      renderChats();
      input.value = "";

      // fake bot reply
      const botReply = {
        plant_id: plantId,
        sender: "bot",
        text: "🤖 (demo) Answer: " + text,
        time: new Date().toLocaleTimeString()
      };
      chats.push(botReply);
      renderChats();
    });
  }

  loadChats();
}
