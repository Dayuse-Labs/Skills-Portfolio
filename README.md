# Dayuse Skills

This repository serves as a central hub for Dayuse coding skills, rules, and standards. It is designed to be consumed by various AI coding assistants to ensure code quality, consistency, and adherence to company best practices.

## Directory Structure

```
.
├── skills/           # Contains all skill definitions
│   └── dayuse-vibes/ # Codes styles, patterns and best practices
├── README.md         # This file
└── ...
```

## Available Skills

| Skill | Description | Path |
|-------|-------------|------|
| **Dayuse Vibes** | Enforces professional standards: DDD architecture, strict TypeScript, testing, Zod validation, and Result pattern. | [skills/dayuse-vibes/SKILL.md](skills/dayuse-vibes/SKILL.md) |

## Installation & Usage

You can use these skills with your preferred AI coding assistant.

### Claude Code

To use a custom skill in Claude Code:

1.  Package your skill folder (e.g., `skills/dayuse-vibes`) as a ZIP file.
2.  Navigate to **Settings > Capabilities**.
3.  In the **Skills** section, click **"Upload skill"**.
4.  Upload your ZIP file.
5.  Your skill will appear in your Skills list and can be toggled on or off.

### Antigravity

Antigravity automatically discovers skills placed in specific directories. To install a skill:

1.  **Project-specific:** Copy the skill folder to `.agent/skills/` in your project root.
    ```
    .agent/skills/dayuse-vibes/SKILL.md
    ```
2.  **Global:** Copy the skill folder to `~/.gemini/antigravity/skills/`.
    ```
    ~/.gemini/antigravity/skills/dayuse-vibes/SKILL.md
    ```

Once installed, the agent will automatically detect and use the skill based on its description in `SKILL.md`.

### Cursor

There are two ways to use these skills in Cursor:

#### Option 1: Global/Project Rules (.cursorrules)
1. Open the [SKILL.md](skills/dayuse-vibes/SKILL.md) file you want to enforce.
2. Copy the content.
3. Paste it into your project's `.cursorrules` file at the root.

#### Option 2: Context Reference
In the Cursor Chat or Composer, simply `@` mention the skill file to bring it into context.
> "@SKILL.md Generate a user service following these rules..."

## Adding New Skills

1. Create a new directory under `skills/` (e.g., `skills/react-patterns`).
2. Create a `SKILL.md` file within that directory defining the rules, patterns, and examples.
3. Update this `README.md` to include the new skill in the [Available Skills](#available-skills) table.
