#!/usr/bin/env node

import { main } from "../src/cli.mjs";

process.exitCode = await main(["use", ...process.argv.slice(2)]);
