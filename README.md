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

In order to simulate the visuals, I need to create an API that returns the stars in the particular piece of sky.

Rather than returning all 120,000 stars and maybe more satellites, I can get a default location of San Diego, CA. Then we can ask the user for their location.

With the users location we can then move the sphere and fill out that piece of the sky.

We could put out multiple requests so that way we can fill out the rest of the window.7

Simulate the visuals
Build out the API
