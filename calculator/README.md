# Modern Minimalist Calculator 🧮✨

A clean, minimalist web calculator featuring a modern glassmorphic aesthetic, tactile fluid animations, and comprehensive keyboard support.

## 🚀 Live Demo / How to Run

Simply open `index.html` in any modern web browser:
- Double click [index.html](file:///c:/Users/ABHINAV/OneDrive/Pictures/project/calculator/index.html) or right click -> **Open with Chrome / Edge / Firefox / Safari**.
- No server, build step, or dependencies required!

---

## ✨ Key Features & Animation Design

### 🎨 Clean & Minimalist Aesthetics
- **Glassmorphic Glass Surface**: 28px blurred backdrop with subtle borders, adaptive lighting, and soft layered shadows.
- **Floating Ambient Glow**: Three dynamic, smoothly animated ambient gradients that subtly float behind the calculator.
- **Plus Jakarta Sans Typography**: Crisp tabular numbers and sleek, legible glyphs.
- **Light & Dark Mode**: Seamless color transition with custom SVG sun/moon toggle, synchronized with system color-scheme preferences.

### 🎬 Delightful Micro-Interactions & Animations
- **Spring Keypress**: Keys compress smoothly on click/tap (`transform: scale(0.91)`) using an elastic spring cubic bezier.
- **Dynamic Touch/Click Ripple**: Radial light ripples radiate outward from the exact click or touch coordinates.
- **Digit Pulse & Expression Slide**: Calculated answers and display changes trigger a soft pop scale pulse; equations smoothly slide into position.
- **Error Shake Animation**: Dividing by zero or entering invalid expressions triggers an animated haptic shake of the entire calculator body.
- **Slide-up History Drawer**: Smoothly transitions from the base of the calculator with spring physics.
- **Responsive Dynamic Font Scaling**: Long numbers automatically scale down (`3.2rem` → `1.75rem`) so digits never overflow or truncate.

### ⚡ Functional Capabilities
- **Core Operations**: Addition (`+`), subtraction (`−`), multiplication (`×`), division (`÷`).
- **Precision Correction**: Floating point rounding cleanup (e.g., `0.1 + 0.2 = 0.3`).
- **Percentage & Sign Toggle**: Context-aware `%` calculation and `±` toggle.
- **History Memory**: View and reload previous calculations with one click (saved in `localStorage`).
- **Synthesized Audio Feedback**: Built-in Web Audio API click/chime synthesizer (zero external sound files needed, toggleable on/off).
- **Click-to-Copy**: Click on the display to instantly copy the current number with a tooltip confirmation toast.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` – `9` | Input Digits |
| `.` | Decimal point |
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `Enter` or `=` | Calculate Result |
| `Backspace` | Delete last digit |
| `Escape` | Clear All (AC) |
| `%` | Percent |

---

## 📁 File Structure

```
calculator/
├── index.html       # Semantic HTML5 markup
├── style.css        # Modern CSS design system, glassmorphism & keyframe animations
├── script.js        # Calculator logic, Web Audio synthesizer, keyboard listeners & animations
└── README.md        # Documentation
```
