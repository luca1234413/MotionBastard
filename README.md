# 🤬 MotionBastard

**AI-powered motion design assistant — generates AE scripts & frontend animations from chat.**

An opinionated, foul-mouthed AI motion designer that lives inside After Effects. Describe what you want, it figures out the best way to build it — AE ExtendScript or frontend code — and does it for you.

---

## What it does

**Two paths, one chat:**

- **AE Path** → You describe an animation → AI generates ExtendScript → Click "Execute" → Animation appears in your AE comp
- **Frontend Path** → You describe a CSS/JS animation → AI generates code → Live preview renders in the panel → Copy code to your project

**It also:**
- Reads your current AE comp & selected layers automatically
- Detects which path is best for your request (AE vs frontend)
- Speaks its mind about your design choices (you've been warned)

---

## Screenshots

> TODO: Add screenshots here

---

## Install

### Prerequisites
- After Effects 2023 or later
- Git installed ([download](https://git-scm.com/))
- An API key from [OpenRouter](https://openrouter.ai/) (recommended) or [Anthropic](https://console.anthropic.com/)

### One-line install

**Mac** (open Terminal):
```bash
curl -sL https://raw.githubusercontent.com/BerlinKing/MotionBastard/main/install.sh | bash
```

**Windows** (open PowerShell as Admin):
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/BerlinKing/MotionBastard/main/install.bat" -OutFile "$env:TEMP\mb_install.bat"; Start-Process "$env:TEMP\mb_install.bat" -Verb RunAs
```

### Then:
1. Restart After Effects
2. Go to **Window → Extensions → Motion AI Assistant**
3. Click ⚙ Settings → Select provider → Paste your API key → Save
4. Start chatting

### Manual install

<details>
<summary>Click to expand</summary>

**Mac:**
```bash
git clone https://github.com/BerlinKing/MotionBastard.git "/Library/Application Support/Adobe/CEP/extensions/motion-ai-panel"
curl -o "/Library/Application Support/Adobe/CEP/extensions/motion-ai-panel/js/CSInterface.js" https://raw.githubusercontent.com/nickvdh/cep-resources/main/CSInterface_12.js
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

**Windows (as Admin):**
```bash
git clone https://github.com/BerlinKing/MotionBastard.git "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\motion-ai-panel"
curl -o "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\motion-ai-panel\js\CSInterface.js" https://raw.githubusercontent.com/nickvdh/cep-resources/main/CSInterface_12.js
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_DWORD /d 1 /f
```
</details>

---

## Supported API Providers

| Provider | Models | Key format |
|----------|--------|------------|
| **OpenRouter** (default) | Claude Sonnet 4, Claude Opus 4, Claude Haiku 4 | `sk-or-...` |
| **Anthropic** (direct) | Claude Sonnet 4, Claude Opus 4 | `sk-ant-...` |

OpenRouter is recommended — it's easier to set up and supports more models.

---

## Project Structure

```
motion-ai-panel/
├── CSXS/
│   └── manifest.xml          # CEP extension config
├── css/
│   └── style.css             # Panel styles (dark theme)
├── js/
│   ├── CSInterface.js        # Adobe CEP bridge (download separately)
│   └── app.js                # Main app logic + Claude API
├── jsx/
│   └── host.jsx              # ExtendScript functions for AE control
├── .debug                    # CEP debug config
└── index.html                # Panel UI
```

---

## How it works

1. Panel connects to AE via CSInterface + ExtendScript bridge
2. Status bar shows current comp & selected layer in real-time
3. When you send a message, AE context (comp size, layers, effects) is automatically injected
4. AI decides the best path: AE ExtendScript or frontend code
5. AE path: code goes to Code tab → click Execute → runs in AE
6. Frontend path: code renders in Preview tab → copy when satisfied

---

## The AI Personality

MotionBastard's AI is a veteran motion designer with 10+ years of experience. It's technically brilliant but has zero patience for bad taste. It will:

- Tell you if your idea is ugly
- Suggest better approaches (with reasons)
- Refuse to write code until your requirements are clear
- Occasionally roast your design choices

Don't take it personally. It's making your work better.

---

## Roadmap

- [ ] Voice input for hands-free iteration
- [ ] Multi-model support (GPT, Gemini)
- [ ] Reverse detection (sync AE manual changes back)
- [ ] Conversation history
- [ ] SP remote hot-update

---

## Contributing

PRs welcome. If you're improving the System Prompt, test it in the [Anthropic Workbench](https://console.anthropic.com/) first.

---

## License

MIT — do whatever you want.
