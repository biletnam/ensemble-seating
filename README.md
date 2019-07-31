## Ensemble Seating
Ensemble Seating is Progressive Web App ([PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)) designed to help music teacher layout seating charts for their ensembles.

Features:

 - Build a seating chart section by section
 - Color code your ensemble sections
 - Mix and match groups of curved or straight rows
 - Assign performers to seats
 - Export as an image
 - And more

### Installation
A recent version of [Node.js](https://nodejs.org/) is required to build Ensemble Seating. After cloning the repository, execute the following in your terminal of choice:

```bash
npm ci
npm start
```

This will install all dependencies and begin serving the application at http://localhost:8080.

### Updates
New versions of the application follow [semantic versioning](https://semver.org/)&mdash;see the Releases tab for notable changes.

### The algorithm
Layout generation is split into a number of helper functions in `src/helpers/stage-helpers.js` in order to make the code more reusable between different modules within the app.

#### Regions
Regions are used to group multiple disparate layouts and display them in the same chart. For example, an orchestra would need to layout seats in concentric arcs, but might also contain several straight rows of wind or percussion instruments at the back of the ensemble.

Regions may be either curved or straight. If a region is curved, the angle of the arc is also customizable.

Example:
```json
{
  "name": "Strings",
  "id": "abcd1234",
  "curvedLayout": true,
  "angle": 180
}
```

#### Sections
Sections form the crux of the layout algorithm. Each section is completely independent of the others, and controls how many seats it contributes to each overall row in the ensemble. At rendering time, the ensemble's rows are generated by combining each section's settings in a breadth-first traversal across all sections.

A section may be offset from the front so that it doesn't contribute seats until a later row, or optionally configured so it gets pushed all the way to the back (such as for the bass section in a string orchestra). If a section runs out of rows before the other sections, it'll still contribute invisible, "implicit" seats to following rows so that the other sections' seats stay in their proper "wedge."

Each section must be assigned to a region in order to be rendered.

Example:
```json
{
  "name": "Violin 1",
  "color": "#000080",
  "id": "wxyz9876",
  "region": "abcd1234",
  "offsetType": "first-row",
  "offsetValue": 0,
  "rowSettings": [2, 4, 4]
}
```

#### Members
Ensemble members can be added to each section, and get seated in the layout in the order that they appear in the roster sidebar.

Each member must be assigned to a section in order to be rendered.

Example:
```json
{
  "name": "Jacqueline du Pré",
  "id": "5432zyxw",
  "section": "wxyz9876",
  "notes": ""
}
```
