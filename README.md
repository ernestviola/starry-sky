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

- Maybe write the star data to a json file split between healpix ids so we can efficiently load them?
- Constellations into its own json file
- Favicon for the page
- Button interactivity
- Slide in page transitions
- About page copy
- Cloudbuild file
- Docker containers for client and server
- Setup database
- query_disc: radius must < PI/2
  Error: query_disc: radius must < PI/2
  at query_disc_inclusive_nest (http://localhost:5173/node_modules/.vite/deps/@hscmap_healpix.js?v=42cdb7bf:173:28)
  at query_disc_inclusive_ring (http://localhost:5173/node_modules/.vite/deps/@hscmap_healpix.js?v=42cdb7bf:213:10)
  at http://localhost:5173/src/components/StarMap/index.jsx:188:3
  at Object.react_stack_bottom_frame (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=42cdb7bf:12655:13)
  at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=42cdb7bf:604:66)
  at commitHookEffectListMount (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=42cdb7bf:6370:153)
  at commitHookPassiveMountEffects (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=42cdb7bf:6405:55)
  at commitPassiveMountOnFiber (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=42cdb7bf:7371:22)
  at recursivelyTraversePassiveMountEffects (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=42cdb7bf:7359:5)
  at commitPassiveMountOnFiber (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=42cdb7bf:7425:14)

# Sources

- [HYG Star Database](https://codeberg.org/astronexus/hyg) — star catalog data. The archived repository lists the data under [CC BY-SA 4.0](https://github.com/astronexus/HYG-Database/blob/main/LICENSE).
- [Stellarium sky cultures: Western](https://github.com/Stellarium/stellarium-skycultures/tree/master/western) — Western constellation line patterns and associated names. The [Western sky culture description](https://github.com/Stellarium/stellarium-skycultures/blob/master/western/description.md) identifies its text and data as CC BY-SA.
- [International Astronomical Union (IAU)](https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx?hkey=bb9dc841-0618-41b5-ac70-149741062141) — official constellation names and abbreviations.
