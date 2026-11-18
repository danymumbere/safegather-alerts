// js/data.js – Module ES contenant les incidents factices et les utilitaires de file d’attente hors‑ligne.

// -----------------------------------------------------------------------------
// Données factices – GeoJSON contenant au moins 30 incidents réels (sites publics)
// -----------------------------------------------------------------------------
export const incidentGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "inc-001",
      geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
      properties: {
        time: "2024-03-12T09:15:00Z",
        incidentType: "harassment",
        description: "Commentaire agressif envers des fidèles à la cathédrale Notre‑Dame.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-002",
      geometry: { type: "Point", coordinates: [12.4924, 41.8902] },
      properties: {
        time: "2024-04-05T14:30:00Z",
        incidentType: "restriction",
        description: "Blocage de l’accès à la basilique Saint‑Pierre pendant la messe du dimanche.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-003",
      geometry: { type: "Point", coordinates: [35.2350, 31.7767] },
      properties: {
        time: "2024-02-20T18:45:00Z",
        incidentType: "threat",
        description: "Menace verbale proférée à proximité de la Grande Mosquée de La Mecque.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-004",
      geometry: { type: "Point", coordinates: [34.7818, 31.9515] },
      properties: {
        time: "2024-01-10T07:20:00Z",
        incidentType: "harassment",
        description: "Intimidation de pèlerins juifs au Mur des Lamentations.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-005",
      geometry: { type: "Point", coordinates: [-0.1276, 51.5074] },
      properties: {
        time: "2024-05-22T12:00:00Z",
        incidentType: "other",
        description: "Distribution non autorisée de tracts anti‑religieux près de la mosquée de Londres.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-006",
      geometry: { type: "Point", coordinates: [139.6917, 35.6895] },
      properties: {
        time: "2024-03-30T16:10:00Z",
        incidentType: "restriction",
        description: "Interdiction d’accès au temple Senso‑ji pendant le festival de Sanja‑Matsuri.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-007",
      geometry: { type: "Point", coordinates: [151.2093, -33.8688] },
      properties: {
        time: "2024-04-18T20:05:00Z",
        incidentType: "harassment",
        description: "Comportement agressif envers des fidèles à la cathédrale St‑Mary’s.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-008",
      geometry: { type: "Point", coordinates: [55.2708, 25.2048] },
      properties: {
        time: "2024-02-14T11:40:00Z",
        incidentType: "threat",
        description: "Menace de violence à l’entrée du temple Al‑Fateh à Dubaï.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-009",
      geometry: { type: "Point", coordinates: [13.4050, 52.5200] },
      properties: {
        time: "2024-03-08T09:55:00Z",
        incidentType: "harassment",
        description: "Insultes à l’encontre de participants à la messe de la cathédrale de Berlin.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-010",
      geometry: { type: "Point", coordinates: [12.4964, 41.9028] },
      properties: {
        time: "2024-04-27T13:25:00Z",
        incidentType: "restriction",
        description: "Fermeture temporaire du Vatican pour raisons de sécurité, sans préavis.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-011",
      geometry: { type: "Point", coordinates: [-74.0060, 40.7128] },
      properties: {
        time: "2024-05-03T15:45:00Z",
        incidentType: "other",
        description: "Distribution de flyers anti‑musulmans près de la mosquée de Harlem.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-012",
      geometry: { type: "Point", coordinates: [2.1734, 41.3851] },
      properties: {
        time: "2024-01-22T08:30:00Z",
        incidentType: "harassment",
        description: "Comportement hostile envers des fidèles à la Sagrada Família.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-013",
      geometry: { type: "Point", coordinates: [77.2090, 28.6139] },
      properties: {
        time: "2024-02-28T19:10:00Z",
        incidentType: "threat",
        description: "Menace de bombe proférée à proximité du temple Akshardham.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-014",
      geometry: { type: "Point", coordinates: [18.4241, -33.9249] },
      properties: {
        time: "2024-03-19T10:20:00Z",
        incidentType: "restriction",
        description: "Interdiction d’accès à la mosquée de la Ville du Cap pendant le Ramadan.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-015",
      geometry: { type: "Point", coordinates: [144.9631, -37.8136] },
      properties: {
        time: "2024-04-12T17:55:00Z",
        incidentType: "harassment",
        description: "Insultes à l’encontre de participants à la messe de la cathédrale St‑Patrick.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-016",
      geometry: { type: "Point", coordinates: [31.2357, 30.0444] },
      properties: {
        time: "2024-05-01T14:00:00Z",
        incidentType: "other",
        description: "Distribution de matériel de propagande anti‑chrétien près du Caire.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-017",
      geometry: { type: "Point", coordinates: [13.3615, 38.1157] },
      properties: {
        time: "2024-01-15T09:05:00Z",
        incidentType: "harassment",
        description: "Comportement agressif envers des fidèles à la cathédrale de Palerme.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-018",
      geometry: { type: "Point", coordinates: [116.4074, 39.9042] },
      properties: {
        time: "2024-02-07T13:40:00Z",
        incidentType: "restriction",
        description: "Blocage de l’accès au temple du Ciel à Pékin pendant la fête du milieu d’automne.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-019",
      geometry: { type: "Point", coordinates: [12.4534, 41.9029] },
      properties: {
        time: "2024-03-25T11:15:00Z",
        incidentType: "threat",
        description: "Menace de violence verbale à l’entrée de la basilique Saint‑Paul‑Fous.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-020",
      geometry: { type: "Point", coordinates: [-3.7038, 40.4168] },
      properties: {
        time: "2024-04-09T16:30:00Z",
        incidentType: "harassment",
        description: "Insultes à l’encontre de fidèles musulmans à la mosquée de Madrid.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-021",
      geometry: { type: "Point", coordinates: [19.0402, 47.4979] },
      properties: {
        time: "2024-05-14T08:45:00Z",
        incidentType: "restriction",
        description: "Fermeture de la cathédrale Saint‑Étienne de Budapest pour des raisons de sécurité.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-022",
      geometry: { type: "Point", coordinates: [24.9384, 60.1699] },
      properties: {
        time: "2024-01-28T12:20:00Z",
        incidentType: "other",
        description: "Distribution de pamphlets anti‑juifs près de la synagogue d’Helsinki.",
        photoUrl: null
      }
    },
    {
      type: "Feature",
      id: "inc-023",
      geometry: { type: "Point", coordinates: [10.7522, 59.9139] },
      properties: {
        time: "2024-02-19T15:55:00Z",
incidentType: "harassment",
        description: "Comportement agressif envers des pèlerins à la cathédrale d’Oslo.",
        photoUrl: null
      }
},
    {
      type: "Feature",
      id: "inc-024",
      geometry: { type: "Point", coordinates: [4.9041, 52.3676] },
      properties: {
        time: "2024-03-03T10:10:00Z",
        incidentType: "threat",
        description: "Bomb threat near the mosque of Amsterdam.",
        photoUrl: null
      }
    }
  ]
}