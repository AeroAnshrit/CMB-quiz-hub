# Content Updates Task

- [x] Update data/content/aboutUs.json with new content
- [x] Update data/content/contactUs.json with new content
- [x] Update data/content/privacyPolicy.json with new content
- [x] Verify JSON syntax of updated files

## Server Troubleshooting: EADDRINUSE Error

You need to stop the old process before starting the new one.

### Stop the Stuck Process:

1.  Go to the terminal window in VS Code.
2.  Press Ctrl + C firmly (maybe multiple times) until you get a fresh command prompt (like `PS C:\...\EngineeringQuiz>`).
3.  If Ctrl + C doesn't work, close VS Code completely and then reopen your project. This usually kills any lingering processes.
4.  (Advanced - If needed): If it's still stuck, use the Task Manager (Windows) or Activity Monitor (Mac) to find and end any running "Node.js" processes, or use the command line method:
    *   Find PID: `netstat -ano | findstr ":3000"`
    *   Kill PID: `taskkill /F /PID <PID_NUMBER>`

### Restart the Server:

1.  Once you have a clean terminal prompt, start the server again:
    ```bash
    npm start
    ```
    It should now start correctly without the `EADDRINUSE` error.

### Hard Refresh the Browser:

1.  Go to http://localhost:3000.
2.  Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac) to force the browser to get the latest files from the now correctly running server.

This should resolve both the server startup error and the frontend data loading error.