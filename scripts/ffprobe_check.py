import json
import subprocess
import shlex
import time

INPUT = 'data/channels.valid.json'
CHECK_COUNT = 20
TIMEOUT = 8


def check_stream(url):
    cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '{url}'"
    try:
        proc = subprocess.run(shlex.split(cmd), capture_output=True, timeout=TIMEOUT)
        out = proc.stdout.decode('utf-8', errors='ignore').strip()
        if proc.returncode == 0 and out:
            return True, out
        # Sometimes streams require HEADless check; consider non-zero but stdout
        return False, out or proc.stderr.decode('utf-8', errors='ignore')
    except Exception as e:
        return False, str(e)


def main():
    try:
        with open(INPUT, 'r', encoding='utf-8') as f:
            channels = json.load(f)
    except Exception as e:
        print(f'Could not load {INPUT}: {e}')
        return

    to_check = channels[:CHECK_COUNT]
    successes = 0
    failures = 0

    for i, ch in enumerate(to_check, 1):
        url = ch.get('url')
        print(f'[{i}/{len(to_check)}] Checking: {url}')
        ok, info = check_stream(url)
        if ok:
            print(f'  OK (duration: {info})')
            successes += 1
        else:
            print(f'  FAIL ({info})')
            failures += 1
        time.sleep(0.5)

    print(f'Checked {len(to_check)} streams: {successes} OK, {failures} FAIL')


if __name__ == '__main__':
    main()
