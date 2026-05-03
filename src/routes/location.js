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
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Country created
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
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Country updated
 *   delete:
 *     summary: Delete a country
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country deleted
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
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: State created
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
 *     responses:
 *       200:
 *         description: List of states in country
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
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: State updated
 *   delete:
 *     summary: Delete a state
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: State deleted
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
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: City created
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
 *     responses:
 *       200:
 *         description: List of cities in state
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
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: City updated
 *   delete:
 *     summary: Delete a city
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: City deleted
 */
router.put("/cities/:id", upload.single("image"), updateCity);
router.delete("/cities/:id", deleteCity);

export default router;
