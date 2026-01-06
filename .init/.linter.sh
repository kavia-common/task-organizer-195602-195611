#!/bin/bash
cd /home/kavia/workspace/code-generation/task-organizer-195602-195611/frontend_web
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

