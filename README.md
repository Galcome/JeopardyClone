# After Hours Answers

A local-only bachelor-party quiz game with a host controller, clean TV display, and optional phone buzzers.

## Run It

```bash
npm install
npm run party
```

The terminal prints:

- `/host` for the laptop controller
- `/display` for the TV window
- `/join` for phones

Default host PIN: `4242`

## Party Setup

1. Run `npm run party` on the laptop.
2. Open `http://localhost:3000/host` on the laptop.
3. Open `http://localhost:3000/display` in another browser window and drag it to the TV.
4. Players scan the QR code on the host screen or type the join URL.
5. If venue Wi-Fi blocks devices from talking to the laptop, use a phone/laptop hotspot or run the game manually from the host screen.

## Edit Questions

Questions live in `game-data.json`.

Media files go in `public/media/` and can be referenced like:

```json
{
  "type": "video",
  "src": "/media/mandela/star-wars-line.mp4",
  "caption": "Local clip"
}
```

Supported media types: `image`, `audio`, `video`.

## Hidden Wager Tiles

Add `"special": "wager"` to a clue. The board does not reveal that it is special until selected. The host then enters the wager before scoring.

## Notes

The app is designed for local/private use. It does not fetch media or use cloud services. Put only files you are comfortable using on the party laptop.

