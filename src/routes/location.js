import { Router } from "express";

import {
  createCountry,
  getAllCountries,
  updateCountry,
  deleteCountry,
  createState,
  getAllStates,
  getStatesByCountry,
  updateState,
  deleteState,
  createCity,
  getAllCities,
  getCitiesByState,
  updateCity,
  deleteCity,
} from "../controllers/location.js";
import { upload } from "../middlewares/multer.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Geolocation management (Countries, States, Cities)
 */

/* ------------------------------------------------
   COUNTRY ROUTES
--------------------------------------------------- */

/**
 * @swagger
 * /location/countries:
 *   post:
 *     summary: Create a country
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Country name (must be unique)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Country image (required)
 *     responses:
 *       201:
 *         description: Country created
 *       400:
 *         description: Name or image missing / country already exists
 *   get:
 *     summary: Get all countries
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: List of countries
 */
router.post("/countries", upload.single("image"), createCountry);
router.get("/countries", getAllCountries);

/**
 * @swagger
 * /location/countries/{id}:
 *   put:
 *     summary: Update a country
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New country name
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Replacement image (optional)
 *     responses:
 *       200:
 *         description: Country updated
 *       400:
 *         description: Country name already exists
 *       404:
 *         description: Country not found
 *   delete:
 *     summary: Delete a country
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country deleted
 *       400:
 *         description: Cannot delete country with existing states
 *       404:
 *         description: Country not found
 */
router.put("/countries/:id", upload.single("image"), updateCountry);
router.delete("/countries/:id", deleteCountry);

/* ------------------------------------------------
   STATE ROUTES
--------------------------------------------------- */

/**
 * @swagger
 * /location/states:
 *   post:
 *     summary: Create a state
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - country
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: State name (must be unique within the country)
 *               country:
 *                 type: string
 *                 description: Parent country ID
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: State image (required)
 *     responses:
 *       201:
 *         description: State created
 *       400:
 *         description: Name, country, or image missing / state already exists
 *       404:
 *         description: Country not found
 *   get:
 *     summary: Get all states
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: List of states
 */
router.post("/states", upload.single("image"), createState);
router.get("/states", getAllStates);

/**
 * @swagger
 * /location/states/by-country/{countryId}:
 *   get:
 *     summary: Get states by country ID
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *     responses:
 *       200:
 *         description: List of states in the country
 *       404:
 *         description: Country not found
 */
router.get("/states/by-country/:countryId", getStatesByCountry);

/**
 * @swagger
 * /location/states/{id}:
 *   put:
 *     summary: Update a state
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: State ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New state name
 *               country:
 *                 type: string
 *                 description: Parent country ID
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Replacement image (optional)
 *     responses:
 *       200:
 *         description: State updated
 *       400:
 *         description: State name already exists
 *       404:
 *         description: State not found
 *   delete:
 *     summary: Delete a state
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: State ID
 *     responses:
 *       200:
 *         description: State deleted
 *       400:
 *         description: Cannot delete state with existing cities
 *       404:
 *         description: State not found
 */
router.put("/states/:id", upload.single("image"), updateState);
router.delete("/states/:id", deleteState);

/* ------------------------------------------------
   CITY ROUTES
--------------------------------------------------- */

/**
 * @swagger
 * /location/cities:
 *   post:
 *     summary: Create a city
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - state
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: City name (must be unique within the state)
 *               state:
 *                 type: string
 *                 description: Parent state ID
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: City image (required)
 *     responses:
 *       201:
 *         description: City created
 *       400:
 *         description: Name, state, or image missing / city already exists
 *       404:
 *         description: State not found
 *   get:
 *     summary: Get all cities
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: List of cities
 */
router.post("/cities", upload.single("image"), createCity);
router.get("/cities", getAllCities);

/**
 * @swagger
 * /location/cities/by-state/{stateId}:
 *   get:
 *     summary: Get cities by state ID
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *         description: State ID
 *     responses:
 *       200:
 *         description: List of cities in the state
 *       404:
 *         description: State not found
 */
router.get("/cities/by-state/:stateId", getCitiesByState);

/**
 * @swagger
 * /location/cities/{id}:
 *   put:
 *     summary: Update a city
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New city name
 *               state:
 *                 type: string
 *                 description: Parent state ID
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Replacement image (optional)
 *     responses:
 *       200:
 *         description: City updated
 *       400:
 *         description: City name already exists
 *       404:
 *         description: City not found
 *   delete:
 *     summary: Delete a city
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *     responses:
 *       200:
 *         description: City deleted
 *       404:
 *         description: City not found
 */
router.put("/cities/:id", upload.single("image"), updateCity);
router.delete("/cities/:id", deleteCity);

export default router;
