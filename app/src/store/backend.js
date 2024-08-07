import Axios from 'axios';
import {EventService} from '@/services/eventService';

if (!process.env.VUE_APP_BACKEND_URL) {
    throw new Error('VUE_APP_BACKEND_URL is not set, please read README.md');
}

const BACKEND_URL = process.env.VUE_APP_BACKEND_URL;

let axios = Axios.create();

/**
 * Check whether an authorization token exists at all
 *
 * @return {boolean}
 */
function hasToken() {
    // TODO: Validate the token here?
    return !!getToken();
}

/**
 * Get the authorization token
 *
 * @return {string|null}
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * @param {object} config
 */
function addAuthorizationHeader(config) {
    let token = getToken();
    // TODO: Validate the token locally before sending it?
    if (token !== null) {
        config.headers ??= {};
        config.headers.Authorization = `Bearer ${token}`;
    }
}

/**
 * Process an Axios thrown error to contain a better error message
 *
 * @param {Error} error
 */
function processError(error) {
    let message = error?.response?.data;
    if (message) {
        // These error statuses are known to contain meaningful messages in the body
        error.message = message;
    }
}

/**
 * Send an authenticated (if possible) GET request
 *
 * @param {string} url
 * @param {object} config
 * @return {Promise<AxiosResponse<any>>}
 */
async function get(url, config = {}) {
    addAuthorizationHeader(config);
    try {
        return await axios.get(BACKEND_URL + url, config);
    } catch (err) {
        processError(err);
        EventService.error.dispatch(err);
        throw err;
    }
}

/**
 * Send an authenticated (if possible) POST request
 *
 * @param {string} url
 * @param {object} data
 * @param {object} config
 * @return {Promise<AxiosResponse<any>>}
 */
async function post(url, data, config = {}) {
    addAuthorizationHeader(config);
    try {
        return await axios.post(BACKEND_URL + url, data, config);
    } catch (err) {
        processError(err);
        EventService.error.dispatch(err);
        throw err;
    }
}

/**
 * Send an authenticated (if possible) DELETE request
 *
 * @param {string} url
 * @param {object} config
 * @return {Promise<AxiosResponse<any>>}
 */
async function delete0(url, config = {}) {
    addAuthorizationHeader(config);
    try {
        return await axios.delete(BACKEND_URL + url, config);
    } catch (err) {
        processError(err);
        EventService.error.dispatch(err);
        throw err;
    }
}

export default {
    get,
    post,
    delete: delete0,
    hasToken,
};
