// ========== STORAGE HELPERS ==========
function loadData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ========== NAVBAR INJECTION ==========
document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.querySelector(".navbar-container");
  const user = JSON.parse(localStorage.getItem("user"));

  if (navContainer) {
    fetch("navbar.html")
      .then(res => res.text())
      .then(html => {
        navContainer.innerHTML = html;

        // Select buttons
        const signInBtn = navContainer.querySelector(".nav-signin");
        const signUpBtn = navContainer.querySelector(".nav-signup");
        let signOutBtn = navContainer.querySelector(".nav-signout");

        if (user) {
          // Remove Sign In / Sign Up completely
          if (signInBtn) signInBtn.remove();
          if (signUpBtn) signUpBtn.remove();

          // Add Sign Out if not already present
          if (!signOutBtn) {
            signOutBtn = document.createElement("button");
            signOutBtn.textContent = "Sign Out";
            signOutBtn.className = "nav-signout";
            signOutBtn.style.marginLeft = "10px";
            signOutBtn.onclick = () => {
              localStorage.removeItem("user");
              alert("Signed out successfully!");
              window.location.href = "index.html";
            };
            navContainer.appendChild(signOutBtn);
          }
        } else {
          // Visitor: Remove Sign Out if exists
          if (signOutBtn) signOutBtn.remove();

          // Ensure Sign In / Sign Up are visible
          if (signInBtn) signInBtn.style.display = "inline-block";
          if (signUpBtn) signUpBtn.style.display = "inline-block";
        }
      });
  }

  // ========== HOMEPAGE BUTTONS ==========
  const homepageButtons = document.querySelectorAll("main .card button");
  homepageButtons.forEach(btn => {
    if (user) {
      if (btn.disabled) {
        btn.textContent = "Check Out";
        btn.disabled = false;
        btn.removeAttribute("aria-disabled");
        const cardTitle = btn.closest(".card").querySelector("h2").textContent;
        if (cardTitle.includes("Dashboard")) btn.onclick = () => window.location.href = "dashboard.html";
        if (cardTitle.includes("Chatbot")) btn.onclick = () => window.location.href = "chatbot.html";
      }
    } else {
      btn.textContent = "Sign in to Access";
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    }
  });
});


// ========== DEMO GOOGLE SIGN-IN ==========
function googleSignInDemo() {
  const demoUser = {
    name: "Google User",
    email: "googleuser@example.com",
    pw: "google-demo",
    avatar: "./assets/google-user.png"
  };
  localStorage.setItem("user", JSON.stringify(demoUser));
  alert("Signed in with Google (Demo)!");
  window.location.href = "profile.html";
}

// Add Google sign-in button dynamically
["signup-form", "signin-form"].forEach(formId => {
  const form = document.getElementById(formId);
  if (form) {
    const googleBtn = document.createElement("button");
    googleBtn.type = "button";
    googleBtn.textContent = "Sign in with Google (Demo)";
    googleBtn.className = "google-btn";
    googleBtn.style.marginBottom = "10px";
    googleBtn.onclick = googleSignInDemo;
    form.insertBefore(googleBtn, form.firstChild);
  }
});

// ========== AUTH SYSTEM ==========
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("su-name").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const pw = document.getElementById("su-password").value.trim();
    const confirmPw = document.getElementById("su-confirm-password").value.trim();

    if (!name || !email || !pw || !confirmPw) return alert("Fill all fields!");
    if (pw !== confirmPw) return alert("Passwords don’t match!");

    const user = { name, email, pw, avatar: "./assets/plants.png" };
    localStorage.setItem("user", JSON.stringify(user));
    alert("Signup successful! Please sign in.");
    window.location.href = "signin.html";
  });
}

const signinForm = document.getElementById("signin-form");
if (signinForm) {
  signinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("si-email").value.trim();
    const pw = document.getElementById("si-password").value.trim();

    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.email === email && user.pw === pw) {
      alert("Sign in successful!");
      window.location.href = "profile.html";
    } else {
      alert("Invalid email or password.");
    }
  });
}

// ========== AUTH GUARD ==========
const authRequiredPages = ["profile.html", "dashboard.html", "chatbot.html", "changeemailorpw.html"];
if (authRequiredPages.some(page => window.location.pathname.includes(page))) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) window.location.href = "signin.html";
}

// ========== PROFILE ==========
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileAvatar = document.getElementById("profile-avatar");
if (profileName && profileEmail) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    profileName.textContent = user.name;
    profileEmail.textContent = user.email;
    profileAvatar.src = user.avatar || "./assets/plants.png";
  }
}

// Populate per-plant history in profile
const profilePlants = document.getElementById("profile-plants");
if (profilePlants) {
  const plants = loadData("savedPlants");
  profilePlants.innerHTML = plants.map((p, i) => `
    <div class="plant-card">
      ${p.image ? `<img src="${p.image}" alt="${p.name}" class="plant-card-img" />` : ""}
      <h3>${p.name} (${p.species})</h3>
      <p><b>Status:</b> ${p.status}</p>
      <p><b>Disease/Deficiency:</b> ${p.disease}</p>
      <p><b>Description:</b> ${p.description || "N/A"}</p>
      <p><small>Saved: ${p.date}</small></p>
      <button onclick="chatAboutPlant(${i})">Chat about this plant</button>
    </div>
  `).join("");
}


const profileForm = document.getElementById("profile-form");
if (profileForm) {
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const newName = document.getElementById("pf-name").value.trim();
    const newEmail = document.getElementById("pf-email").value.trim();
    const avatarFile = document.getElementById("pf-avatar").files[0];

    if (newName) user.name = newName;
    if (newEmail) user.email = newEmail;

    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = () => {
        user.avatar = reader.result;
        localStorage.setItem("user", JSON.stringify(user));
        location.reload();
      };
      reader.readAsDataURL(avatarFile);
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    location.reload();
  });
}

// ========== CHANGE EMAIL / PASSWORD ==========
const changeForm = document.getElementById("change-form");
if (changeForm) {
  changeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newEmail = document.getElementById("new-email").value.trim();
    const newPw = document.getElementById("new-password").value.trim();
    const confirmPw = document.getElementById("confirm-password").value.trim();

    let user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    if (newEmail) user.email = newEmail;
    if (newPw) {
      if (newPw !== confirmPw) return alert("Passwords don’t match!");
      user.pw = newPw;
    }

    localStorage.setItem("user", JSON.stringify(user));
    alert("Updated successfully!");
    window.location.href = "profile.html";
  });
}

// ========== PLANT SCANNER ==========
const scannerStart = document.getElementById("scanner-start");
const scannerCapture = document.getElementById("scanner-capture");
const scannerPreview = document.getElementById("scanner-preview");
const scannerAnalyze = document.getElementById("scanner-analyze");
const scannerResult = document.getElementById("scanner-result");
const scannerUpload = document.getElementById("scanner-upload"); // input[type=file]

let stream;
let capturedImage = null; // store captured frame

if (scannerStart) {
  scannerStart.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      scannerPreview.srcObject = stream;
      scannerPreview.style.display = "block";
      scannerPreview.play();
      scannerCapture.style.display = "inline-block";
    } catch {
      alert("Camera not available.");
    }
  });
}

// Capture frame from live video
if (scannerCapture) {
  scannerCapture.addEventListener("click", () => {
    if (!scannerPreview.srcObject) return alert("Start camera first!");
    const canvas = document.createElement("canvas");
    canvas.width = scannerPreview.videoWidth;
    canvas.height = scannerPreview.videoHeight;
    canvas.getContext("2d").drawImage(scannerPreview, 0, 0);
    capturedImage = canvas.toDataURL("image/png");
    scannerPreview.style.display = "none";
    scannerCapture.style.display = "none";

    // Stop camera stream
    stream.getTracks().forEach(track => track.stop());
    alert("Image captured! You can now analyze.");
  });
}

if (scannerAnalyze) {
  scannerAnalyze.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const desc = document.getElementById("scanner-desc")?.value || "";
    const uploadedFile = scannerUpload?.files[0];

    if (!user) return alert("Sign in to save results.");

    // Ensure either captured image or uploaded image exists
    if (!capturedImage && !uploadedFile) return alert("Please provide an image (capture or upload).");

    // Determine final image
    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        savePlantResult(reader.result);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      savePlantResult(capturedImage);
    }

    function savePlantResult(imageData) {
      const mockResult = {
        name: "Sunflower",
        species: "Helianthus annuus",
        seed: "Sunflower seed 🌻",
        disease: "Healthy",
        status: "Safe",
        description: desc,
        date: new Date().toLocaleString(),
        key: `plant_${Date.now()}`,
        image: imageData // store captured/uploaded image
      };

      scannerResult.textContent = `Top guess: ${mockResult.name} (${mockResult.species}) - ${mockResult.status}`;

      const plants = loadData("savedPlants");
      plants.push(mockResult);
      saveData("savedPlants", plants);

      localStorage.setItem("chatbotContext", JSON.stringify(mockResult));
      window.location.href = "chatbot.html";
    }
  });
}

// ========== DASHBOARD ==========
const plantsList = document.getElementById("plants-list");
if (plantsList) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) window.location.href = "signin.html";

  const plants = loadData("savedPlants");
  plantsList.innerHTML = plants.map((p, i) => `
    <div class="plant-card">
      ${p.image ? `<img src="${p.image}" alt="${p.name}" class="plant-card-img" />` : ""}
      <h3>${p.name} (${p.species})</h3>
      <p><b>Status:</b> ${p.status}</p>
      <p><b>Disease/Deficiency:</b> ${p.disease}</p>
      <p><b>Description:</b> ${p.description || "N/A"}</p>
      <p><small>Saved: ${p.date}</small></p>
      <button onclick="chatAboutPlant(${i})">Chat about this plant</button>
      <button onclick="deletePlant(${i})">Delete</button>
    </div>
  `).join("");
}


function chatAboutPlant(i) {
  const plants = loadData("savedPlants");
  localStorage.setItem("chatbotContext", JSON.stringify(plants[i]));
  window.location.href = "chatbot.html";
}

function deletePlant(i) {
  const plants = loadData("savedPlants");
  plants.splice(i, 1);
  saveData("savedPlants", plants);
  location.reload();
}

// ========== CHATBOT ==========
function loadChats(plantKey) {
  const allChats = JSON.parse(localStorage.getItem("savedChats")) || {};
  return allChats[plantKey] || [];
}

function saveChats(plantKey, chats) {
  const allChats = JSON.parse(localStorage.getItem("savedChats")) || {};
  allChats[plantKey] = chats;
  localStorage.setItem("savedChats", JSON.stringify(allChats));
}

const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");

if (chatWindow) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) window.location.href = "signin.html";

  const plantContext = JSON.parse(localStorage.getItem("chatbotContext"));
  if (!plantContext) window.location.href = "dashboard.html";

  const plantKey = plantContext.key;
  let chats = loadChats(plantKey);

  // SYSTEM MESSAGE
  if (plantContext && !chats.some(c => c.sender === "system")) {
    chats.push({
      sender: "system",
      text: `📌 Loaded plant analysis: ${plantContext.name} (${plantContext.species}) - ${plantContext.status}`,
      time: new Date().toLocaleTimeString()
    });
    saveChats(plantKey, chats);
  }

  function renderChats() {
    let plantImageHtml = "";
    if (plantContext.image) {
      plantImageHtml = `<div class="plant-chat-img-container">
                          <img src="${plantContext.image}" alt="${plantContext.name}" class="plant-chat-img"/>
                        </div>`;
    }

    chatWindow.innerHTML = plantImageHtml + chats.map((c, i) => {
      let isUser = c.sender === "user";
      let imgSrc = isUser ? "./assets/user.png" : (c.sender === "bot" ? "./assets/chatbot.png" : "");
      return `
        <div class="chat-msg ${isUser ? "user-msg" : c.sender === "bot" ? "bot-msg" : "system-msg"}">
          ${imgSrc ? `<img src="${imgSrc}" class="chat-avatar"/>` : ""}
          <div class="chat-bubble">
            <p>${c.text}</p>
            <small>${c.time}</small>
          </div>
        </div>
      `;
    }).join("");
  }

  renderChats();

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-input");
      const text = input.value.trim();
      if (!text) return;

      chats.push({ sender: "user", text, time: new Date().toLocaleTimeString() });
      chats.push({ sender: "bot", text: "🤖 (demo) Answer to: " + text, time: new Date().toLocaleTimeString() });

      saveChats(plantKey, chats);
      input.value = "";
      renderChats();
    });
  }

  window.deleteChat = function(i) {
    chats.splice(i, 1);
    saveChats(plantKey, chats);
    renderChats();
  };
}
