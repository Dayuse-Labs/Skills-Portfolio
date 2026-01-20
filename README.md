<div align="center">

# Dayuse Skills

**Supercharge your AI coding assistants with Dayuse best practices**

[![Skills](https://img.shields.io/badge/Skills-1-blue?style=for-the-badge)](#available-skills)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-orange?style=for-the-badge)](#claude-code)
[![Cursor](https://img.shields.io/badge/Cursor-Compatible-purple?style=for-the-badge)](#cursor)
[![Antigravity](https://img.shields.io/badge/Antigravity-Compatible-green?style=for-the-badge)](#antigravity)

---

*A central hub for coding skills, rules, and standards designed to ensure code quality, consistency, and adherence to company best practices across all your AI-assisted development.*

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

Enforces professional standards for robust, maintainable code.

**Includes:** DDD Architecture | Strict TypeScript | Testing | Zod Validation | Result Pattern

[**Download ZIP**](skills/dayuse-vibes.zip) | [**View Source**](skills/dayuse-vibes/SKILL.md)

</td>
</tr>
</table>

---

## Quick Start

Choose your AI coding assistant below to get started:

<details>
<summary><strong>Claude Code</strong></summary>

<br>

1. **Download** the skill ZIP file from the table above
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
dayuse-skills/
├── skills/
│   ├── dayuse-vibes.zip      # Ready-to-use package
│   └── dayuse-vibes/
│       └── SKILL.md          # Skill definition
└── README.md
```

---

## Contributing

Want to add a new skill? Here's how:

1. Create a new directory under `skills/` (e.g., `skills/react-patterns`)
2. Add a `SKILL.md` file defining rules, patterns, and examples
3. Update this README with your skill in the [Available Skills](#available-skills) section
4. Create a ZIP package for easy distribution

---

<div align="center">

**Built with care by the Dayuse Engineering Team**

</div>
