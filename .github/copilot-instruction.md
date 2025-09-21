# Copilot instructions

## Language Policy

All instructions and prompts in this repository must be written in English. This applies to:
- All rule and instruction files in `.github/instructions/`
- All prompt files in `.github/prompts/`
- All documentation and code comments intended for contributors

## Development code generation

- This is monorepo project which have two apps client for the frontend and server for the api for full documentation visit the full readme file [README.MD](../README.md) .
- for the client we use mui with react and vite for building , the project is derived from a template anything you will design consider using pre built in component .
- for the server is built using nest js as rest api with postgres as main db and prisma as orm .
- for every major feature consider checkout new branch
- don't generate markdown file illustrating the new feature .
- when a feature is demanded or fix looks both in client and server
- don't run any command if you would than tell me
### Workflow implementation
1. when starting new feature consider starting with api implmentation than go for the ui development and integration .
2. after finishing the feature you can create an md file illustrating with mermaid diagram what've you do inside the docs folder at the root of the project