# One-off: run-book.local.json turns Gemma's thinking on for attempt 5 only; removed once attempt 5's proxy is up.
cd /c/code/benchmark/bench/logs
until awk '/attempt 5\/10/{f=1} f && /proxy on port/{found=1} END{exit !found}' guided-console.log; do sleep 20; done
rm -f /c/code/benchmark/run-book.local.json
echo "removed run-book.local.json after attempt 5 started"
awk '/attempt 5\/10/{f=1} f && /proxy on port/' guided-console.log | head -1
