const loginPage = document.getElementById("loginPage");
const chatPage = document.getElementById("chatPage");
const passcodeInput = document.getElementById("passcodeInput");
const loginError = document.getElementById("loginError");

const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const talkButton = document.getElementById("talkButton");

let authenticated = false;

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function login() {
  const passcode = passcodeInput.value.trim();

  if (!passcode) {
    loginError.textContent = "Please enter the passcode.";
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passcode }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed.");
    }

    authenticated = true;
    loginPage.classList.add("hidden");
    chatPage.classList.remove("hidden");

    speak("Welcome. I am Zeus. How can I help you?");

  } catch (error) {
    loginError.textContent = error.message;
  }
}

async function sendMessage(message) {
  if (!authenticated) return;
  if (!message.trim()) return;

  addMessage(message, "user");
  messageInput.value = "";

  addMessage("Zeus is thinking...", "assistant");
  const thinkingMessage = chatBox.lastChild;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    thinkingMessage.textContent = data.answer || "No response.";
    speak(data.answer || "I do not have a response.");

  } catch (error) {
    thinkingMessage.textContent = `Error: ${error.message}`;
    speak("There was an error.");
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await sendMessage(messageInput.value);
});

passcodeInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    await login();
  }
});

function getZeusVoice() {
  const voices = window.speechSynthesis.getVoices();

  const preferredVoices = [
    "Daniel",
    "Google UK English Male",
    "Microsoft David",
    "Alex",
    "Fred",
    "Google US English"
  ];

  for (const preferred of preferredVoices) {
    const voice = voices.find(v => v.name.includes(preferred));
    if (voice) return voice;
  }

  const maleLikeVoice = voices.find(v =>
    v.name.toLowerCase().includes("male") ||
    v.name.toLowerCase().includes("daniel") ||
    v.name.toLowerCase().includes("david") ||
    v.name.toLowerCase().includes("alex")
  );

  return maleLikeVoice || voices[0];
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.voice = getZeusVoice();
  utterance.rate = 0.82;
  utterance.pitch = 0.65;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function startListening() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    addMessage(
      "Speech recognition is not supported in this browser. Try Google Chrome.",
      "assistant"
    );
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  talkButton.textContent = "🎙️ Listening...";

  recognition.start();

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    talkButton.textContent = "🎙️ Talk";

    await sendMessage(transcript);
  };

  recognition.onerror = () => {
    talkButton.textContent = "🎙️ Talk";
    addMessage("I could not hear you clearly. Please try again.", "assistant");
  };

  recognition.onend = () => {
    talkButton.textContent = "🎙️ Talk";
  };
}