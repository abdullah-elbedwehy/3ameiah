#!/usr/bin/env node

import { main } from "../src/cli.mjs";

process.exitCode = await main(["learn", ...process.argv.slice(2)]);
