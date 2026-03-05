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

// --- AWS / Lex config ---
AWS.config.region = 'eu-central-1'; // Frankfurt
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'eu-central-1:9087a116-b89c-433f-89a3-890e4c4f9611'
});

const lexRuntime = new AWS.LexRuntimeV2();
const botId = 'ZMKAHXZJQL';
const botAliasId = 'KZGQCEF79N';

// Test credentials on page load
AWS.config.credentials.get((err) => {
  if (err) {
    console.error('CREDENTIALS FAILED:', err);
  } else {
    console.log('CREDENTIALS WORKING! Identity ID:', AWS.config.credentials.identityId);
  }
});

// --- Toggle chat ---
function toggleChat() {
  const chatWindow = document.getElementById('chatWindow');
  if (chatWindow) {
    chatWindow.classList.toggle('open');
  }
}

// --- Add message to chat (terminal-themed) ---
function addMessage(text, sender) {
  const messagesDiv = document.getElementById('chatMessages');
  if (!messagesDiv) return;

  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + sender;

  const prompt = document.createElement('span');
  prompt.className = 'chat-msg-prompt';
  prompt.textContent = sender === 'bot' ? 'bot$' : 'you$';

  const bubble = document.createElement('span');
  bubble.className = 'chat-msg-text';
  bubble.textContent = text;

  msg.appendChild(prompt);
  msg.appendChild(bubble);
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --- Send message to Lex ---
async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  addMessage(message, 'user');
  input.value = '';

  // Show typing indicator
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) typingIndicator.style.display = 'flex';

  try {
    // Get credentials before calling Lex
    await new Promise((resolve, reject) => {
      AWS.config.credentials.get((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Call Lex with production alias
    const response = await lexRuntime.recognizeText({
      botId: botId,
      botAliasId: botAliasId,
      localeId: 'en_US',
      sessionId: 'user-' + Date.now(),
      text: message
    }).promise();

    if (typingIndicator) typingIndicator.style.display = 'none';

    if (response.messages && response.messages.length > 0) {
      addMessage(response.messages[0].content, 'bot');
    }
  } catch (error) {
    console.error('Error:', error);

    if (typingIndicator) typingIndicator.style.display = 'none';

    let errorMessage = 'Connection error. Please try again.';
    if (error.code === 'AccessDeniedException') {
      errorMessage = 'Permission error. Please contact support.';
    } else if (error.code === 'ResourceNotFoundException') {
      errorMessage = 'Bot configuration error.';
    }

    addMessage(errorMessage, 'bot');
  }
}

// --- Enter key to send ---
document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && e.target.id === 'chatInput') {
    sendChatMessage();
  }
});
