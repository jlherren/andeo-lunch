import randomBytes from 'randombytes';

const DEVICE_ID_KEY = 'device-id';

/**
 * @returns {string}
 */
export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (deviceId === null) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

/**
 * @returns {string}
 */
function generateDeviceId() {
    return randomBytes(16).toString('hex');
}
