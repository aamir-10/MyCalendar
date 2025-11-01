import { useEffect, useState } from "react";

export default function Holidays(year) {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (!year) return;

    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`)
      .then(res => res.json())
      .then(data => {
        setHolidays(
          data.map(h => ({
            date: h.date,     // "2025-01-26"
            name: h.name,     // "Republic Day"
            type: h.types?.[0] || "Public Holiday"
          }))
        );
      })
      .catch(err => console.error("Holiday fetch error:", err));
  }, [year]);

  return holidays;
}
