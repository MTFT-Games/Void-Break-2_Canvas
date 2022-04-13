/**
 * Checks for collisions between two objects by using circles with a radius 
 * based off the largest dimension.
 * 
 * @param {*} A The first object.
 * @param {*} B The second object.
 * @returns True if collision detected.
 */
function simpleCircleCollisionCheck(A, B) {
    let ACircle = { x: A.x, y: A.y };
    let BCircle = { x: B.x, y: B.y };
    if (A.width > A.height) {
        ACircle.radius = A.width/2;
    }else {
        ACircle.radius = A.height/2;
    }
    if (B.width > B.height) {
        BCircle.radius = B.width/2;
    }else {
        BCircle.radius = B.height/2;
    }

    let distSqr = ((ACircle.x - BCircle.x)*(ACircle.x - BCircle.x)) + ((ACircle.y - BCircle.y)*(ACircle.y - BCircle.y));
    let minDistSqr = (ACircle.radius + BCircle.radius)*(ACircle.radius + BCircle.radius);

    if (distSqr <= minDistSqr) {
        return true;
    }
}

/**
 * Normalizes a vector.
 * 
 * @param {*} vector The vector to be normalized.
 * @returns The normalized vector.
 */
function normalizeVector(vector) {
    let result = {};
    let magnitude = Math.sqrt(((vector.x)*(vector.x))+((vector.y)*(vector.y)));
    result.x = vector.x / magnitude;
    result.y = vector.y / magnitude;
    return result;
}
