# Security Policy

This app manages a private organization's member roster and
prospective-member vetting pipeline. Both are sensitive to the people
involved, and we treat security reports accordingly.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, email **post@logenhelfer.de** with:

- A description of the vulnerability and its potential impact.
- Steps to reproduce (a minimal proof of concept, if you have one).
- Any suggested remediation, if you have one.

We'll acknowledge your report within 3 business days and aim to provide an
initial assessment (confirmed/not a vulnerability/needs more info) within 10
business days. We'll keep you updated as a fix is developed and credit you
in the eventual disclosure, unless you'd prefer to stay anonymous.

Please give us a reasonable amount of time to fix an issue before any public
disclosure.

## Supported Versions

This is a deployed application, not a versioned library — only the current
`main` branch (what's actually running in production) is supported. There
are no older versions receiving security patches.

## Scope

In scope: the application code in this repository (`api/`, `app/`) and its
own deploy tooling (`bin/`, `infra/`).

Out of scope: the underlying hosting infrastructure, third-party
dependencies (report those upstream, though we're happy to hear about
vulnerable dependencies too so we can update), and social engineering
against individual members/admins.
