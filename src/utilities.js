/**
 * Checks for collisions between two objects by using circles with a radius 
 * based off the largest dimension.
 * 
 * @param {*} A The first object.
 * @param {*} B The second object.
 * @returns True if collision detected.
 */
export function simpleCircleCollisionCheck(A, B) {
    let distSqr = ((A.pos.x - B.pos.x)*(A.pos.x - B.pos.x)) + ((A.pos.y - B.pos.y)*(A.pos.y - B.pos.y));
    let minDistSqr = (A.radius + B.radius)*(A.radius + B.radius);

    if (distSqr <= minDistSqr) {
        return true;
    }
}

/**
 * Checks for collisions between two rectangles by using Axis Aligned Bounding Boxes.
 * 
 * @param {*} A The first object.
 * @param {*} B The second object.
 * @returns True if collision detected.
 */
export function testAABB(A, B) {
    return (A.x + A.w > B.x) && (A.x < B.x + B.w) && (A.y + A.h > B.y) && (A.y < B.y + B.h);
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
