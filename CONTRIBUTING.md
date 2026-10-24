# Contributing to Bet on Your Friends

Thank you for your interest in contributing to Bet on Your Friends! Here, you can find the outline of our team's expectations, development workflow, and contribution guidelines.

## Team Norms

Our team follows the [Team Norms](https://github.com/nyu-software-engineering/scrum-framework/blob/main/team-norms.md) established for the course. 

With that in mind, we agree to:

- Communicate respectfully and professionally
- Attend and actively participate in Standups and team meetings with our cameras and microphones on
- Complete assigned work on time and communicate any blockers
- Keep teammates informed about progress and changes
- Review each other's work and provide constructive feedback
- Share responsibilities and contribute fairly to the project

## Git Workflow

All changes must be made on separate branches and submitted through Pull Requests targeting the `master` branch.

1. Clone the shared team repository to your local development environment
2. Create a feature branch from the latest `master` branch
3. Make changes and commit them with a descriptive (single line) commit message
4. Push the feature branch to our GitHub repository
5. Open a Pull Request targeting our repository's `master` branch
6. Request a review from at least one other team member
7. Address any feedback, if given any
8. Once approved, the **reviewer** of the Pull Request is responsible for merging it. See [here](https://knowledge.kitchen/content/courses/agile-development-and-devops/notes/project-kickoff/#peer-review) for more details


### Branch Naming

Pulled from [here](https://knowledge.kitchen/content/courses/agile-development-and-devops/notes/project-kickoff/#branches).

Requirements:

- Make all changes to the code in isolated branches
- Create a new branch for every Task or Spike under development
- Never work directly in the `master` trunk branch
- Name branches after the User Story and Task/Spike which they are intended to implement, including: – the user story issue number (if any) – the task or spike issue number – a shorthand name for the branch that describes what changes it includes

Examples:

- A branch intended to implement Task #9, which is part of User Story #13:
```
git checkout -b user-story/13/task/9/implement-user-login
```
- A branch intended to implement Spike #27:
```
git checkout -b spike/27/learn-react-js
```

### Branch Protection

Our team uses a ruleset to protect the `master` branch:

- All changes must be submitted through Pull Requests
- At least one approval from another team member is required before merging
- Direct pushes to `master` are not allowed

## Contribution Guidelines

- Create or reference a GitHub Issue before starting work
- Assign the appropriate Issue labels (e.g. `user story`, `task`, `spike`, and `Sprint N`)
- Keep changes focused on the assigned Issue
- Follow existing coding conventions and maintain readable code
- Test changes before submitting a Pull Request
- Include a Summary and Testing section in each Pull Request description, screenshots/screen recordings when applicable
- Do not commit passwords, API keys, environment files containing secrets, or unnecessary generated files (check [.gitignore](.gitignore) for what isn't included)
- Update documentation when changes affect project functionality or setup
- Do not generate code using AI

## Local Development Environment

### Prerequisites

Install the following tools:

- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) or another code editor (e.g. a JetBrains IDE. Just don't use Claude Code, Cursor, Codex, or any of those AI code editors lol)
- [Node.js and npm](https://nodejs.org/)

### Clone the Repository

```
git clone https://github.com/agile-students-fall2026/bet-on-your-friends.git
cd bet-on-your-friends
```

Ensure your local `master` branch is up to date:

```
git checkout master
git pull origin master
```

Create and switch into a separate branch for your changes:

```
git checkout -b username/short-description
```

### Submitting Changes

```
git add 
git commit -m "Brief single line description of changes"
git push -u origin username/short-description
```

Open a Pull Request against the team's `master` branch, put all of the necessary reviewers, assignees, labels, projects, and assign the corresponding issue. Also, it would be preferred if you use the following markdown template:

```
@team_member1 @team_member2 @team_member3
---
## Summary

- Put a cool summary of changes here

## Testing

- How did you validate that this change is worthy of being merged

## Screenshots
```

Example Pull Request:

![Example pull request #7 screenshot of description, showing reviewers, assignees, labels, projects, issue attached, and PR description](images/Example%20PR.jpg)


## Building and Testing

TBD

## Communication

Our team uses the course-designated communication platform (Discord) for project discussions, progress updates, and blockers. Zoom will be used for virtual meetings, if we need to have any.

All communication should be done through our team channel in Discord, just to ensure that everyone is well aware of what is going on, and so that the team + course staff have a clear paper trail of communication (e.g. someone doesn't do their work, doesn't respond in a timely manner, etc.).