# Messenger Media Downloader

A utility for downloading photos/videos/audios from Facebook messenger.
The utility caches your session, so you will be prompted to log in only on the first launch or when failing to login with the cached session.
The progress is saved during downloading and media scanning, so you are safe to restart the utility.
Keep in mind that new messages that you receive after the scanning is started will be ignored.
To scan and download such messages, you will have to reinstall the utility.

## Usage

`node dist/app.js`

### Retrieve list of threads

This is be the first thing you do.
Execute the following line, `node dist/app.js --list`
You will then find a text file filled with a bunch of groupchats/private conversations and their assigned threadId.
The threadId is what you need during the next step.

### Download specific thread

Simply replace threadId with the one you would like to download.
`node dist/app.js --thread threadId`

## Large conversations

Messenger have a limit on the amount of calls you can send to their API.
The API will limit you if you try to download a large chat (which often happens with groupchats).
This is when you need the `-i` or `--infinite` flag. If you would hit the limit, the process is put to sleep
for about 3 minutes before it tries again.
The process is repeated until you hit the `--max-errors` count which defaults to 3.

## Output

Downloaded files are outputted to `outputs/<conversation_name>`.

## Command line options

```txt
-r, --reset - Resets the saved session, allows to relog to Facebook.

-a, --all - Download photos/videos/audios from all conversations.

-l, --list - List all conversations and their threadIds.

-i, --infinite - Keep retrying until all operations succeed.

-t, --thread <threadID> - Download photos/videos/audios from the conversation with given threadID.

-m, --max-errors <number> - Set the limit of errors to accept before interrupting, default is 3.

-d, --delay <number> - Delay before a new attempt is performed, default is 3.

-o, --read-threads-at-once <number> - Amount of threads to read at once, default is 30.

-y, --min-read-limit <number> - Minimum of posts to read at once, default is 250.

-x, --max-read-limit <number> - Maximum of posts to read at once, default is 500.

-e, --examples - Retrieve a list of examples.

-h, --help - Print help.

-V, --version - Print version.
```

## Requirements

[Node.js](https://nodejs.org/) is required to run the utility.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md)

## License

The utility is licensed under [MIT License](./LICENSE).
