<div align="center">

# Dayuse Skills

**Supercharge your AI coding assistants with Dayuse best practices**

[![Version](https://img.shields.io/github/v/release/Dayuse-Labs/Skills-Portfolio?style=for-the-badge)](https://github.com/Dayuse-Labs/Skills-Portfolio/releases)
[![Skills](https://img.shields.io/badge/Skills-4-blue?style=for-the-badge)](#available-skills)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-orange?style=for-the-badge)](#claude-code)
[![Cursor](https://img.shields.io/badge/Cursor-Compatible-purple?style=for-the-badge)](#cursor)
[![Antigravity](https://img.shields.io/badge/Antigravity-Compatible-green?style=for-the-badge)](#antigravity)

---

*A central hub for coding skills, rules, and standards designed to ensure code quality, consistency, security, and adherence to company best practices across all your AI-assisted development.*

</div>

## Available Skills

<table>
<tr>
<td width="120" align="center">
<br>
<img src="https://img.icons8.com/fluency/96/code.png" width="48"/>
<br><br>
</td>
<td>

### Dayuse Vibes

Enforces professional standards for robust, maintainable TypeScript code.

**Includes:** DDD Architecture | Strict TypeScript | Testing | Zod Validation | Result Pattern

[**View Source**](skills/dayuse-vibes/SKILL.md)

</td>
</tr>
<tr>
<td width="120" align="center">
<br>
<img src="https://img.icons8.com/fluency/96/php.png" width="48"/>
<br><br>
</td>
<td>

### PHP Dayuse

Senior PHP developer skill for Symfony, Doctrine, and modern PHP 8.4+.

**Includes:** Strict Typing | PHPStan Level 10 | DDD Patterns | Symfony 7 | Doctrine ORM | PHPUnit

[**View Source**](skills/php-dayuse/SKILL.md)

</td>
</tr>
<tr>
<td width="120" align="center">
<br>
<img src="https://img.icons8.com/fluency/96/console.png" width="48"/>
<br><br>
</td>
<td>

### Dayuse App

Local development commands for the Dayuse.com project via Python Invoke.

**Includes:** Docker | PHPUnit | PHPStan | CS-Fixer | ESLint | Migrations | Elasticsearch | Translations

[**View Source**](skills/dayuse-app/SKILL.md)

</td>
</tr>
<tr>
<td width="120" align="center">
<br>
<img src="https://img.icons8.com/fluency/96/presentation.png" width="48"/>
<br><br>
</td>
<td>

### Dayuse PPTX

Creates Dayuse-branded presentations (PPTX) with consistent visual identity and storytelling structure.

**Includes:** Brand Guidelines | Gradient System | Manrope Typography | Slide Patterns | Asset Catalog | Storytelling Framework

[**View Source**](skills/dayuse-pptx/SKILL.md)

</td>
</tr>
</table>

---

## Installation

### Via `npx` (Recommended)

Install all Dayuse skills at once with a single command:

```bash
npx skills add https://github.com/Dayuse-Labs/Skills-Portfolio
```

This will automatically download and configure all available skills for your environment.

### Manual Installation

Choose your AI coding assistant below:

<details>
<summary><strong>Claude Code</strong></summary>

<br>

1. **Download** the skill ZIP file
2. Navigate to **Settings > Capabilities**
3. In the **Skills** section, click **"Upload skill"**
4. Upload your ZIP file
5. Toggle the skill on/off as needed

</details>

<details>
<summary><strong>Antigravity</strong></summary>

<br>

Antigravity automatically discovers skills in specific directories:

**Project-specific installation:**
```
.agent/skills/dayuse-vibes/SKILL.md
```

**Global installation:**
```
~/.gemini/antigravity/skills/dayuse-vibes/SKILL.md
```

The agent will automatically detect and use the skill based on its `SKILL.md` description.

</details>

<details>
<summary><strong>Cursor</strong></summary>

<br>

**Option 1: Global/Project Rules**
1. Open the [SKILL.md](skills/dayuse-vibes/SKILL.md) file
2. Copy the content
3. Paste into your project's `.cursorrules` file

**Option 2: Context Reference**

Mention the skill file directly in Chat or Composer:
```
@SKILL.md Generate a user service following these rules...
```

</details>

---

## Repository Structure

```
skills-portfolio/
├── skills/
│   ├── dayuse-vibes/
│   │   ├── SKILL.md              # TypeScript / Vibe Coding standards
│   │   └── references/           # Detailed guides (DDD, testing, etc.)
│   ├── php-dayuse/
│   │   ├── SKILL.md              # PHP / Symfony standards
│   │   └── references/           # Detailed guides (Doctrine, async, etc.)
│   ├── dayuse-app/
│   │   └── SKILL.md              # Local dev commands (Docker, tests, lint)
│   └── dayuse-pptx/
│       ├── SKILL.md              # Dayuse-branded PPTX presentations
│       ├── assets/               # Brand logos, photos, icons, brand guide
│       ├── references/           # Icon catalog, detailed guides
│       └── scripts/              # Asset preprocessing (logo transparency)
└── README.md
```

---

## Contributing

Want to add a new skill? Here's how:

1. Create a new directory under `skills/` (e.g., `skills/react-patterns`)
2. Add a `SKILL.md` file defining rules, patterns, and examples
3. Update this README with your skill in the [Available Skills](#available-skills) section

---

<div align="center">

**Built with care by the Dayuse Engineering Team**

</div>
