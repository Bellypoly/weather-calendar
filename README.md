# What's Cooking, Thailand?

An interactive D3 temperature map of Thailand. Select a province to see its annual or monthly temperature mood, average values, and low/high ranges.

## Run Locally

This project is a static site, but it needs a local server so JSON files can load correctly.

```bash
npm start
```

Then open:

```text
http://127.0.0.1:8000
```

## Project Files

- `index.html` - page structure and UI panels.
- `styles.css` - layout, fonts, map frame, legend, heat mood, and circle styling.
- `map.js` - D3 map rendering, mode switching, unit conversion, and temperature logic.
- `thailand.json` - province GeoJSON.
- `temperature.json` - province temperature data.
- `map_bg.png` - watercolor background for the map frame.
- `sunny.png` - header mascot image.
- `d3.v3.min.js` - local D3 v3 dependency.

## Temperature Data Shape

Each province row in `temperature.json` uses this structure:

```json
{
  "city": "Bangkok",
  "temperatures": {
    "Jan": 80.5,
    "Feb": 83,
    "Mar": 85.5
  },
  "avg": 84.125,
  "high": {
    "Jan": 91,
    "Feb": 94,
    "Mar": 96
  },
  "low": {
    "Jan": 70,
    "Feb": 72,
    "Mar": 75
  }
}
```

`city` must match the province `properties.name` value in `thailand.json`.

## Modes

- `Annual` mode colors provinces by `avg`.
- `Monthly` mode colors provinces by the selected month.
- Monthly circle values are calculated from `(low[month] + high[month]) / 2`.
- Circle hover shows the selected province's low/high values for that month.
- The unit toggle switches all visible temperature values between Fahrenheit and Celsius.

## Sources

- Weather comparison data: https://weatherspark.com/compare
- Thailand GeoJSON: https://github.com/apisit/thailand.json
