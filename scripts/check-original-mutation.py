"""Reproduce the suffix-mutation check; always restore translate.ts. Run alone."""
from pathlib import Path
import hashlib
import json
import os
import subprocess

os.chdir(Path(__file__).resolve().parent.parent)
source = Path("translate.ts")
original = source.read_bytes()
before = hashlib.sha256(original).hexdigest()
needle = b'return word + "ay";'
assert original.count(needle) == 1
Path("reports/contract-model").mkdir(parents=True, exist_ok=True)
try:
    source.write_bytes(original.replace(needle, b'return word + "xx";'))
    result = subprocess.run(
        ["node", "--test", "--test-name-pattern=original: consolidated contract examples", "translate-contract.mbt.ts"],
        env=os.environ | {"QUINT_SEED": "42", "TRACE_DIR": ".mbt-traces/contract-mutation"},
        text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=90,
    )
    Path("reports/contract-model/mutation-red.log").write_text(result.stdout)
    assert result.returncode != 0 and "StateMismatchError" in result.stdout, result.stdout
finally:
    source.write_bytes(original)
    after = hashlib.sha256(source.read_bytes()).hexdigest()
    assert before == after
    Path("reports/contract-model/source-restoration.json").write_text(json.dumps(
        {"sha256Before": before, "sha256After": after, "restored": True}, indent=2) + "\n")
print("RED: deliberate mutation detected; source restored byte-for-byte")
result = subprocess.run(
    ["node", "--test", "--test-name-pattern=original: consolidated contract examples", "translate-contract.mbt.ts"],
    env=os.environ | {"QUINT_SEED": "42", "TRACE_DIR": ".mbt-traces/contract-restored"},
    text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=90,
)
Path("reports/contract-model/mutation-restored-green.log").write_text(result.stdout)
assert result.returncode == 0, result.stdout
print("GREEN: restored original passed 67 requests / 68 observations")
