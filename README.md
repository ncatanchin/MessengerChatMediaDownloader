# Messenger Media Downloader

A utility for downloading photos/videos/audios from facebook messenger chats.
The utility caches your session, so you will be prompted to log in only on the first launch or when to fail to log in with the cached session.
Downloading and media scanning save progress, so you are safe to restart the utility. Keep in mind that new messages that you receive after
conversation scanning started will be ignored. To scan & download such messages, you will have to reinstall the utility.

## Command line options

```txt
-r, --reset - Resets the saved session, allows to relog to Facebook

-a, --all - Download photos/videos/audios from all conversations

-l, --list - List all conversations and their threadIds

-t, --thread <threadID> - Download photos/videos/audios from the conversation with given threadID

-i, --infinite - Keep retrying until all operations succeed

-me, --max-errors <number> - Set the limit of errors to accept before interrupting, default is 3

-minrl, --min-read-limit <number> - Minimum of posts to read at once, default is 100

-maxrl, --max-read-limit <number> - Maximum of posts to read at once, default is 500

-readthr, --read-threads-at-once <number> - Amount of threads to read at once, default is 15

-h, --help - Print help

-V, --version - Print version
```

There seem to be some kind of API calls limit so if you attempt to dump media from a large conversation
or all conversations, you will most likely hit the limit. That's why there's is -i, --infinite option, so the utility will keep retrying
to dump everything until it succeeds.

## Usage

`node dist/app.js`

## Requirements

[Node.js](https://nodejs.org/) is required to run the utility.

Command line options are pretty self-explanatory.
Run with -a, -all option to dump media from all conversations.
To dump media from a single conversation you have to get its threadId. In order to do that run the utility with -l, --list option,
read threadId of the conversation you are interested in, and then run the utility with -t --thread &lt;threadId&gt; option.
I recommend to run the above along with -i, --infinite, see [the section above](#infinite_explanation) for the explanation.

## Output

Downloaded files are outputted to `./outputs/<conversation_name>`.

## Getting started

See [CONTRIBUTING](CONTRIBUTING.md)

## License

The utility is licensed under [MIT License](./LICENSE).
