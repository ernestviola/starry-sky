# Starry Sky

A location identifier app that uses space as the background.

## Requirements:

Test users on the local stars around them at the current time. Users should be able to search the sky and check a star if that is the one they need to find.

Even if a star is incorrect, a user should still be able to get details of that star and maybe a closer photo if it's available.

## Tests

Should be able to test the API and maybe the database

## Routes

/test

- get: get a list of stars to find in the sim

```json
// response
{
  "success": true,
  "stars": [
    {
      "name": "",
      "found": false
    },
    {
      "name": "",
      "found": false
    }
  ]
}
```

- post: submit a star to the sim and return the list

```json
// request
{
  "coordinates": [123, 456]
}
```

```json
// response
{
  "success": true,
  "stars": [
    {
      "name": "",
      "found": true
    }
  ]
}
```

```json
// response
{
  "success": true,
  "message": "no star found"
}
```

## Next Steps

- Add a navbar
- Build a homepage with a hero. Explaining the app with links to explore and play
- Fix the UI
  - find a font i want to use
  - decide on colors (black, purple, and white)
  - decide on how to style containers and floating elements
- Write the about page and style
- Cloudbuild file
- Docker containers for client and server
- Setup database

# Sources

HygStar data
either d3-celestial's constellations.lines.json or
Stellarium's constellationship.fab
