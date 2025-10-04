#!/usr/bin/env python3
"""
Health check server for Cloud Run
Provides status endpoint for monitoring
"""

import json
import os
from pathlib import Path
from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

STATUS_FILE = Path("/app/results/training_status.json")


@app.route("/")
def index():
    """Root endpoint"""
    return jsonify({
        "service": "phi4-finetuning",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    })


@app.route("/health")
def health():
    """Health check endpoint for Cloud Run"""
    return jsonify({"status": "healthy"}), 200


@app.route("/status")
def status():
    """Training status endpoint"""
    if STATUS_FILE.exists():
        with open(STATUS_FILE, 'r') as f:
            status_data = json.load(f)
        return jsonify(status_data), 200
    else:
        return jsonify({
            "status": "initializing",
            "message": "Training not yet started"
        }), 200


@app.route("/results")
def results():
    """Get training results if available"""
    results_dir = Path("/app/benchmarks/results")

    if not results_dir.exists():
        return jsonify({"error": "Results not available yet"}), 404

    available_files = list(results_dir.glob("*.json"))

    return jsonify({
        "results_available": len(available_files) > 0,
        "files": [f.name for f in available_files],
        "path": str(results_dir)
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
