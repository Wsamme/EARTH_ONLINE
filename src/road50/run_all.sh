#!/bin/bash
# road50: diagnostics of the live data, repair into the test stage, diagnostics of the stage (one heavy-lock session)
cd "$(dirname "$0")"
./run_before.sh && ./run_repair.sh
