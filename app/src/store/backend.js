import {EventService} from '@/services/eventService';

if (!process.env.VUE_APP_BACKEND_URL) {
    throw new Error('VUE_APP_BACKEND_URL is not set, please read README.md');
}

const BACKEND_URL = process.env.VUE_APP_BACKEND_URL;

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
 * Parse a fetch response body.
 *
 * @param {Response} response
 * @return {Promise<string|Record<string, string>>}
 */
async function parseResponseData(response) {
    let text = await response.text();
    if (text.length === 0) {
        return '';
    }

    let contentType = response.headers.get('content-type') ?? '';
    if (contentType.startsWith('application/json')) {
        return JSON.parse(text);
    }
    return text;
}

/**
 * @typedef {{body: string|Record<string, any>, status: number, headers: Headers}} MyResponse
 */

/**
 * Send an HTTP request, without any error handling.
 *
 * @param {string} method
 * @param {string} url
 * @param {object|null} data
 * @return {Promise<MyResponse>}
 */
async function request(method, url, data = null) {
    let headers = {};
    let body = null;

    let token = getToken();
    // TODO: Validate the token locally before sending it?
    if (token !== null) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (data !== null && data !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
    }

    // eslint-disable-next-line init-declarations
    let response;
    try {
        response = await fetch(BACKEND_URL + url, {method, headers, body});
    } catch (error) {
        // May throw TypeError on connectivity errors (which is weird but documented behavior).
        EventService.error.dispatch(error);
        throw error;
    }

    let myResponse = {
        body:       await parseResponseData(response),
        status:     response.status,
        headers:    response.headers,
    };

    if (!response.ok) {
        // eslint-disable-next-line init-declarations
        let error;
        if (typeof myResponse.body === 'string') {
            // These error statuses are known to contain meaningful messages in the body
            error = new Error(myResponse.body);
        } else {
            error = new Error(`Request failed with status code ${response.status}`);
        }
        error.response = myResponse;
        EventService.error.dispatch(error);
        throw error;
    }

    return myResponse;
}

/**
 * Send an authenticated (if possible) GET request
 *
 * @param {string} url
 * @return {Promise<Record<string, any>>}
 */
async function get(url) {
    let response = await request('GET', url);
    return response.body;
}

/**
 * Send an authenticated (if possible) POST request
 *
 * @param {string} url
 * @param {object} data
 * @return {Promise<Record<string, any>>}
 */
async function post(url, data) {
    let response = await request('POST', url, data);
    return response.body;
}

/**
 * Send an authenticated (if possible) DELETE request
 *
 * @param {string} url
 * @return {Promise<MyResponse>}
 */
function delete0(url) {
    // A body on DELETE requests is uncommon, so return the entire response, not just the body.
    return request('DELETE', url);
}

export default {
    get,
    post,
    delete: delete0,
    request,
    hasToken,
};
