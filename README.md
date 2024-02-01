# Orderly

Orderly is a proof-of-concept tool for helping you write books. It uses whisper.cpp to aid in dictation of speech to text so that you don't have to type everything out by hand.

This app was actually inspired by an episode of Columbo that had an author dictate his novel chapters into a tape recorder and then send them off to be typed up.

<!-- Image or video of UI -->

## Features

- Multiple book support
- Local-first
- Voice to Text
- Import/Export
- Render to PDF

## WASM: WAT?

This application uses SQLite and Whisper.cpp directly in the browser. This means that the code is compiled to WebAssembly and then executed in the browser at runtime without any server-side logic or communication.

This has the benefit of giving you full ownership over your data. However, it also means that it is harder to take resume your usage on different machines. There is an import/export process but that involves several manual steps.

Another tradeoff for this amount of local-first functionality is that the app's bundle size is a bit larger than you would expect for a website. For a web application like Orderly, we think this is a fair tradeoff.

## Contributing

Orderly is 100% open source and welcomes contributors. Please feel free to report any bugs or feature requests in the Issues section of this GitHub repository.

As a proof-of-concept, not every fix or feature issue will make into the core codebase, but contributors are heavily encouraged to fork it and make it their own.

### Installation

Orderly uses PNPM (https://pnpm.io/)[https://pnpm.io/] for its dependency management. You are expected to use it instead of npm or yarn if you wish to have your PR accepted.

Run this command to install the dependencies:

```
pnpm install
```

### Development

To run the dev server please run:

```
pnpm dev
```

This will launch the app at `http://localhost:5173/` by default as long as the port is available.

### Commits

To ensure that your PR gets accepted with the least amount of friction, please use the Conventional Commit syntax found here: [https://www.conventionalcommits.org/en/v1.0.0/](https://www.conventionalcommits.org/en/v1.0.0/)

### Making a Pull Request

It is strongly encouraged to make an Issue first. When creating a PR, please reference the issue and add `resolves #ISSUE_NUMBER` at the end of the PR description on its own new line where `ISSUE_NUMBER` is the number of the issue you created or are referencing.

## License

Copyright 2024 Chris Griffing

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
