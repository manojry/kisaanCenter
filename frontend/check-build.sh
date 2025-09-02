#!/bin/bash
cd /Users/manojreddy.yalamareddy/kisaanCenter/kisaanCenter/frontend
npm run build > build-output.txt 2>&1
echo "Build check completed. Check build-output.txt for results."