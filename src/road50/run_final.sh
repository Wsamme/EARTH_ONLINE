#!/bin/bash
# road50 (after the restart): R6/R6b repair + tunnel diagnostics for sg hk nyc gba, then the traffic runs on the tunnel stage
cd "$(dirname "$0")"
CITIES="sg hk nyc gba" ./run_tun.sh
CITIES="sg hk nyc gba" ./run_simtun.sh
