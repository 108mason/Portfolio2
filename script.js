// ========================================
// Portfolio 2 — Terminal Interactions
// ========================================

(function () {
  "use strict";

  const terminal = document.getElementById("terminal");
  const navLinks = document.querySelectorAll(".nav-cmd");
  const blocks = document.querySelectorAll(".block");

  // --- Typing animation for command text ---
  function typeText(el) {
    if (el.dataset.typed) return;
    el.dataset.typed = "true";

    const text = el.dataset.text;
    el.textContent = "";
    el.style.width = "auto";
    el.classList.add("animate");

    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        el.classList.remove("animate");
        el.classList.add("done");
      }
    }, 40);
  }

  // --- Scroll-triggered reveal with IntersectionObserver ---
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");

          // Trigger typing for the command in this block
          const typed = entry.target.querySelector(".typed");
          if (typed) typeText(typed);
        }
      });
    },
    {
      root: terminal,
      threshold: 0.15,
    }
  );

  blocks.forEach((block) => revealObserver.observe(block));

  // --- Active nav tracking on scroll ---
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.dataset.section === id);
          });
        }
      });
    },
    {
      root: terminal,
      threshold: 0.3,
    }
  );

  blocks.forEach((block) => navObserver.observe(block));

  // --- Nav click: smooth scroll ---
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // --- Keyboard shortcut: 1-6 to jump to sections ---
  const sectionIds = ["hero", "about", "skills", "experience", "projects", "contact"];

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const idx = parseInt(e.key) - 1;
    if (idx >= 0 && idx < sectionIds.length) {
      const target = document.getElementById(sectionIds[idx]);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        e.preventDefault();
      }
    }
  });
})();

// ========================================
// Chat Widget — Amazon Lex Integration
// ========================================

(function () {
  "use strict";

  // --- AWS / Lex config ---
  AWS.config.region = "us-east-1";
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "eu-central-1:e49b8c55-cf36-4866-9081-d833749482d5",
  });

  const lexRuntime = new AWS.LexRuntimeV2();
  const botId = "ZMKAHXZJQL";
  const botAliasId = "TSTALIASID";
  const sessionId = "user-" + Date.now();

  // --- Toggle chat ---
  window.toggleChat = function () {
    document.getElementById("chatWindow").classList.toggle("open");
    const input = document.getElementById("chatInput");
    if (document.getElementById("chatWindow").classList.contains("open")) {
      input.focus();
    }
  };

  // --- Send message ---
  window.sendChatMessage = async function () {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    try {
      const response = await lexRuntime
        .recognizeText({
          botId: botId,
          botAliasId: botAliasId,
          localeId: "en_US",
          sessionId: sessionId,
          text: message,
        })
        .promise();

      if (response.messages && response.messages.length > 0) {
        response.messages.forEach(function (msg) {
          addMessage(msg.content, "bot");
        });
      } else {
        addMessage("I didn't catch that. Could you rephrase?", "bot");
      }
    } catch (error) {
      console.error("Lex error:", error);
      addMessage("Connection error. Please try again.", "bot");
    }
  };

  // --- Add message to chat ---
  function addMessage(text, sender) {
    const messagesDiv = document.getElementById("chatMessages");
    const msg = document.createElement("div");
    msg.className = "chat-msg " + sender;

    const prompt = document.createElement("span");
    prompt.className = "chat-msg-prompt";
    prompt.textContent = sender === "bot" ? "bot$" : "you$";

    const bubble = document.createElement("span");
    bubble.className = "chat-msg-text";
    bubble.textContent = text;

    msg.appendChild(prompt);
    msg.appendChild(bubble);
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // --- Enter key to send ---
  document.getElementById("chatInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendChatMessage();
  });
})();
