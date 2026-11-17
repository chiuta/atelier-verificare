#!/usr/bin/env python3
"""Validate the check descriptors (data/checks/*.json) against schema.json and check the contract with the plugins and the page.

For every descriptor: it follows schema.json; its id equals the file name; `entry` is checks/<id>.js and the file exists; an offline check declares no
network hosts, a network check declares at least one; every host is listed as https://<host> in `connect` in src/app.json, and `connect` lists no host
that no descriptor declares. `data/checks/example.json` is the template: it is validated against the schema but needs no plugin and declares no hosts.

Usage: python scripts/validate.py [data-dir]
"""
import json, sys, pathlib
from jsonschema import Draft7Validator

root = pathlib.Path(__file__).resolve().parent.parent
schema = json.loads((root / "schema.json").read_text(encoding="utf-8"))
data_dir = root / sys.argv[1] if len(sys.argv) > 1 else root / "data" / "checks"
cfg = json.loads((root / "src" / "app.json").read_text(encoding="utf-8"))
connect = {o: o for o in cfg.get("connect", [])}
validator = Draft7Validator(schema)
bad = 0
declared = set()
files = sorted(data_dir.rglob("*.json"))


def problem(f, msg):
    global bad
    bad += 1
    print(f"{f.relative_to(root)}: {msg}")


for f in files:
    doc = json.loads(f.read_text(encoding="utf-8"))
    for err in validator.iter_errors(doc):
        path = "/".join(map(str, err.absolute_path)) or "(root)"
        problem(f, f"{path}: {err.message}")
    if f.name == "example.json" or not isinstance(doc, dict):
        continue
    if doc.get("id") != f.stem:
        problem(f, f"id «{doc.get('id')}» differs from the file name «{f.stem}»")
    if doc.get("entry") != f"checks/{f.stem}.js" or not (root / str(doc.get("entry", ""))).is_file():
        problem(f, f"entry «{doc.get('entry')}» must be checks/{f.stem}.js and the file must exist")
    hosts = doc.get("network", [])
    if doc.get("offline") is True and hosts:
        problem(f, "an offline check must not declare network hosts")
    if doc.get("offline") is False and not hosts:
        problem(f, "a check with offline:false must list its hosts in «network»")
    for h in hosts:
        declared.add(h)
        if "https://" + h not in connect:
            problem(f, f"host {h} is not listed as https://{h} in «connect» in src/app.json")

for o in connect:
    if o.replace("https://", "", 1) not in declared:
        bad += 1
        print(f"src/app.json: «connect» lists {o}, which no descriptor declares")

print(f"{len(files)} file(s) checked, {bad} problem(s).")
sys.exit(1 if bad else 0)
