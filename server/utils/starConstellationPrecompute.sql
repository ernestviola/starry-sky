UPDATE constellation_lines cl
SET "starId" = closest_star.star_id
FROM (
  SELECT cl2.id AS line_id, closest.id AS star_id
  FROM constellation_lines cl2
  JOIN LATERAL (
    SELECT hs.id,
      acos(
        sin(hs.decrad) * sin(cl2.decrad) +
        cos(hs.decrad) * cos(cl2.decrad) * cos(hs.rarad - cl2.rarad)
      ) AS dist
    FROM hyg_stars hs
    ORDER BY dist ASC
    LIMIT 1
  ) closest ON true
) closest_star
WHERE cl.id = closest_star.line_id;